import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PaymentStepProps {
  onComplete: () => void;
  onSkip: () => void;
}

const PaymentStep = ({ onComplete, onSkip }: PaymentStepProps) => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

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
        body: { priceId: selectedPlanData.priceId },
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      // Improved error dump
      console.log('Function response:', response);

      // Explicitly show server-provided error detail if available
      let serverMsg = "Unknown error";
      if (response?.data?.error) serverMsg = response.data.error;
      if (response?.error?.message) serverMsg = response.error.message;
      if (typeof response?.error === "string") serverMsg = response.error;

      // In success case
      if (!response.error && response.data && response.data.url) {
        window.open(response.data.url, '_blank');
        toast({
          title: "Redirecting to payment",
          description: "Complete your payment in the new tab to continue.",
        });
        console.log('=== PAYMENT FLOW SUCCESS ===');
        return;
      }

      // In error case, show detail to the user
      toast({
        title: "Payment Error",
        description: serverMsg,
        variant: "destructive",
      });

      // Extra: print server details also in console for diagnosis
      console.error("SERVER-ERROR RAW:", response);
      if (response?.data?.details) console.error("Error details:", response.data.details);

      throw new Error(serverMsg);

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

      <div className="flex items-center justify-between pt-4">
        <Button variant="outline" onClick={onSkip}>
          Start Free Trial
        </Button>
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
