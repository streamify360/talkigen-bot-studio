
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionData {
  subscribed: boolean;
  subscription_tier?: string;
  subscription_end?: string;
  trial_end?: string;
  is_trial?: boolean;
}

interface SubscriptionContextType {
  subscription: SubscriptionData | null;
  planLimits: {
    maxBots: number;
    maxKnowledgeBases: number;
    maxMessages: number;
  };
  trialDaysRemaining: number | null;
  isTrialExpired: boolean;
  startTrial: () => Promise<void>;
  checkSubscription: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

interface SubscriptionProviderProps {
  children: ReactNode;
}

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [trialDaysRemaining, setTrialDaysRemaining] = useState<number | null>(null);

  const { data: subscription, isLoading, error, refetch } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async (): Promise<SubscriptionData> => {
      if (!user) {
        return {
          subscribed: false,
          is_trial: false,
          subscription_tier: null,
          subscription_end: null,
          trial_end: null
        };
      }
      
      try {
        console.log('Fetching subscription data for user:', user.id);
        const { data, error } = await supabase.functions.invoke('check-subscription', {
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (error) {
          console.error('Subscription check error:', error);
          return {
            subscribed: false,
            is_trial: false,
            subscription_tier: null,
            subscription_end: null,
            trial_end: null
          };
        }
        
        console.log('Subscription data received:', data);
        return data as SubscriptionData;
      } catch (error) {
        console.error('Subscription fetch error:', error);
        return {
          subscribed: false,
          is_trial: false,
          subscription_tier: null,
          subscription_end: null,
          trial_end: null
        };
      }
    },
    enabled: !!user && !authLoading,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchInterval: false,
    retry: 1,
    retryDelay: 1000,
  });

  // Calculate trial days remaining
  useEffect(() => {
    if (subscription?.trial_end) {
      const trialEnd = new Date(subscription.trial_end);
      const now = new Date();
      const diffTime = trialEnd.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setTrialDaysRemaining(Math.max(0, diffDays));
    } else {
      setTrialDaysRemaining(null);
    }
  }, [subscription?.trial_end]);

  const getPlanLimits = () => {
    if (!subscription) {
      return { maxBots: 1, maxKnowledgeBases: 1, maxMessages: 100 };
    }

    if (subscription.is_trial) {
      return { maxBots: 3, maxKnowledgeBases: 2, maxMessages: 1000 };
    }

    const tier = subscription.subscription_tier?.toLowerCase() || '';
    
    if (tier.includes('enterprise')) {
      return { maxBots: -1, maxKnowledgeBases: -1, maxMessages: -1 };
    }
    
    if (tier.includes('professional') || tier.includes('pro')) {
      return { maxBots: 10, maxKnowledgeBases: 10, maxMessages: 10000 };
    }
    
    if (tier.includes('starter') || tier.includes('basic')) {
      return { maxBots: 2, maxKnowledgeBases: 2, maxMessages: 1000 };
    }

    // Default for unrecognized plans
    return { maxBots: 1, maxKnowledgeBases: 1, maxMessages: 100 };
  };

  const isTrialExpired = subscription?.is_trial === false && 
    subscription?.trial_end && 
    new Date() > new Date(subscription.trial_end) && 
    !subscription?.subscribed;

  const startTrial = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('start-trial');
      if (error) throw new Error(error.message || 'Failed to start trial');
      
      await queryClient.invalidateQueries({ queryKey: ['subscription'] });
      
      toast({
        title: "Trial Started!",
        description: "Your 14-day free trial has begun.",
      });
    } catch (error) {
      console.error('Error starting trial:', error);
      throw error;
    }
  };

  const checkSubscription = async () => {
    try {
      await refetch();
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  // Consider subscription context initialized when:
  // 1. Auth is not loading AND
  // 2. Either no user (so no subscription needed) OR subscription query is not loading
  const isInitialized = !authLoading && (!user || !isLoading);

  const value: SubscriptionContextType = {
    subscription: subscription || null,
    planLimits: getPlanLimits(),
    trialDaysRemaining,
    isTrialExpired: Boolean(isTrialExpired),
    startTrial,
    checkSubscription,
    isLoading: authLoading || (!!user && isLoading), // Show loading if auth loading OR (user exists and subscription loading)
    error: error?.message || null,
    isInitialized,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};
