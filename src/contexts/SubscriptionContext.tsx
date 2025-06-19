
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
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [trialDaysRemaining, setTrialDaysRemaining] = useState<number | null>(null);

  const { data: subscription, isLoading, refetch } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      try {
        console.log('Fetching subscription data for user:', user.id);
        const { data, error } = await supabase.functions.invoke('check-subscription');
        
        if (error) {
          console.error('Subscription check error:', error);
          // Return default subscription state instead of throwing
          return {
            subscribed: false,
            is_trial: false,
            subscription_tier: null,
            subscription_end: null,
            trial_end: null
          } as SubscriptionData;
        }
        
        console.log('Subscription data received:', data);
        return data as SubscriptionData;
      } catch (error) {
        console.error('Subscription fetch error:', error);
        // Return default subscription state
        return {
          subscribed: false,
          is_trial: false,
          subscription_tier: null,
          subscription_end: null,
          trial_end: null
        } as SubscriptionData;
      }
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchInterval: false, // No polling
    retry: 1, // Only retry once to prevent excessive retries
  });

  // Set up realtime subscription for live updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('subscription-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscribers',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Subscription updated via realtime:', payload);
          // Invalidate and refetch subscription data
          queryClient.invalidateQueries({ queryKey: ['subscription'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

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
      return { maxBots: 0, maxKnowledgeBases: 0, maxMessages: 0 };
    }

    if (subscription.is_trial) {
      return { maxBots: 3, maxKnowledgeBases: 2, maxMessages: 1000 };
    }

    switch (subscription.subscription_tier) {
      case 'Starter':
        return { maxBots: 2, maxKnowledgeBases: 2, maxMessages: 1000 };
      case 'Professional':
        return { maxBots: 10, maxKnowledgeBases: 10, maxMessages: 10000 };
      case 'Enterprise':
        return { maxBots: -1, maxKnowledgeBases: -1, maxMessages: -1 };
      default:
        return { maxBots: 0, maxKnowledgeBases: 0, maxMessages: 0 };
    }
  };

  const isTrialExpired = subscription?.is_trial === false && 
    subscription?.trial_end && 
    new Date() > new Date(subscription.trial_end) && 
    !subscription?.subscribed;

  const startTrial = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('start-trial');
      if (error) throw error;
      
      // Invalidate and refetch subscription data
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
    await refetch();
  };

  const value: SubscriptionContextType = {
    subscription,
    planLimits: getPlanLimits(),
    trialDaysRemaining,
    isTrialExpired: Boolean(isTrialExpired),
    startTrial,
    checkSubscription,
    isLoading,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};
