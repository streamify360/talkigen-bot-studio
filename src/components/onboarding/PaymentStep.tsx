import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, CreditCard, Clock, Gift, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface PaymentStepProps {
  onComplete: () => void;
  onSkip: () => void;
}

const PaymentStep = ({ onComplete }: PaymentStepProps) => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [startingTrial, setStartingTrial] = useState(false);
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const { user, subscription, trialDaysRemaining, isTrialExpired, startTrial } = useAuth();

  // Check current subscription status
  useEffect(() => {
    const checkSubscription = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase.functions.invoke('check-subscription');
        
        if (!error && data) {
          setHasActiveSubscription(data.subscribed || false);
          setSubscriptionTier(data.subscription_tier || null);
        }
      } catch (error) {
        console.error('Error checking subscription:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSubscription();
  }, [user]);

  // Check if user just completed payment
  useEffect(() => {
    const success = searchParams.get('success');
    if (success === 'true') {
      toast({
        title: "Payment Successful!",
        description: "Your subscription has been activated.",
      });
      // Complete the onboarding step
      onComplete();
    }
  }, [searchParams, onComplete, toast]);

  // If user already has active subscription, auto-complete this step
  useEffect(() => {
    if (hasActiveSubscription && !loading) {
      toast({
        title: "Subscription Active",
        description: `You already have an active ${subscriptionTier} subscription.`,
      });
      onComplete();
    }
  }, [hasActiveSubscription, subscriptionTier, loading, onComplete, toast]);

  // If user is on trial, show trial status
  if (subscription?.is_trial && trialDaysRemaining !== null && trialDaysRemaining > 0) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Gift className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Free Trial Active</h3>
          <p className="text-gray-600 mb-4">
            You have {trialDaysRemaining} day{trialDaysRemaining !== 1 ? 's' : ''} remaining in your free trial.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-blue-900 mb-2">Trial Benefits (Starter Plan Features)</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Up to 3 chatbots</li>
              <li>• 2 knowledge bases</li>
              <li>• 1,000 messages/month</li>
              <li>• All platform integrations</li>
              <li>• Basic analytics</li>
            </ul>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={onComplete} variant="outline">
              Continue with Trial
            </Button>
            <Button onClick={() => setSelectedPlan("professional")}>
              Upgrade Now
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // If trial has expired, show upgrade message
  if (isTrialExpired) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Trial Expired</h3>
          <p className="text-gray-600 mb-6">
            Your 14-day free trial has ended. Choose a plan to continue using Talkigen.
          </p>
        </div>
      </div>
    );
  }

  const plans = [
    {
      id: "starter",
      name: "Starter",
      price: 29,
      priceId: "price_1RaAUYEJIUEdIR4s8USTWPFd",
      description: "Perfect for small businesses",
      features: [
        "Up to 3 chatbots",
        "2 knowledge bases",
        "1,000 messages/month",
        "Website integration",
        "Basic analytics"
      ],
      popular: false,
      trialAvailable: true
    },
    {
      id: "professional",
      name: "Professional",
      price: 59,
      priceId: "price_1RaAVmEJIUEdIR4siObOCgbi",
      description: "Ideal for growing businesses",
      features: [
        "Up to 10 chatbots",
        "5 knowledge bases",
        "10,000 messages/month",
        "All platform integrations",
        "Advanced analytics",
        "Priority support"
      ],
      popular: true,
      trialAvailable: false
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: 119,
      priceId: "price_1RaAXZEJIUEdIR4si9jYeo4t",
      description: "For large organizations with advanced needs",
      features: [
        "Unlimited chatbots",
        "Unlimited knowledge bases",
        "100,000 messages/month",
        "All platform integrations",
        "Advanced analytics",
        "24/7 dedicated support",
        "Custom branding",
        "API access",
        "White-label solution"
      ],
      popular: false,
      trialAvailable: false
    }
  ];

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
  };

  const handleStartTrial = async () => {
    setStartingTrial(true);
    
    try {
      // Start trial with Stripe - create a trial subscription
      const selectedPlanData = plans.find(p => p.id === "starter");
      if (!selectedPlanData) {
        throw new Error("Starter plan not found");
      }

      console.log('=== TRIAL FLOW START ===');
      console.log('Starting trial for Starter plan:', selectedPlanData.name, 'Price ID:', selectedPlanData.priceId);

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('Session error:', sessionError);
        throw new Error(`Session error: ${sessionError.message}`);
      }

      if (!sessionData.session?.access_token) {
        throw new Error("No active session found. Please log in again.");
      }

      console.log('Calling create-checkout function for trial...');

      const response = await supabase.functions.invoke('create-checkout', {
        body: { 
          priceId: selectedPlanData.priceId,
          trial: true,
          trialDays: 14
        }
      });

      console.log('Trial checkout response:', response);

      if (!response.error && response.data && response.data.url) {
        window.open(response.data.url, '_blank');
        toast({
          title: "Redirecting to checkout",
          description: "Complete your trial setup with payment method in the new tab.",
        });
        console.log('=== TRIAL FLOW SUCCESS ===');
        return;
      }

      // Handle error response
      let errorMessage = "Unknown error from server";
      let errorDetails = "";

      if (response.data?.error) {
        errorMessage = response.data.error;
        errorDetails = response.data.details 
          ? (typeof response.data.details === 'string'
              ? response.data.details
              : JSON.stringify(response.data.details, null, 2))
          : "";
      } else if (response.error?.message) {
        errorMessage = response.error.message;
      } else if (typeof response.error === "string") {
        errorMessage = response.error;
      }

      toast({
        title: "Trial Setup Error",
        description: errorDetails ? `${errorMessage}\n\nDetails: ${errorDetails}` : errorMessage,
        variant: "destructive",
      });

      throw new Error(errorMessage);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Final trial error message:', errorMessage);

      toast({
        title: "Trial Setup Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setStartingTrial(false);
      console.log('=== TRIAL FLOW END ===');
    }
  };

  const handlePayment = async () => {
    if (!selectedPlan) {
      toast({
        title: "Please select a plan",
        description: "Choose a subscription plan to continue",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const selectedPlanData = plans.find(p => p.id === selectedPlan);
      if (!selectedPlanData) {
        throw new Error("Selected plan not found");
      }

      console.log('=== PAYMENT FLOW START ===');
      console.log('Selected plan:', selectedPlanData.name, 'Price ID:', selectedPlanData.priceId);

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('Session error:', sessionError);
        throw new Error(`Session error: ${sessionError.message}`);
      }

      console.log('Session data:', {
        hasSession: !!sessionData.session,
        hasUser: !!sessionData.session?.user,
        hasAccessToken: !!sessionData.session?.access_token,
        userId: sessionData.session?.user?.id,
        userEmail: sessionData.session?.user?.email
      });

      if (!sessionData.session?.access_token) {
        throw new Error("No active session found. Please log in again.");
      }

      console.log('Calling create-checkout function...');

      const response = await supabase.functions.invoke('create-checkout', {
        body: { priceId: selectedPlanData.priceId }
      });

      console.log('Raw function response:', response);

      if (!response.error && response.data && response.data.url) {
        window.open(response.data.url, '_blank');
        toast({
          title: "Redirecting to payment",
          description: "Complete your payment in the new tab to continue.",
        });
        console.log('=== PAYMENT FLOW SUCCESS ===');
        return;
      }

      // Handle error response
      let errorMessage = "Unknown error from server";
      let errorDetails = "";

      if (response.data?.error) {
        errorMessage = response.data.error;
        errorDetails = response.data.details 
          ? (typeof response.data.details === 'string'
              ? response.data.details
              : JSON.stringify(response.data.details, null, 2))
          : "";
      } else if (response.error?.message) {
        errorMessage = response.error.message;
      } else if (typeof response.error === "string") {
        errorMessage = response.error;
      } else if (response.error?._type) {
        errorMessage = response.error.value?.message || response.error.value || response.error._type;
        if (response.error.value?.stack) {
          errorDetails = response.error.value.stack;
        }
      } else {
        errorMessage = "Edge Function returned a non-2xx status code (no extra detail from server).";
      }

      toast({
        title: "Payment Error",
        description: errorDetails ? `${errorMessage}\n\nDetails: ${errorDetails}` : errorMessage,
        variant: "destructive",
      });

      console.error("SERVER-ERROR DUMP:", response);
      if (errorDetails) console.error("Error details:", errorDetails);

      throw new Error(errorMessage);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Final error message:', errorMessage);

      if (!isProcessing) {
        toast({
          title: "Payment Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setIsProcessing(false);
      console.log('=== PAYMENT FLOW END ===');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Choose your plan or start free trial</h3>
        <p className="text-gray-600">
          Start with a 14-day free trial of our Starter plan, or choose a subscription plan that fits your needs. All plans require a payment method.
        </p>
      </div>

      {/* Free Trial Option - Only for Starter Plan */}
      <Card className="border-2 border-blue-500 bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Gift className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl text-blue-900">14-Day Free Trial</CardTitle>
                <CardDescription className="text-blue-700">
                  Try Starter plan features risk-free for 14 days
                </CardDescription>
              </div>
            </div>
            <Badge className="bg-blue-600 text-white">Recommended</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-blue-900 mb-2">Starter plan includes:</h4>
                <ul className="space-y-1 text-sm text-blue-800">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    <span>Up to 3 chatbots</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    <span>2 knowledge bases</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    <span>1,000 messages/month</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    <span>All platform integrations</span>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-blue-900 mb-2">Trial details:</h4>
                <ul className="space-y-1 text-sm text-blue-800">
                  <li>• Payment method required</li>
                  <li>• No charges for 14 days</li>
                  <li>• Cancel anytime during trial</li>
                  <li>• Auto-converts to $29/month after trial</li>
                </ul>
              </div>
            </div>
            <Button 
              onClick={handleStartTrial}
              disabled={startingTrial}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              size="lg"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              {startingTrial ? "Setting up trial..." : "Start 14-Day Free Trial"}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <p className="text-xs text-blue-700 text-center">
              You'll be redirected to Stripe to add your payment method. No charges until trial ends.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or choose a subscription plan</span>
        </div>
      </div>

      {/* Subscription Plans */}
      <div className="grid md:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <Card 
            key={plan.id}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedPlan === plan.id
                ? 'ring-2 ring-blue-500 shadow-lg'
                : ''
            } ${plan.popular ? 'relative' : ''}`}
            onClick={() => handlePlanSelect(plan.id)}
          >
            {plan.popular && (
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-600 to-purple-600">
                Most Popular
              </Badge>
            )}
            <CardHeader className="text-center">
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <div className="text-3xl font-bold text-blue-600">
                ${plan.price}
                <span className="text-base font-normal text-gray-500">/month</span>
              </div>
              <CardDescription>{plan.description}</CardDescription>
              {plan.trialAvailable && (
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                  14-day trial available
                </Badge>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button 
                className={`w-full ${
                  plan.popular 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700' 
                    : ''
                }`}
                onClick={() => handlePlanSelect(plan.id)}
              >
                {plan.id === selectedPlan ? "Selected" : "Choose Plan"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedPlan && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold">Selected Plan: {plans.find(p => p.id === selectedPlan)?.name}</h4>
                <p className="text-sm text-gray-600">
                  ${plans.find(p => p.id === selectedPlan)?.price}/month • Billed monthly • Payment method required
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">${plans.find(p => p.id === selectedPlan)?.price}</p>
                <p className="text-sm text-gray-600">per month</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-end pt-4">
        <Button
          onClick={handlePayment}
          disabled={!selectedPlan || isProcessing}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 flex items-center space-x-2"
        >
          <CreditCard className="h-4 w-4" />
          <span>{isProcessing ? "Processing..." : "Subscribe & Continue"}</span>
        </Button>
      </div>
    </div>
  );
};

export default PaymentStep;