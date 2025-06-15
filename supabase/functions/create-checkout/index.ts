
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  logStep("Function invoked", { method: req.method, url: req.url });

  if (req.method === "OPTIONS") {
    logStep("Handling OPTIONS request");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Starting create-checkout function");

    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");

    logStep("Environment check", { 
      hasSupabaseUrl: !!supabaseUrl, 
      hasSupabaseKey: !!supabaseAnonKey, 
      hasStripeKey: !!stripeSecretKey 
    });

    if (!supabaseUrl || !supabaseAnonKey) {
      const missing = [];
      if (!supabaseUrl) missing.push("SUPABASE_URL");
      if (!supabaseAnonKey) missing.push("SUPABASE_ANON_KEY");
      
      logStep("Missing environment variables", { missing });
      throw new Error(`Missing environment variables: ${missing.join(", ")}`);
    }

    if (!stripeSecretKey) {
      logStep("Missing Stripe secret key");
      throw new Error("Stripe secret key not configured");
    }

    // Create Supabase client for authentication
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    logStep("Supabase client created");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logStep("No authorization header");
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    logStep("Extracted token", { tokenLength: token.length });

    // Use getUser to authenticate
    const { data, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError) {
      logStep("Auth error", { error: authError.message, code: authError.status });
      throw new Error(`Authentication failed: ${authError.message}`);
    }

    const user = data.user;
    if (!user?.email) {
      logStep("No user or email found", { hasUser: !!user, hasEmail: !!user?.email });
      throw new Error("User not authenticated or email not available");
    }
    
    logStep("User authenticated successfully", { userId: user.id, email: user.email });

    let requestBody;
    try {
      requestBody = await req.json();
      logStep("Request body parsed", { body: requestBody });
    } catch (parseError) {
      logStep("Failed to parse request body", { error: parseError.message });
      throw new Error("Invalid JSON in request body");
    }

    const { priceId } = requestBody;
    
    if (!priceId) {
      logStep("Missing priceId in request");
      throw new Error("Price ID is required");
    }
    
    logStep("Price ID received", { priceId });

    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });
    logStep("Stripe client initialized");
    
    // Check for existing customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId });
    } else {
      logStep("No existing customer found, will create new one");
    }

    const origin = req.headers.get("origin") || "https://loving-turkey-5acd41.lovableproject.com";
    logStep("Using origin for redirect URLs", { origin });
    
    const sessionConfig = {
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription" as const,
      success_url: `${origin}/onboarding?success=true`,
      cancel_url: `${origin}/onboarding`,
    };

    logStep("Creating Stripe session", { config: sessionConfig });

    const session = await stripe.checkout.sessions.create(sessionConfig);

    logStep("Checkout session created successfully", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorDetails = error instanceof Error ? { 
      name: error.name,
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 5).join('\n')
    } : { error: String(error) };
    
    logStep("ERROR in create-checkout", errorDetails);
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: errorDetails
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
