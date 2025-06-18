import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, CreditCard } from "lucide-react";
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
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const { user, subscription, checkSubscription } = useAuth();

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
      popular: false
    }
  ];

  // Smart subscription check on component mount
  useEffect(() => {
    checkSubscriptionAndProgress();
  }, [user, subscription]);

  // Handle payment success parameter
  useEffect(() => {
    const success = searchParams.get('success');
    if (success === 'true') {
      handlePaymentSuccess();
    }
  }, [searchParams]);

  const checkSubscriptionAndProgress = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // First check context subscription
      if (subscription?.subscribed) {
        console.log('Active subscription found in context:', subscription.subscription_tier);
        toast({
          title: "Subscription Active",
          description: `You have an active ${subscription.subscription_tier} subscription.`,
        });
        setTimeout(() => onComplete(), 1000);
        return;
      }

      // Force refresh subscription status
      await checkSubscription();

      // Check database directly as fallback
      const { data: subscriberData, error } = await supabase
        .from('subscribers')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!error && subscriberData?.subscribed) {
        console.log('Active subscription found in database:', subscriberData.subscription_tier);
        toast({
          title: "Subscription Active",
          description: `You have an active ${subscriberData.subscription_tier} subscription.`,
        });
        setTimeout(() => onComplete(), 1000);
        return;
      }

      console.log('No active subscription found, showing payment options');
    } catch (error) {
      console.error('Error checking subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async () => {
    console.log('Payment success detected, verifying subscription...');
    setLoading(true);
    
    try {
      // Wait for webhook processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Force refresh subscription
      await checkSubscription();
      
      // Verify subscription with retries
      let attempts = 0;
      const maxAttempts = 8;
      
      while (attempts < maxAttempts) {
        const { data: subscriberData, error } = await supabase
          .from('subscribers')
          .select('*')
          .eq('user_id', user?.id)
          .maybeSingle();

        if (!error && subscriberData?.subscribed) {
          console.log('Payment verified, subscription active:', subscriberData.subscription_tier);
          toast({
            title: "Payment Successful!",
            description: `Your ${subscriberData.subscription_tier} subscription is now active.`,
          });
          
          setTimeout(() => onComplete(), 1500);
          return;
        }
        
        attempts++;
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      }
      
      toast({
        title: "Payment Processing",
        description: "Your payment is being processed. This may take a few moments.",
      });
      
    } catch (error) {
      console.error('Error verifying payment:', error);
      toast({
        title: "Verification Error",
        description: "Unable to verify payment. Please contact support if this persists.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
  };

  const handlePayment = async (priceId?: string) => {
    const selectedPriceId = priceId || plans.find(p => p.id === selectedPlan)?.priceId;
    
    if (!selectedPriceId) {
      toast({
        title: "Please select a plan",
        description: "Choose a subscription plan to continue",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const selectedPlanData = plans.find(p => p.priceId === selectedPriceId);
      if (!selectedPlanData) {
        throw new Error("Selected plan not found");
      }

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !sessionData.session?.access_token) {
        throw new Error("No active session found. Please log in again.");
      }

      const response = await supabase.functions.invoke('create-checkout', {
        body: { priceId: selectedPriceId }
      });

      if (!response.error && response.data?.url) {
        window.location.href = response.data.url;
        return;
      }

      const errorMessage = response.data?.error || response.error?.message || "Payment setup failed";
      toast({
        title: "Payment Error",
        description: errorMessage,
        variant: "destructive",
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Payment Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking subscription status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Choose your subscription plan</h3>
        <p className="text-gray-600">
          Select a subscription plan to unlock all features and continue with the setup.
        </p>
      </div>

      {/* Subscription Plans */}
      <div className="grid md:grid-cols-3 gap-6">
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
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-blue-600 to-purple-600">
                  Most Popular
                </Badge>
              </div>
            )}
            <CardHeader>
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <div className="text-3xl font-bold text-blue-600">
                ${plan.price}
                <span className="text-base font-normal text-gray-500">/month</span>
              </div>
              <CardDescription>{plan.description}</CardDescription>
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
                onClick={() => handlePayment(plan.priceId)}
                disabled={isProcessing}
              >
                {isProcessing && selectedPlan === plan.id ? "Processing..." : "Choose Plan"}
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
          onClick={() => handlePayment()}
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