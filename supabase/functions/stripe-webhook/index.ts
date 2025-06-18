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

serve(async (req) => {
  try {
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      return new Response(JSON.stringify({ error: "No signature provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await req.text();
    let event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, stripeWebhookSecret);
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return new Response(JSON.stringify({ error: `Webhook Error: ${err.message}` }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`Received event: ${event.type}`);

    // Handle the event
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionChange(event.data.object);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionCancelled(event.data.object);
        break;
      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(event.data.object);
        break;
      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object);
        break;
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

async function handleCheckoutCompleted(session) {
  try {
    console.log("Processing checkout completion:", session.id);

    if (session.mode !== 'subscription') {
      console.log("Not a subscription checkout, skipping");
      return;
    }

    // Get the customer ID from the session
    const customerId = session.customer;

    // Get the subscription ID from the session
    const subscriptionId = session.subscription;

    if (!subscriptionId) {
      console.error("No subscription ID in checkout session");
      return;
    }

    // Cancel any other active subscriptions for this customer (except the new one)
    await cancelOtherSubscriptions(customerId, subscriptionId);

    // Get the subscription details
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ["items.data.price.product"],
    });

    // Get the product name (plan tier)
    const productName = subscription.items.data[0].price.product.name;

    // Get the user ID from the subscriber record
    const { data: subscriber, error: subscriberError } = await supabase
      .from("subscribers")
      .select("user_id, email")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();

    if (subscriberError || !subscriber) {
      console.error("Error finding subscriber:", subscriberError || "No subscriber found");
      return;
    }

    // Update the subscriber record immediately with the most recent subscription
    await updateSubscriberWithLatestSubscription(customerId, subscriber.user_id);

  } catch (error) {
    console.error("Error in handleCheckoutCompleted:", error);
  }
}

async function cancelOtherSubscriptions(customerId, keepSubscriptionId) {
  try {
    console.log(`Checking for other active subscriptions for customer ${customerId}`);
    
    // Get all active subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 10,
    });

    // Cancel all subscriptions except the one we want to keep
    for (const subscription of subscriptions.data) {
      if (subscription.id !== keepSubscriptionId) {
        console.log(`Cancelling old subscription ${subscription.id}`);
        await stripe.subscriptions.cancel(subscription.id, {
          prorate: true,
        });
        console.log(`Successfully cancelled subscription ${subscription.id}`);
      }
    }
  } catch (error) {
    console.error("Error cancelling other subscriptions:", error);
  }
}

async function updateSubscriberWithLatestSubscription(customerId, userId) {
  try {
    console.log(`Updating subscriber ${userId} with latest subscription info`);

    // Get all subscriptions for this customer, ordered by creation date (newest first)
    const allSubscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 10,
    });

    // Find the most recent active subscription (not cancelled)
    let latestActiveSubscription = null;
    
    for (const subscription of allSubscriptions.data) {
      // Prioritize active subscriptions, then trialing, then others
      if (subscription.status === 'active' || subscription.status === 'trialing') {
        if (!latestActiveSubscription || subscription.created > latestActiveSubscription.created) {
          latestActiveSubscription = subscription;
        }
      }
    }

    // If no active subscription found, check for the most recent one that's not cancelled
    if (!latestActiveSubscription) {
      for (const subscription of allSubscriptions.data) {
        if (subscription.status !== 'canceled') {
          if (!latestActiveSubscription || subscription.created > latestActiveSubscription.created) {
            latestActiveSubscription = subscription;
          }
        }
      }
    }

    if (!latestActiveSubscription) {
      console.log(`No active subscription found for customer ${customerId}`);
      
      // Mark as unsubscribed
      await supabase
        .from("subscribers")
        .update({
          subscribed: false,
          subscription_tier: null,
          subscription_end: null,
          updated_at: new Date().toISOString(),
          webhook_received: new Date().toISOString(),
        })
        .eq("user_id", userId);
      
      return;
    }

    // Get the subscription details with product info
    const subscriptionDetails = await stripe.subscriptions.retrieve(latestActiveSubscription.id, {
      expand: ["items.data.price.product"],
    });

    const productName = subscriptionDetails.items.data[0].price.product.name;

    // Update the subscriber record with the latest active subscription
    const updateData = {
      subscribed: latestActiveSubscription.status === "active" || latestActiveSubscription.status === "trialing",
      subscription_tier: productName,
      subscription_end: new Date(latestActiveSubscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
      webhook_received: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
      .from("subscribers")
      .update(updateData)
      .eq("user_id", userId);

    if (updateError) {
      console.error("Error updating subscriber:", updateError);
    } else {
      console.log(`Subscriber updated successfully: ${userId}, Plan: ${productName}, Status: ${latestActiveSubscription.status}`);
    }

  } catch (error) {
    console.error("Error in updateSubscriberWithLatestSubscription:", error);
  }
}

async function handleSubscriptionChange(subscription) {
  try {
    console.log("Processing subscription change:", subscription.id, "Status:", subscription.status);

    // Get the customer ID from the subscription
    const customerId = subscription.customer;

    // Get the user ID from the subscriber record
    const { data: subscriber, error: subscriberError } = await supabase
      .from("subscribers")
      .select("user_id, email")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();

    if (subscriberError || !subscriber) {
      console.error("Error finding subscriber:", subscriberError || "No subscriber found");
      return;
    }

    // If this is an active subscription, cancel other active subscriptions
    if (subscription.status === "active") {
      await cancelOtherSubscriptions(customerId, subscription.id);
    }

    // Always update with the latest subscription info
    await updateSubscriberWithLatestSubscription(customerId, subscriber.user_id);

  } catch (error) {
    console.error("Error in handleSubscriptionChange:", error);
  }
}

async function handleSubscriptionCancelled(subscription) {
  try {
    console.log("Processing subscription cancellation:", subscription.id);

    // Get the customer ID from the subscription
    const customerId = subscription.customer;

    // Get the user ID from the subscriber record
    const { data: subscriber, error: subscriberError } = await supabase
      .from("subscribers")
      .select("user_id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();

    if (subscriberError || !subscriber) {
      console.error("Error finding subscriber:", subscriberError || "No subscriber found");
      return;
    }

    // Update with the latest subscription info (this will check for other active subscriptions)
    await updateSubscriberWithLatestSubscription(customerId, subscriber.user_id);

  } catch (error) {
    console.error("Error in handleSubscriptionCancelled:", error);
  }
}

async function handleInvoicePaymentSucceeded(invoice) {
  try {
    console.log("Processing successful payment:", invoice.id);

    // Only process subscription invoices
    if (!invoice.subscription) {
      return;
    }

    // Get the customer ID from the invoice
    const customerId = invoice.customer;

    // Get the user ID from the subscriber record
    const { data: subscriber, error: subscriberError } = await supabase
      .from("subscribers")
      .select("user_id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();

    if (subscriberError || !subscriber) {
      console.error("Error finding subscriber:", subscriberError || "No subscriber found");
      return;
    }

    // Update with the latest subscription info
    await updateSubscriberWithLatestSubscription(customerId, subscriber.user_id);

  } catch (error) {
    console.error("Error in handleInvoicePaymentSucceeded:", error);
  }
}

async function handleInvoicePaymentFailed(invoice) {
  try {
    console.log("Processing failed payment:", invoice.id);

    // Only process subscription invoices
    if (!invoice.subscription) {
      return;
    }

    // Get the customer ID from the invoice
    const customerId = invoice.customer;

    // Get the user ID from the subscriber record
    const { data: subscriber, error: subscriberError } = await supabase
      .from("subscribers")
      .select("user_id, email")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();

    if (subscriberError || !subscriber) {
      console.error("Error finding subscriber:", subscriberError || "No subscriber found");
      return;
    }

    // Log the payment failure
    console.log(`Payment failed for user ${subscriber.user_id} (${subscriber.email})`);

    // You could implement additional logic here, such as:
    // - Sending an email to the user
    // - Adding a notification in the app
    // - Updating the subscription status
  } catch (error) {
    console.error("Error in handleInvoicePaymentFailed:", error);
  }
}