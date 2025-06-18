import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSearchParams, useNavigate } from "react-router-dom";
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
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const { user, checkSubscription } = useAuth();
  const navigate = useNavigate();

  // Check current subscription status
  useEffect(() => {
    const checkCurrentSubscription = async () => {
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

    checkCurrentSubscription();
  }, [user]);

  // Check if user just completed payment
  useEffect(() => {
    const success = searchParams.get('success');
    if (success === 'true') {
      // Wait a bit for webhook to process, then check subscription
      setTimeout(async () => {
        await checkSubscription();
        const { data } = await supabase.functions.invoke('check-subscription');
        if (data?.subscribed) {
          toast({
            title: "Payment Successful!",
            description: "Your subscription has been activated.",
          });
          onComplete();
        } else {
          // Still processing, keep checking
          setTimeout(async () => {
            await checkSubscription();
            const { data: retryData } = await supabase.functions.invoke('check-subscription');
            if (retryData?.subscribed) {
              onComplete();
            } else {
              toast({
                title: "Payment Processing",
                description: "Your payment is being processed. Please wait a moment.",
              });
            }
          }, 3000);
        }
      }, 2000);
    }
  }, [searchParams, onComplete, toast, checkSubscription]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If user has active subscription, show completion message
  if (hasActiveSubscription) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Subscription Active</h3>
        <p className="text-gray-600 mb-4">
          You have an active {subscriptionTier} subscription. You can proceed to the next step.
        </p>
        <Button onClick={onComplete} className="bg-green-600 hover:bg-green-700">
          Continue to Next Step
        </Button>
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
        "Up to 2 chatbots",
        "1 knowledge base",
        "1,000 messages/month",
        "Website integration",
        "Basic analytics"
      ],
      popular: false
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
      popular: true
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: 119,
      priceId: "price_1RaAXZEJIUEdIR4si9jYeo4t",
      description: "For large organizations",
      features: [
        "Unlimited chatbots",
        "Unlimited knowledge bases",
        "100,000 messages/month",
        "All integrations",
        "24/7 support",
        "Custom branding",
        "API access"
      ],
      popular: false
    }
  ];

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
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

      console.log('Creating checkout session for:', selectedPlanData.name);

      const { data: response, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId: selectedPlanData.priceId }
      });

      if (error) {
        throw new Error(error.message || 'Failed to create checkout session');
      }

      if (response?.url) {
        // Redirect to Stripe checkout
        window.location.href = response.url;
      } else {
        throw new Error('No checkout URL received');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Payment error:', errorMessage);

      toast({
        title: "Payment Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Choose your subscription plan</h3>
        <p className="text-gray-600">
          Select the plan that best fits your needs. You can change or cancel anytime.
        </p>
      </div>

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
              <div className="text-3xl font-bold">
                ${plan.price}
                <span className="text-sm font-normal text-gray-500">/month</span>
              </div>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
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
                  ${plans.find(p => p.id === selectedPlan)?.price}/month • Billed monthly
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
