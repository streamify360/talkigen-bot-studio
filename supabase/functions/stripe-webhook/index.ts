
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
    logStep("Webhook received");

    const signature = req.headers.get("stripe-signature");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!signature || !webhookSecret) {
      throw new Error("Missing signature or webhook secret");
    }

    const body = await req.text();
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    logStep("Event verified", { type: event.type, id: event.id });

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        
        if (customer.deleted) {
          logStep("Customer deleted, skipping");
          break;
        }

        const email = (customer as Stripe.Customer).email;
        if (!email) {
          logStep("No email found for customer");
          break;
        }

        const isActive = subscription.status === 'active';
        let subscriptionTier = null;
        let subscriptionEnd = null;

        if (isActive) {
          const priceId = subscription.items.data[0].price.id;
          const price = await stripe.prices.retrieve(priceId);
          const amount = price.unit_amount || 0;
          
          if (amount <= 999) {
            subscriptionTier = "Starter";
          } else if (amount <= 1999) {
            subscriptionTier = "Professional";
          } else {
            subscriptionTier = "Enterprise";
          }
          
          subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
        }

        const { error } = await supabaseClient
          .from('subscribers')
          .upsert({
            email,
            stripe_customer_id: subscription.customer as string,
            subscribed: isActive,
            subscription_tier: subscriptionTier,
            subscription_end: subscriptionEnd,
            updated_at: new Date().toISOString(),
            webhook_received: new Date().toISOString(),
          }, { onConflict: 'email' });

        if (error) {
          logStep("Error updating subscription", error);
          throw error;
        }

        logStep("Subscription updated", { 
          email, 
          subscribed: isActive, 
          tier: subscriptionTier 
        });
        break;
      }

      case 'invoice.payment_succeeded':
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customer = await stripe.customers.retrieve(invoice.customer as string);
        
        if (customer.deleted) break;

        const email = (customer as Stripe.Customer).email;
        if (!email) break;

        // Update webhook received timestamp
        await supabaseClient
          .from('subscribers')
          .update({ 
            webhook_received: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('email', email);

        logStep("Payment event processed", { 
          email, 
          type: event.type,
          status: invoice.status 
        });
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
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
