import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, ExternalLink, RefreshCw, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface SubscriptionData {
  subscribed: boolean;
  subscription_tier?: string;
  subscription_end?: string;
}

const BillingManager = () => {
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();
  const { user, checkSubscription, subscription } = useAuth();

  useEffect(() => {
    if (subscription) {
      // Use the subscription data from AuthContext
      setSubscriptionData(subscription);
      setLoading(false);
    } else {
      // If no subscription data in AuthContext, check it
      checkSubscriptionStatus();
    }
  }, [subscription]);

  const checkSubscriptionStatus = async () => {
    if (!user) return;

    try {
      setRefreshing(true);
      await checkSubscription();
      
      // The subscription state will be updated in AuthContext
      // and the component will re-render with the new data
    } catch (error) {
      console.error('Error checking subscription:', error);
      toast({
        title: "Error",
        description: "Failed to check subscription status.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const openCustomerPortal = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) throw error;
      
      window.open(data.url, '_blank');
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast({
        title: "Error",
        description: "Failed to open customer portal.",
        variant: "destructive",
      });
    }
  };

  const createCheckout = async (priceId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId }
      });
      
      if (error) throw error;
      
      window.open(data.url, '_blank');
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast({
        title: "Error",
        description: "Failed to create checkout session.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const plans = [
    {
      name: "Starter",
      price: "$9.99",
      priceId: "price_1RaAUYEJIUEdIR4s8USTWPFd",
      features: [
        "3 Chatbots",
        "Basic Analytics",
        "Email Support",
        "1GB Storage"
      ]
    },
    {
      name: "Professional",
      price: "$19.99",
      priceId: "price_1RaAVmEJIUEdIR4siObOCgbi",
      features: [
        "10 Chatbots",
        "Advanced Analytics",
        "Priority Support",
        "10GB Storage",
        "Custom Branding"
      ]
    },
    {
      name: "Enterprise",
      price: "$49.99",
      priceId: "price_1RaAXZEJIUEdIR4si9jYeo4t",
      features: [
        "Unlimited Chatbots",
        "Full Analytics Suite",
        "24/7 Support",
        "100GB Storage",
        "White Label",
        "API Access"
      ]
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Billing & Subscription</h2>
          <p className="text-gray-600">Manage your subscription and billing settings</p>
        </div>
        <Button
          variant="outline"
          onClick={checkSubscriptionStatus}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh Status
        </Button>
      </div>

      {/* Current Subscription Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>Current Subscription</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {subscriptionData?.subscribed ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Active
                    </Badge>
                    <span className="font-medium">{subscriptionData.subscription_tier} Plan</span>
                  </div>
                  {subscriptionData.subscription_end && (
                    <p className="text-sm text-gray-500 mt-1">
                      Renews on {formatDate(subscriptionData.subscription_end)}
                    </p>
                  )}
                </div>
                <Button onClick={openCustomerPortal}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Manage Subscription
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-500 mb-4">No active subscription</p>
              <p className="text-sm text-gray-400">Choose a plan below to get started</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subscription Plans */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Choose Your Plan</h3>
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card 
              key={plan.name} 
              className={`relative ${
                subscriptionData?.subscription_tier === plan.name 
                  ? 'border-blue-500 bg-blue-50' 
                  : ''
              }`}
            >
              {subscriptionData?.subscription_tier === plan.name && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-600">Current Plan</Badge>
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <div className="text-3xl font-bold text-blue-600">
                  {plan.price}
                  <span className="text-base font-normal text-gray-500">/month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  className="w-full"
                  variant={subscriptionData?.subscription_tier === plan.name ? "outline" : "default"}
                  onClick={() => createCheckout(plan.priceId)}
                  disabled={subscriptionData?.subscription_tier === plan.name}
                >
                  {subscriptionData?.subscription_tier === plan.name 
                    ? "Current Plan" 
                    : "Choose Plan"
                  }
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Billing Information */}
      {subscriptionData?.subscribed && (
        <Card>
          <CardHeader>
            <CardTitle>Billing Information</CardTitle>
            <CardDescription>
              Manage your payment methods and view billing history
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={openCustomerPortal} className="w-full">
              <ExternalLink className="h-4 w-4 mr-2" />
              View Billing Details & Payment Methods
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BillingManager;