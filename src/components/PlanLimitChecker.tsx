
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lock, Zap, ArrowRight, Gift, Clock } from "lucide-react";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Link } from "react-router-dom";

interface PlanLimitCheckerProps {
  currentCount: number;
  limitType: 'bots' | 'knowledgeBases';
  children: React.ReactNode;
}

const PlanLimitChecker: React.FC<PlanLimitCheckerProps> = ({ 
  currentCount, 
  limitType, 
  children 
}) => {
  const { planLimits, subscription, trialDaysRemaining, isTrialExpired, startTrial } = useSubscription();
  
  const maxLimit = limitType === 'bots' ? planLimits.maxBots : planLimits.maxKnowledgeBases;
  const isUnlimited = maxLimit === -1;
  const hasReachedLimit = !isUnlimited && currentCount >= maxLimit;
  
  const limitTypeDisplay = limitType === 'bots' ? 'chatbots' : 'knowledge bases';
  
  if (isTrialExpired) {
    return (
      <Card className="border-2 border-red-200 bg-red-50">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-red-600" />
            <CardTitle className="text-lg">Trial Expired</CardTitle>
            <Badge variant="outline" className="bg-red-100 text-red-800">
              Trial Ended
            </Badge>
          </div>
          <CardDescription>
            Your 14-day free trial has ended. Upgrade to continue creating {limitTypeDisplay}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span>Current usage:</span>
            <span className="font-medium">{currentCount} {limitTypeDisplay}</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button asChild className="flex-1">
              <Link to="/dashboard" onClick={() => {
                const billingsTab = document.querySelector('[data-value="billing"]') as HTMLElement;
                if (billingsTab) billingsTab.click();
              }}>
                <Zap className="h-4 w-4 mr-2" />
                Choose Plan
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/pricing">
                View Plans
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!subscription?.subscribed && !subscription?.is_trial && !subscription?.trial_end) {
    return (
      <Card className="border-2 border-green-200 bg-green-50">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Gift className="h-5 w-5 text-green-600" />
            <CardTitle className="text-lg">Start Your Free Trial</CardTitle>
            <Badge variant="outline" className="bg-green-100 text-green-800">
              14 Days Free
            </Badge>
          </div>
          <CardDescription>
            Get full access to create {limitTypeDisplay} with a 14-day free trial. No credit card required.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span>Trial includes:</span>
            <span className="font-medium">Up to 3 chatbots & 2 knowledge bases</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button onClick={startTrial} className="flex-1 bg-green-600 hover:bg-green-700">
              <Gift className="h-4 w-4 mr-2" />
              Start Free Trial
            </Button>
            <Button variant="outline" asChild>
              <Link to="/pricing">
                View Plans
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (subscription?.is_trial && hasReachedLimit) {
    return (
      <Card className="border-2 border-amber-200 bg-amber-50">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Lock className="h-5 w-5 text-amber-600" />
            <CardTitle className="text-lg">Trial Limit Reached</CardTitle>
            <Badge variant="outline" className="bg-amber-100 text-amber-800">
              {trialDaysRemaining} Days Left
            </Badge>
          </div>
          <CardDescription>
            You've reached the trial limit for {limitTypeDisplay} ({maxLimit}). Upgrade to create more.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span>Current usage:</span>
            <span className="font-medium">{currentCount} / {maxLimit}</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button asChild className="flex-1">
              <Link to="/dashboard" onClick={() => {
                const billingsTab = document.querySelector('[data-value="billing"]') as HTMLElement;
                if (billingsTab) billingsTab.click();
              }}>
                <Zap className="h-4 w-4 mr-2" />
                Upgrade Plan
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/pricing">
                View Plans
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (hasReachedLimit) {
    return (
      <Card className="border-2 border-amber-200 bg-amber-50">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Lock className="h-5 w-5 text-amber-600" />
            <CardTitle className="text-lg">Plan Limit Reached</CardTitle>
            <Badge variant="outline" className="bg-amber-100 text-amber-800">
              {subscription?.subscription_tier || 'Current'} Plan
            </Badge>
          </div>
          <CardDescription>
            You've reached the maximum number of {limitTypeDisplay} ({maxLimit}) for your current plan.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span>Current usage:</span>
            <span className="font-medium">{currentCount} / {maxLimit}</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button asChild className="flex-1">
              <Link to="/dashboard" onClick={() => {
                const billingsTab = document.querySelector('[data-value="billing"]') as HTMLElement;
                if (billingsTab) billingsTab.click();
              }}>
                <Zap className="h-4 w-4 mr-2" />
                Upgrade Plan
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/pricing">
                View Plans
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
};

export default PlanLimitChecker;
