
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Bot, CreditCard, Database, Settings, MessageSquare, CheckCircle, ArrowRight, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import PaymentStep from "@/components/onboarding/PaymentStep";
import KnowledgeBaseStep from "@/components/onboarding/KnowledgeBaseStep";
import BotSetupStep from "@/components/onboarding/BotSetupStep";
import IntegrationStep from "@/components/onboarding/IntegrationStep";

const Onboarding = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  const steps = [
    {
      id: 0,
      title: "Choose Your Plan",
      description: "Select a subscription plan that fits your needs",
      icon: CreditCard,
      component: PaymentStep
    },
    {
      id: 1,
      title: "Create Knowledge Base",
      description: "Upload files and documents for your chatbot",
      icon: Database,
      component: KnowledgeBaseStep
    },
    {
      id: 2,
      title: "Configure Your Bot",
      description: "Customize your chatbot's behavior and appearance",
      icon: Bot,
      component: BotSetupStep
    },
    {
      id: 3,
      title: "Set Up Integrations",
      description: "Connect your bot to your platforms",
      icon: MessageSquare,
      component: IntegrationStep
    }
  ];

  const handleStepComplete = (stepId: number) => {
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps([...completedSteps, stepId]);
    }
    
    if (stepId === steps.length - 1) {
      // All steps completed
      toast({
        title: "Onboarding Complete!",
        description: "Welcome to Talkigen! Your dashboard is ready.",
      });
      navigate("/dashboard");
    } else {
      setCurrentStep(stepId + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    toast({
      title: "Step skipped",
      description: "You can complete this step later from your dashboard.",
    });
    handleStepComplete(currentStep);
  };

  const CurrentStepComponent = steps[currentStep].component;
  const progressPercentage = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bot className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Talkigen
              </span>
            </div>
            <div className="text-sm text-gray-600">
              Step {currentStep + 1} of {steps.length}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Progress Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Get Started with Talkigen</h1>
            <span className="text-sm text-gray-600 bg-white px-3 py-1 rounded-full">
              {Math.round(progressPercentage)}% Complete
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2 mb-6" />
          
          {/* Step indicators */}
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  completedSteps.includes(step.id)
                    ? 'bg-green-500 border-green-500 text-white'
                    : currentStep === index
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : 'bg-white border-gray-300 text-gray-400'
                }`}>
                  {completedSteps.includes(step.id) ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <step.icon className="h-5 w-5" />
                  )}
                </div>
                <div className="ml-3 hidden md:block">
                  <p className={`text-sm font-medium ${
                    currentStep === index ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-400">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-gray-300 mx-4 hidden md:block" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Current Step Content */}
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-xl border-0">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-100">
                  <steps[currentStep].icon className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl">{steps[currentStep].title}</CardTitle>
                  <CardDescription className="text-lg">
                    {steps[currentStep].description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CurrentStepComponent
                onComplete={() => handleStepComplete(currentStep)}
                onSkip={handleSkip}
              />
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Previous</span>
            </Button>
            
            <div className="flex items-center space-x-3">
              {currentStep > 0 && (
                <Button variant="ghost" onClick={handleSkip}>
                  Skip this step
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
