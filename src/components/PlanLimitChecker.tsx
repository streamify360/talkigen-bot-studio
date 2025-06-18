import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lock, Zap, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
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
  const { planLimits, subscription } = useAuth();
  
  const maxLimit = limitType === 'bots' ? planLimits.maxBots : planLimits.maxKnowledgeBases;
  const isUnlimited = maxLimit === -1;
  const hasReachedLimit = !isUnlimited && currentCount >= maxLimit;
  
  const limitTypeDisplay = limitType === 'bots' ? 'chatbots' : 'knowledge bases';

  // If no subscription, show upgrade option
  if (!subscription?.subscribed && hasReachedLimit) {
    return (
      <Card className="border-2 border-amber-200 bg-amber-50">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Lock className="h-5 w-5 text-amber-600" />
            <CardTitle className="text-lg">Plan Limit Reached</CardTitle>
            <Badge variant="outline" className="bg-amber-100 text-amber-800">
              Free Plan
            </Badge>
          </div>
          <CardDescription>
            You've reached the free plan limit for {limitTypeDisplay} ({maxLimit}). Upgrade to create more.
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
                // Switch to billing tab
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

  // If has subscription but reached limit
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
                // Switch to billing tab
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