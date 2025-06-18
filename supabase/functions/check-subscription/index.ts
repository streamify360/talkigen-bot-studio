import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.38.4";
import Stripe from "npm:stripe@12.18.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") || "";

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

    // Check if user has a subscription in the database
    const { data: subscriber, error: subscriberError } = await supabase
      .from("subscribers")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (subscriberError) {
      return new Response(
        JSON.stringify({ error: subscriberError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // If no subscriber record exists, return default values
    if (!subscriber) {
      return new Response(
        JSON.stringify({
          subscribed: false,
          subscription_tier: null,
          subscription_end: null,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // If the user has a Stripe customer ID, verify the subscription status with Stripe
    if (subscriber.stripe_customer_id) {
      try {
        // Get all subscriptions for the customer
        const subscriptions = await stripe.subscriptions.list({
          customer: subscriber.stripe_customer_id,
          status: 'all',
          limit: 1,
        });

        if (subscriptions.data.length > 0) {
          const subscription = subscriptions.data[0];
          
          // Get the product details
          const product = await stripe.products.retrieve(
            subscription.items.data[0].price.product.toString()
          );

          // Update the subscriber record with the latest information from Stripe
          const isActive = subscription.status === 'active';
          
          // Prepare update data
          const updateData = {
            subscribed: isActive,
            subscription_tier: product.name,
            subscription_end: new Date(subscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          };

          // Update the subscriber record
          await supabase
            .from("subscribers")
            .update(updateData)
            .eq("user_id", user.id);

          // Return the updated subscription information
          return new Response(
            JSON.stringify({
              subscribed: isActive,
              subscription_tier: product.name,
              subscription_end: new Date(subscription.current_period_end * 1000).toISOString(),
            }),
            {
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
      } catch (stripeError) {
        console.error("Error checking Stripe subscription:", stripeError);
        // Continue with the database information if Stripe API fails
      }
    }

    // Return the subscription information from the database
    return new Response(
      JSON.stringify({
        subscribed: subscriber.subscribed,
        subscription_tier: subscriber.subscription_tier,
        subscription_end: subscriber.subscription_end,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error checking subscription:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});