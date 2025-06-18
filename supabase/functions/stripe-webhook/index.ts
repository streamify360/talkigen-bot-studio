
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received", { method: req.method });

    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeSecretKey || !webhookSecret) {
      throw new Error("Missing Stripe configuration");
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });
    
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      throw new Error("Missing Stripe signature");
    }

    logStep("Verifying webhook signature");
    // Use the async version to avoid the SubtleCryptoProvider error
    const event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    logStep("Webhook verified", { eventType: event.type, eventId: event.id });

    // Use service role key for database operations
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await handleSubscriptionEvent(stripe, supabase, event);
        break;
      
      case "invoice.payment_succeeded":
      case "invoice.payment_failed":
        await handlePaymentEvent(stripe, supabase, event);
        break;
      
      default:
        logStep("Unhandled event type", { eventType: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in webhook", { message: errorMessage });
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

async function handleSubscriptionEvent(stripe: Stripe, supabase: any, event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;
  logStep("Processing subscription event", { 
    subscriptionId: subscription.id, 
    status: subscription.status,
    customerId: subscription.customer 
  });

  try {
    // Get customer details
    const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer;
    if (!customer.email) {
      logStep("No email found for customer");
      return;
    }

    logStep("Found customer", { email: customer.email });

    // Determine subscription status and tier
    const isActive = subscription.status === "active";
    let subscriptionTier = null;
    let subscriptionEnd = null;

    if (isActive && subscription.items.data.length > 0) {
      const priceId = subscription.items.data[0].price.id;
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      
      // Map price IDs to tiers
      if (priceId === "price_1RaAUYEJIUEdIR4s8USTWPFd") {
        subscriptionTier = "Starter";
      } else if (priceId === "price_1RaAVmEJIUEdIR4siObOCgbi") {
        subscriptionTier = "Professional";
      } else if (priceId === "price_1RaAXZEJIUEdIR4si9jYeo4t") {
        subscriptionTier = "Enterprise";
      }
    }

    // Update subscribers table
    const { error: subscribersError } = await supabase
      .from("subscribers")
      .upsert({
        email: customer.email,
        stripe_customer_id: customer.id,
        subscribed: isActive,
        subscription_tier: subscriptionTier,
        subscription_end: subscriptionEnd,
        webhook_received: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'email' });

    if (subscribersError) {
      logStep("Error updating subscribers", { error: subscribersError });
    } else {
      logStep("Updated subscribers table", { 
        email: customer.email, 
        subscribed: isActive, 
        tier: subscriptionTier 
      });
    }

    // Get user by email to update profile
    const { data: authUser } = await supabase.auth.admin.getUserByEmail(customer.email);
    
    if (authUser?.user) {
      const subscriptionStatus = isActive ? subscriptionTier?.toLowerCase() || 'active' : 'inactive';
      
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          subscription_status: subscriptionStatus,
          updated_at: new Date().toISOString()
        })
        .eq("id", authUser.user.id);

      if (profileError) {
        logStep("Error updating profile", { error: profileError });
      } else {
        logStep("Updated profile subscription status", { status: subscriptionStatus });
      }
    }

  } catch (error) {
    logStep("Error in handleSubscriptionEvent", { error: error.message });
  }
}

async function handlePaymentEvent(stripe: Stripe, supabase: any, event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice;
  logStep("Processing payment event", { 
    invoiceId: invoice.id, 
    status: invoice.status,
    customerId: invoice.customer 
  });

  // Handle payment success/failure logic if needed
  // This could update payment history, send notifications, etc.
}
