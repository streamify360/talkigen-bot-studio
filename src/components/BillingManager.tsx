import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CreditCard, ExternalLink, RefreshCw, Check, X, Clock, Gift, Calendar, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface SubscriptionData {
  subscribed: boolean;
  subscription_tier?: string;
  subscription_end?: string;
  trial_end?: string;
  is_trial?: boolean;
}

const BillingManager = () => {
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();
  const { user, checkSubscription, subscription, trialDaysRemaining, isTrialExpired } = useAuth();

  useEffect(() => {
    // Always refresh subscription data when component loads
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    if (!user) return;

    try {
      setRefreshing(true);
      
      // Force refresh subscription data
      await checkSubscription();
      
      // Get the latest subscription data from the context
      // This will be updated after checkSubscription completes
      setTimeout(() => {
        if (subscription) {
          setSubscriptionData(subscription);
        }
        setLoading(false);
        setRefreshing(false);
      }, 1000); // Give time for context to update
      
    } catch (error) {
      console.error('Error loading subscription:', error);
      toast({
        title: "Error",
        description: "Failed to load subscription status.",
        variant: "destructive",
      });
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Update local state when subscription context changes
  useEffect(() => {
    if (subscription) {
      setSubscriptionData(subscription);
      setLoading(false);
    }
  }, [subscription]);

  const checkSubscriptionStatus = async () => {
    await loadSubscriptionData();
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
      
      // Show message about refreshing after payment
      toast({
        title: "Redirected to checkout",
        description: "After completing payment, return here and click 'Refresh Status' to see your updated plan.",
      });
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

  const getTrialProgress = () => {
    if (!subscription?.trial_end || !trialDaysRemaining) return 0;
    
    const totalDays = 14;
    const daysUsed = totalDays - trialDaysRemaining;
    return (daysUsed / totalDays) * 100;
  };

  const plans = [
    {
      name: "Starter",
      price: "$29.99",
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
      price: "$59.99",
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
      price: "$119.99",
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

      {/* Trial Status */}
      {subscription?.is_trial && trialDaysRemaining !== null && trialDaysRemaining > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Gift className="h-5 w-5 text-blue-600" />
              <span>Free Trial Active</span>
            </CardTitle>
            <CardDescription>
              You have {trialDaysRemaining} day{trialDaysRemaining !== 1 ? 's' : ''} remaining in your free trial
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Trial Progress</span>
                <span>{14 - trialDaysRemaining} of 14 days used</span>
              </div>
              <Progress value={getTrialProgress()} className="h-2" />
            </div>
            
            {subscription.trial_end && (
              <div className="flex items-center space-x-2 text-sm text-blue-700">
                <Calendar className="h-4 w-4" />
                <span>Trial ends on {formatDate(subscription.trial_end)}</span>
              </div>
            )}
            
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">Trial includes:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Up to 3 chatbots</li>
                <li>• 2 knowledge bases</li>
                <li>• 1,000 messages/month</li>
                <li>• All platform integrations</li>
                <li>• Basic analytics</li>
              </ul>
            </div>
            
            <Button onClick={() => createCheckout(plans[1].priceId)} className="w-full">
              Upgrade to Professional Plan
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Trial Expired */}
      {isTrialExpired && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span>Trial Expired</span>
            </CardTitle>
            <CardDescription>
              Your 14-day free trial has ended. Choose a plan to continue using Talkigen.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => createCheckout(plans[1].priceId)} className="w-full">
              Choose a Plan to Continue
            </Button>
          </CardContent>
        </Card>
      )}

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
          ) : subscription?.is_trial ? (
            <div className="text-center py-4">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Gift className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Free Trial</span>
              </div>
              <p className="text-sm text-gray-500">
                {trialDaysRemaining} day{trialDaysRemaining !== 1 ? 's' : ''} remaining
              </p>
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

      {/* Important Notice */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800">Important</h4>
              <p className="text-sm text-yellow-700 mt-1">
                After making any subscription changes, please click "Refresh Status" to see your updated plan information.
                It may take a few moments for changes to be reflected.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BillingManager;