
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CreditCard, CheckCircle, AlertCircle, ExternalLink, RefreshCw, Calendar, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { supabase } from "@/integrations/supabase/client";

const BillingManager = () => {
  const { checkSubscription, subscription, trialDaysRemaining, isTrialExpired, startTrial, isLoading, error } = useSubscription();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  const isSubscribed = subscription?.subscribed;
  const subscriptionTier = subscription?.subscription_tier || "Free";

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleStartTrial = async () => {
    try {
      setLoading(true);
      await startTrial();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to start trial. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      setPortalLoading(true);
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
      } else {
        throw new Error('No portal URL received');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to open billing portal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPortalLoading(false);
    }
  };

  const handleRefreshSubscription = async () => {
    try {
      await checkSubscription();
      toast({
        title: "Refreshed",
        description: "Subscription status has been updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh subscription status.",
        variant: "destructive",
      });
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Billing</h2>
          <p className="text-gray-600">Manage your subscription and billing details</p>
        </div>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
              <span>Loading subscription information...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error state with retry option
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Billing</h2>
          <p className="text-gray-600">Manage your subscription and billing details</p>
        </div>
        
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              <span>Unable to Load Subscription</span>
            </CardTitle>
            <CardDescription className="text-red-600">
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <Button onClick={handleRefreshSubscription} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
              <Button onClick={handleStartTrial} disabled={loading}>
                {loading ? "Starting..." : "Start Free Trial"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Billing</h2>
          <p className="text-gray-600">Manage your subscription and billing details</p>
        </div>
        <Button variant="ghost" size="sm" onClick={handleRefreshSubscription}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Subscription Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>Subscription Status</span>
          </CardTitle>
          <CardDescription>
            View your current plan and billing information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isSubscribed ? (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <p className="text-lg font-medium">
                  You are currently subscribed to the <Badge className="bg-green-100 text-green-800 ml-2">{subscriptionTier}</Badge> plan.
                </p>
              </div>
              <p className="text-gray-500">
                Your subscription will renew on {formatDate(subscription?.subscription_end)}.
              </p>
              <Button 
                variant="outline" 
                onClick={handleManageSubscription}
                disabled={portalLoading}
              >
                {portalLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    Manage Subscription <ExternalLink className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          ) : subscription?.is_trial ? (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-blue-500" />
                <p className="text-lg font-medium">
                  You are currently on a free trial.
                </p>
              </div>
              <p className="text-gray-500">
                Your trial will end on {formatDate(subscription?.trial_end)}.
                {trialDaysRemaining !== null && (
                  <> ({trialDaysRemaining} days remaining)</>
                )}
              </p>
              {trialDaysRemaining !== null && (
                <Progress value={(14 - trialDaysRemaining) / 14 * 100} className="h-2" />
              )}
              <div className="flex items-center space-x-4">
                <Button onClick={handleStartTrial} disabled={loading}>
                  {loading ? (
                    <>
                      Loading...
                      <RefreshCw className="h-4 w-4 ml-2 animate-spin" />
                    </>
                  ) : (
                    <>
                      Upgrade to a Paid Plan <DollarSign className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleManageSubscription}
                  disabled={portalLoading}
                >
                  {portalLoading ? "Loading..." : "Manage Billing"}
                </Button>
              </div>
            </div>
          ) : isTrialExpired ? (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <p className="text-lg font-medium">
                  Your free trial has expired.
                </p>
              </div>
              <p className="text-gray-500">
                To continue using our services, please upgrade to a paid plan.
              </p>
              <Button onClick={handleStartTrial} disabled={loading}>
                {loading ? (
                  <>
                    Loading...
                    <RefreshCw className="h-4 w-4 ml-2 animate-spin" />
                  </>
                ) : (
                  <>
                    Choose a Plan <DollarSign className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                <p className="text-lg font-medium">
                  You are not currently subscribed to a plan.
                </p>
              </div>
              <p className="text-gray-500">
                Start your free trial today and explore all the features!
              </p>
              <Button onClick={handleStartTrial} disabled={loading}>
                {loading ? (
                  <>
                    Loading...
                    <RefreshCw className="h-4 w-4 ml-2 animate-spin" />
                  </>
                ) : (
                  <>
                    Start Free Trial <Calendar className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>
            View your past invoices and payment history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">No billing history available.</p>
          {isSubscribed && (
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={handleManageSubscription}
              disabled={portalLoading}
            >
              View in Stripe Portal
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BillingManager;
