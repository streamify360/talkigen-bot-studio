import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import Stripe from "npm:stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Use anon key for user authentication
  const supabaseAuth = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  // Use service role key for database operations
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    // Get Stripe secret key from environment variables
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    if (!STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY environment variable is not configured");
    }
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    logStep("Authenticating user with token");
    
    // Use the anon client to authenticate the user
    const { data: userData, error: userError } = await supabaseAuth.auth.getUser(token);
    if (userError) {
      logStep("Authentication error", { error: userError.message });
      throw new Error(`Authentication error: ${userError.message}`);
    }
    
    const user = userData.user;
    if (!user?.email) {
      logStep("No user or email found");
      throw new Error("User not authenticated or email not available");
    }
    
    logStep("User authenticated", { userId: user.id, email: user.email });

    // First check if we already have subscription data in the database
    const { data: existingSubscriber, error: subscriberError } = await supabaseAdmin
      .from("subscribers")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!subscriberError && existingSubscriber) {
      logStep("Found existing subscriber in database", { 
        subscribed: existingSubscriber.subscribed,
        tier: existingSubscriber.subscription_tier
      });
      
      // Return the existing data if it's recent (less than 1 hour old)
      const lastUpdated = new Date(existingSubscriber.updated_at);
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      if (lastUpdated > oneHourAgo) {
        logStep("Using cached subscription data (less than 1 hour old)");
        return new Response(JSON.stringify({
          subscribed: existingSubscriber.subscribed,
          subscription_tier: existingSubscriber.subscription_tier,
          subscription_end: existingSubscriber.subscription_end
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
      
      logStep("Cached data is stale, checking with Stripe");
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, { 
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient()
    });
    
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found, updating unsubscribed state");
      await supabaseAdmin.from("subscribers").upsert({
        email: user.email,
        user_id: user.id,
        stripe_customer_id: null,
        subscribed: false,
        subscription_tier: null,
        subscription_end: null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'email' });
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });
    const hasActiveSub = subscriptions.data.length > 0;
    let subscriptionTier = null;
    let subscriptionEnd = null;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      logStep("Active subscription found", { subscriptionId: subscription.id, endDate: subscriptionEnd });
      
      const priceId = subscription.items.data[0].price.id;
      if (priceId === "price_1RaAUYEJIUEdIR4s8USTWPFd") {
        subscriptionTier = "Starter";
      } else if (priceId === "price_1RaAVmEJIUEdIR4siObOCgbi") {
        subscriptionTier = "Professional";
      } else if (priceId === "price_1RaAXZEJIUEdIR4si9jYeo4t") {
        subscriptionTier = "Enterprise";
      }
      logStep("Determined subscription tier", { priceId, subscriptionTier });
    } else {
      logStep("No active subscription found");
    }

    await supabaseAdmin.from("subscribers").upsert({
      email: user.email,
      user_id: user.id,
      stripe_customer_id: customerId,
      subscribed: hasActiveSub,
      subscription_tier: subscriptionTier,
      subscription_end: subscriptionEnd,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'email' });

    logStep("Updated database with subscription info", { subscribed: hasActiveSub, subscriptionTier });
    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      subscription_tier: subscriptionTier,
      subscription_end: subscriptionEnd
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});