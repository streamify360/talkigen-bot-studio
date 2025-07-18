
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Bot, CreditCard, Database, MessageSquare, CheckCircle, ArrowRight, ArrowLeft, LogOut, Home } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useOnboardingProgress } from "@/hooks/useOnboardingProgress";
import PaymentStep from "@/components/onboarding/PaymentStep";
import KnowledgeBaseStep from "@/components/onboarding/KnowledgeBaseStep";
import BotSetupStep from "@/components/onboarding/BotSetupStep";
import IntegrationStep from "@/components/onboarding/IntegrationStep";

const Onboarding = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [initializationComplete, setInitializationComplete] = useState(false);
  const hasInitialized = useRef(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { updateOnboardingStatus, profile, signOut, loading: authLoading } = useAuth();
  const { subscription, isLoading: subscriptionLoading } = useSubscription();
  const { 
    progress, 
    loading: progressLoading, 
    markStepComplete, 
    isStepComplete, 
    getLastCompletedStep,
    refreshProgress,
    clearProgress
  } = useOnboardingProgress();

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

  // Initialize the component once all dependencies are loaded
  useEffect(() => {
    console.log('Onboarding initialization check:', {
      authLoading,
      subscriptionLoading,
      progressLoading,
      hasInitialized: hasInitialized.current
    });

    if (!authLoading && !subscriptionLoading && !progressLoading && !hasInitialized.current) {
      hasInitialized.current = true;
      setInitializationComplete(true);
      
      console.log('Onboarding initialized with:', {
        profile: profile?.onboarding_completed,
        subscription: subscription?.subscribed,
        progressLength: progress.length
      });

      // Check if user should be redirected to dashboard
      if (profile?.onboarding_completed && subscription?.subscribed) {
        console.log('User already completed onboarding, redirecting to dashboard');
        navigate("/dashboard");
        return;
      }

      // Set initial step based on progress
      if (progress.length > 0) {
        const lastCompleted = getLastCompletedStep();
        const nextStep = Math.min(lastCompleted + 1, steps.length - 1);
        
        // If all steps are complete, mark onboarding as done and redirect
        if (lastCompleted === steps.length - 1) {
          console.log('All steps completed, finalizing onboarding');
          handleOnboardingComplete();
          return;
        }
        
        console.log('Setting current step to:', nextStep);
        setCurrentStep(nextStep);
      }
    }
  }, [authLoading, subscriptionLoading, progressLoading, profile, subscription, progress, navigate, getLastCompletedStep, steps.length]);

  // Handle subscription cancellation
  useEffect(() => {
    if (initializationComplete && subscription !== null && !subscription.subscribed && profile?.onboarding_completed) {
      console.log('Subscription cancelled, resetting onboarding');
      clearProgress();
      setCurrentStep(0);
      toast({
        title: "Subscription Cancelled",
        description: "Your subscription has been cancelled. Please complete the onboarding process again to continue using the service.",
        variant: "destructive",
      });
    }
  }, [subscription, profile, initializationComplete, clearProgress, toast]);

  const handleOnboardingComplete = async () => {
    try {
      await updateOnboardingStatus(true);
      toast({
        title: "Onboarding Complete!",
        description: "Welcome to Talkigen! Your dashboard is ready.",
      });
      navigate("/dashboard");
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast({
        title: "Error",
        description: "Failed to complete onboarding. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleStepComplete = async (stepId: number) => {
    console.log('Completing step:', stepId);
    
    try {
      // Mark step as complete in database
      await markStepComplete(stepId);
      
      if (stepId === steps.length - 1) {
        // All steps completed
        await handleOnboardingComplete();
      } else {
        // Move to next step
        const nextStep = stepId + 1;
        console.log('Moving to next step:', nextStep);
        setCurrentStep(nextStep);
      }
    } catch (error) {
      console.error('Error completing step:', error);
      toast({
        title: "Error",
        description: "Failed to complete step. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      console.log('Going to previous step:', prevStep);
      setCurrentStep(prevStep);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account.",
      });
      navigate("/");
    } catch (error) {
      console.error('Error logging out:', error);
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleHomeNavigation = () => {
    navigate("/");
  };

  // Show loading while initializing
  if (!initializationComplete || authLoading || subscriptionLoading || progressLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading onboarding...</p>
        </div>
      </div>
    );
  }

  const CurrentStepComponent = steps[currentStep]?.component;
  if (!CurrentStepComponent) {
    console.error('No component found for current step:', currentStep);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Error: Invalid step configuration</p>
          <Button onClick={() => setCurrentStep(0)} className="mt-4">
            Restart Onboarding
          </Button>
        </div>
      </div>
    );
  }

  const completedSteps = steps.filter(step => isStepComplete(step.id));
  const progressPercentage = ((completedSteps.length + (currentStep + 1)) / (steps.length * 2)) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div 
              className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={handleHomeNavigation}
            >
              <Bot className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Talkigen
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Step {currentStep + 1} of {steps.length}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleHomeNavigation}
                className="text-gray-600 hover:text-gray-900"
              >
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-gray-600 hover:text-red-600"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 container mx-auto px-4 py-8">
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
                  isStepComplete(step.id)
                    ? 'bg-green-500 border-green-500 text-white'
                    : currentStep === index
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : 'bg-white border-gray-300 text-gray-400'
                }`}>
                  {isStepComplete(step.id) ? (
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
                  {React.createElement(steps[currentStep].icon, { className: "h-6 w-6 text-blue-600" })}
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
                onSkip={() => {}}
              />
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            {currentStep > 0 ? (
              <Button
                variant="outline"
                onClick={handlePrevious}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Previous</span>
              </Button>
            ) : (
              <div></div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t mt-auto">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2">
              <Bot className="h-6 w-6 text-blue-600" />
              <span className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Talkigen
              </span>
              <span className="text-sm text-gray-500 ml-2">
                © 2025 All rights reserved
              </span>
            </div>
            
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <button 
                onClick={handleHomeNavigation}
                className="hover:text-blue-600 transition-colors"
              >
                Home
              </button>
              <span className="text-gray-300">|</span>
              <span>Need help? Contact support</span>
              <span className="text-gray-300">|</span>
              <span className="flex items-center space-x-1">
                <span>Secure checkout powered by</span>
                <span className="font-semibold text-purple-600">Stripe</span>
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Onboarding;
