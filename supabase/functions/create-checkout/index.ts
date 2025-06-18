import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.38.4";
import Stripe from "npm:stripe@12.18.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") || "";
const appUrl = Deno.env.get("APP_URL") || "https://talkigen.com";

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2023-10-16",
});

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Get the JWT token from the request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verify the JWT token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: userError?.message || "Invalid token" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse the request body
    const { priceId } = await req.json();

    if (!priceId) {
      return new Response(
        JSON.stringify({ error: "Price ID is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if user already has a Stripe customer ID
    const { data: subscriber, error: subscriberError } = await supabase
      .from("subscribers")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    let customerId = subscriber?.stripe_customer_id;

    // If no customer ID exists, create a new customer
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id,
        },
      });
      customerId = customer.id;

      // Store the customer ID in the database
      await supabase.from("subscribers").upsert({
        user_id: user.id,
        email: user.email,
        stripe_customer_id: customerId,
        subscribed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      });
    }

    // Check for existing active subscriptions
    const existingSubscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 10,
    });

    // If there are existing active subscriptions, we need to handle the upgrade
    if (existingSubscriptions.data.length > 0) {
      console.log(`Found ${existingSubscriptions.data.length} existing active subscriptions for customer ${customerId}`);
      
      // Get the current subscription
      const currentSubscription = existingSubscriptions.data[0];
      
      // Get the current price ID
      const currentPriceId = currentSubscription.items.data[0].price.id;
      
      // If trying to subscribe to the same plan, redirect to success
      if (currentPriceId === priceId) {
        return new Response(
          JSON.stringify({ url: `${appUrl}/onboarding?success=true` }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      // For plan changes, update the existing subscription instead of creating a new checkout
      try {
        const updatedSubscription = await stripe.subscriptions.update(currentSubscription.id, {
          items: [{
            id: currentSubscription.items.data[0].id,
            price: priceId,
          }],
          proration_behavior: 'create_prorations',
          metadata: {
            user_id: user.id,
            upgrade_from: currentPriceId,
            upgrade_to: priceId,
          },
        });

        console.log(`Successfully upgraded subscription ${currentSubscription.id} from ${currentPriceId} to ${priceId}`);

        // Return success URL since the upgrade was immediate
        return new Response(
          JSON.stringify({ url: `${appUrl}/onboarding?success=true` }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      } catch (upgradeError) {
        console.error("Error upgrading subscription:", upgradeError);
        // Fall back to creating a new checkout session if upgrade fails
      }
    }

    // Set success URL to onboarding with success parameter
    const successUrl = `${appUrl}/onboarding?success=true`;

    // Create a checkout session for new subscriptions
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: successUrl,
      cancel_url: `${appUrl}/onboarding`,
      subscription_data: {
        metadata: {
          user_id: user.id,
        },
      },
      // Automatically cancel any existing subscriptions when this one becomes active
      allow_promotion_codes: true,
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});