
import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

interface SubscriptionInfo {
  subscribed: boolean;
  subscription_tier: string | null;
  subscription_end: string | null;
  trial_end?: string | null;
  is_trial?: boolean;
}

interface PlanLimits {
  maxBots: number;
  maxKnowledgeBases: number;
  maxMessages: number;
  maxStorage: number; // in MB
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  subscription: SubscriptionInfo | null;
  loading: boolean;
  planLimits: PlanLimits;
  trialDaysRemaining: number | null;
  isTrialExpired: boolean;
  signOut: () => Promise<void>;
  updateOnboardingStatus: (completed: boolean) => Promise<void>;
  checkSubscription: () => Promise<void>;
  hasActiveSubscription: () => boolean;
  shouldRedirectToOnboarding: () => boolean;
  canCreateBot: (currentCount: number) => boolean;
  canCreateKnowledgeBase: (currentCount: number) => boolean;
  resetOnboardingForCancelledUser: () => Promise<void>;
  startTrial: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Plan limits configuration
const getPlanLimits = (tier: string | null, isSubscribed: boolean, isTrial: boolean): PlanLimits => {
  if (isTrial) {
    return {
      maxBots: 2,
      maxKnowledgeBases: 2,
      maxMessages: 1000,
      maxStorage: 100
    };
  }

  if (isSubscribed) {
    switch (tier) {
      case 'Starter':
        return {
          maxBots: 2,
          maxKnowledgeBases: 2,
          maxMessages: 1000,
          maxStorage: 100
        };
      case 'Professional':
        return {
          maxBots: 10,
          maxKnowledgeBases: 10,
          maxMessages: 10000,
          maxStorage: 1000
        };
      case 'Enterprise':
        return {
          maxBots: -1,
          maxKnowledgeBases: -1,
          maxMessages: 100000,
          maxStorage: 10000
        };
      default:
        return {
          maxBots: 2,
          maxKnowledgeBases: 2,
          maxMessages: 1000,
          maxStorage: 100
        };
    }
  }

  return {
    maxBots: 1,
    maxKnowledgeBases: 1,
    maxMessages: 100,
    maxStorage: 10
  };
};

const calculateTrialDaysRemaining = (trialEnd: string | null): number | null => {
  if (!trialEnd) return null;
  
  const now = new Date();
  const endDate = new Date(trialEnd);
  const diffTime = endDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Refs to prevent multiple simultaneous calls
  const subscriptionCheckInProgress = useRef(false);
  const lastSubscriptionCheck = useRef<number>(0);
  const subscriptionCheckTimeout = useRef<NodeJS.Timeout | null>(null);

  const fetchUserProfile = async (userId: string, userEmail?: string) => {
    try {
      let { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (data) return data;

      if (error && error.code !== "PGRST116") {
        console.error('Error fetching user profile:', error);
      }

      const createRes = await supabase
        .from('profiles')
        .insert([
          {
            id: userId,
            first_name: null,
            last_name: null,
            company: null,
            onboarding_completed: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]);
      
      if (createRes.error) {
        if (createRes.error.code === "23505") {
          const { data: retry, error: refetchError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();
          if (retry) return retry;
          if (refetchError) {
            console.error("Refetch after duplicate profile insert failed:", refetchError);
            return null;
          }
        } else {
          console.error("Failed to auto-create profile for user:", createRes.error);
          return null;
        }
      }

      const { data: afterInsert } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      return afterInsert || null;
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      return null;
    }
  };

  const signOut = async () => {
    console.log('Signing out user...');
    try {
      // Clear timeouts
      if (subscriptionCheckTimeout.current) {
        clearTimeout(subscriptionCheckTimeout.current);
        subscriptionCheckTimeout.current = null;
      }

      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
        throw error;
      } else {
        console.log('User signed out successfully');
        setProfile(null);
        setSubscription(null);
        setUser(null);
        setSession(null);
      }
    } catch (error) {
      console.error('Failed to sign out:', error);
      throw error;
    }
  };

  const startTrial = async () => {
    if (!user) return;

    try {
      console.log('Starting trial for user:', user.id);
      
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 14);

      const { error } = await supabase
        .from('subscribers')
        .upsert({
          user_id: user.id,
          email: user.email || '',
          subscribed: false,
          subscription_tier: 'Trial',
          subscription_end: trialEnd.toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      console.log('Trial started successfully, ends:', trialEnd.toISOString());
      
      // Force refresh subscription status
      await checkSubscription();
    } catch (error) {
      console.error('Error starting trial:', error);
      throw error;
    }
  };

  const checkSubscription = useCallback(async () => {
    if (!user || subscriptionCheckInProgress.current) return;

    // Debounce: Don't check more than once every 5 seconds
    const now = Date.now();
    if (now - lastSubscriptionCheck.current < 5000) {
      return;
    }

    try {
      subscriptionCheckInProgress.current = true;
      lastSubscriptionCheck.current = now;
      
      console.log('Checking subscription status for user:', user.id);
      
      // First try to get subscription from subscribers table
      const { data: subscriberData, error: subscriberError } = await supabase
        .from('subscribers')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (!subscriberError && subscriberData) {
        console.log('Found subscription data in database:', subscriberData);
        
        const isTrial = subscriberData.subscription_tier === 'Trial' && !subscriberData.subscribed;
        const now = new Date();
        const subscriptionEnd = subscriberData.subscription_end ? new Date(subscriberData.subscription_end) : null;
        
        const isTrialExpired = isTrial && subscriptionEnd && now > subscriptionEnd;
        
        const subscriptionData = {
          subscribed: subscriberData.subscribed || false,
          subscription_tier: subscriberData.subscription_tier || null,
          subscription_end: subscriberData.subscription_end || null,
          trial_end: isTrial ? subscriberData.subscription_end : null,
          is_trial: isTrial && !isTrialExpired
        };
        
        console.log('Setting subscription data:', subscriptionData);
        setSubscription(subscriptionData);
        
        if (!subscriptionData.subscribed && !subscriptionData.is_trial && profile?.onboarding_completed) {
          await resetOnboardingForCancelledUser();
        }
        
        return;
      }
      
      // If no local data, try the edge function
      try {
        const { data, error } = await supabase.functions.invoke('check-subscription');
        
        if (error) {
          console.error('Error from check-subscription function:', error);
          
          if (error.message && (
            error.message.includes('Session from session_id claim in JWT does not exist') ||
            error.message.includes('Invalid Refresh Token: Refresh Token Not Found') ||
            error.message.includes('refresh_token_not_found')
          )) {
            console.log('Detected stale session, signing out user...');
            await signOut();
            return;
          }
          
          if (subscription) {
            console.log('Keeping existing subscription data due to error');
            return;
          }
          
          setSubscription({ subscribed: false, subscription_tier: null, subscription_end: null, is_trial: false });
        } else {
          console.log('Subscription data received from function:', data);
          const subscriptionData = {
            subscribed: data.subscribed || false,
            subscription_tier: data.subscription_tier || null,
            subscription_end: data.subscription_end || null,
            trial_end: data.trial_end || null,
            is_trial: data.is_trial || false
          };
          console.log('Setting subscription data from function:', subscriptionData);
          setSubscription(subscriptionData);

          if (!subscriptionData.subscribed && !subscriptionData.is_trial && profile?.onboarding_completed) {
            await resetOnboardingForCancelledUser();
          }
        }
      } catch (functionError: any) {
        console.error('Error calling check-subscription function:', functionError);
        
        if (functionError.message && (
          functionError.message.includes('Invalid Refresh Token: Refresh Token Not Found') ||
          functionError.message.includes('refresh_token_not_found')
        )) {
          console.log('Detected invalid refresh token error, signing out user...');
          await signOut();
          return;
        }
        
        if (subscription) {
          console.log('Keeping existing subscription data due to function error');
          return;
        }
        
        setSubscription({ subscribed: false, subscription_tier: null, subscription_end: null, is_trial: false });
      }
    } catch (error: any) {
      console.error('Error in checkSubscription:', error);
      
      if (error.message && (
        error.message.includes('Invalid Refresh Token: Refresh Token Not Found') ||
        error.message.includes('refresh_token_not_found')
      )) {
        console.log('Detected invalid refresh token error in general catch, signing out user...');
        await signOut();
        return;
      }
      
      if (subscription) {
        console.log('Keeping existing subscription data due to general error');
        return;
      }
      
      setSubscription({ subscribed: false, subscription_tier: null, subscription_end: null, is_trial: false });
    } finally {
      subscriptionCheckInProgress.current = false;
    }
  }, [user, subscription, profile]);

  // Controlled periodic subscription check
  useEffect(() => {
    if (!user) return;

    // Clear any existing timeout
    if (subscriptionCheckTimeout.current) {
      clearTimeout(subscriptionCheckTimeout.current);
    }

    // Set up periodic check (every 60 seconds, not 30)
    const scheduleNextCheck = () => {
      subscriptionCheckTimeout.current = setTimeout(() => {
        if (!document.hidden && user) {
          checkSubscription().finally(() => {
            scheduleNextCheck(); // Schedule next check
          });
        } else {
          scheduleNextCheck(); // Reschedule if page is hidden
        }
      }, 60000); // 60 seconds
    };

    scheduleNextCheck();

    return () => {
      if (subscriptionCheckTimeout.current) {
        clearTimeout(subscriptionCheckTimeout.current);
        subscriptionCheckTimeout.current = null;
      }
    };
  }, [user, checkSubscription]);

  // Window focus handler with debouncing
  useEffect(() => {
    const handleFocus = () => {
      if (user && !subscriptionCheckInProgress.current) {
        // Debounce focus checks
        setTimeout(() => {
          if (!document.hidden) {
            console.log('Window focused, checking subscription status...');
            checkSubscription();
          }
        }, 1000);
      }
    };

    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [user, checkSubscription]);

  const hasActiveSubscription = useCallback(() => {
    return subscription?.subscribed || subscription?.is_trial || false;
  }, [subscription]);

  const shouldRedirectToOnboarding = useCallback(() => {
    if (!profile || !subscription) return false;
    return profile.onboarding_completed && !subscription.subscribed && !subscription.is_trial;
  }, [profile, subscription]);

  const canCreateBot = useCallback((currentCount: number) => {
    const limits = getPlanLimits(subscription?.subscription_tier, subscription?.subscribed || false, subscription?.is_trial || false);
    return limits.maxBots === -1 || currentCount < limits.maxBots;
  }, [subscription]);

  const canCreateKnowledgeBase = useCallback((currentCount: number) => {
    const limits = getPlanLimits(subscription?.subscription_tier, subscription?.subscribed || false, subscription?.is_trial || false);
    return limits.maxKnowledgeBases === -1 || currentCount < limits.maxKnowledgeBases;
  }, [subscription]);

  const resetOnboardingForCancelledUser = async () => {
    if (!user) return;

    try {
      console.log('Resetting onboarding for cancelled user:', user.id);
      
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          onboarding_completed: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (profileError) {
        console.error('Error resetting profile onboarding status:', profileError);
        return;
      }

      const { error: progressError } = await supabase
        .from('onboarding_progress')
        .delete()
        .eq('user_id', user.id);

      if (progressError) {
        console.error('Error clearing onboarding progress:', progressError);
        return;
      }

      setProfile(prev => prev ? { ...prev, onboarding_completed: false } : null);

      console.log('Successfully reset onboarding for cancelled user');
    } catch (error) {
      console.error('Error in resetOnboardingForCancelledUser:', error);
    }
  };

  const updateOnboardingStatus = async (completed: boolean) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ onboarding_completed: completed })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating onboarding status:', error);
      } else {
        setProfile(prev => prev ? { ...prev, onboarding_completed: completed } : null);
      }
    } catch (error) {
      console.error('Error in updateOnboardingStatus:', error);
    }
  };

  useEffect(() => {
    console.log('Setting up auth state listener...');
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (event === 'SIGNED_OUT') {
          console.log('User signed out, clearing state...');
          setSession(null);
          setUser(null);
          setProfile(null);
          setSubscription(null);
          setLoading(false);
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Use setTimeout to prevent immediate subscription check on auth change
          setTimeout(async () => {
            const userProfile = await fetchUserProfile(session.user.id, session.user.email);
            setProfile(userProfile);
            console.log('User profile loaded:', userProfile);
            
            // Only check subscription after profile is loaded
            if (userProfile) {
              await checkSubscription();
            }
          }, 500); // Small delay to prevent cascading calls
        } else {
          setProfile(null);
          setSubscription(null);
        }
        
        setLoading(false);
      }
    );

    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting initial session:', error);
        } else {
          console.log('Initial session:', session?.user?.email || 'No session');
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            const userProfile = await fetchUserProfile(session.user.id, session.user.email);
            setProfile(userProfile);
            console.log('Initial profile loaded:', userProfile);
            
            if (userProfile) {
              await checkSubscription();
            }
          }
        }
      } catch (error) {
        console.error('Error in getSession:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    return () => {
      console.log('Cleaning up auth subscription');
      subscription.unsubscribe();
      if (subscriptionCheckTimeout.current) {
        clearTimeout(subscriptionCheckTimeout.current);
      }
    };
  }, []);

  const planLimits = getPlanLimits(subscription?.subscription_tier, subscription?.subscribed || false, subscription?.is_trial || false);
  const trialDaysRemaining = calculateTrialDaysRemaining(subscription?.trial_end || null);
  const isTrialExpired = subscription?.is_trial === false && subscription?.trial_end !== null && trialDaysRemaining === 0;

  const value = {
    user,
    session,
    profile,
    subscription,
    loading,
    planLimits,
    trialDaysRemaining,
    isTrialExpired,
    signOut,
    updateOnboardingStatus,
    checkSubscription,
    hasActiveSubscription,
    shouldRedirectToOnboarding,
    canCreateBot,
    canCreateKnowledgeBase,
    resetOnboardingForCancelledUser,
    startTrial,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
