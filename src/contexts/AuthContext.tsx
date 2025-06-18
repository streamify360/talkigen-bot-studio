import { createContext, useContext, useEffect, useState } from 'react';
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
  signOut: () => Promise<void>;
  updateOnboardingStatus: (completed: boolean) => Promise<void>;
  checkSubscription: () => Promise<void>;
  hasActiveSubscription: () => boolean;
  shouldRedirectToOnboarding: () => boolean;
  canCreateBot: (currentCount: number) => boolean;
  canCreateKnowledgeBase: (currentCount: number) => boolean;
  resetOnboardingForCancelledUser: () => Promise<void>;
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
const getPlanLimits = (tier: string | null, isSubscribed: boolean): PlanLimits => {
  // If not subscribed or subscription cancelled, no access
  if (!isSubscribed) {
    return {
      maxBots: 0,
      maxKnowledgeBases: 0,
      maxMessages: 0,
      maxStorage: 0
    };
  }

  switch (tier) {
    case 'Starter':
      return {
        maxBots: 3,
        maxKnowledgeBases: 2,
        maxMessages: 1000,
        maxStorage: 100
      };
    case 'Professional':
      return {
        maxBots: 10,
        maxKnowledgeBases: 5,
        maxMessages: 10000,
        maxStorage: 1000
      };
    case 'Enterprise':
      return {
        maxBots: -1, // unlimited
        maxKnowledgeBases: -1, // unlimited
        maxMessages: 100000,
        maxStorage: 10000
      };
    default:
      return {
        maxBots: 0,
        maxKnowledgeBases: 0,
        maxMessages: 0,
        maxStorage: 0
      };
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);

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

  const checkSubscription = async () => {
    if (!user) return;

    try {
      console.log('Checking subscription status...');
      const { data, error } = await supabase.functions.invoke('check-subscription');

      if (error) {
        console.error('Error checking subscription:', error);
        setSubscription({ subscribed: false, subscription_tier: null, subscription_end: null });
      } else {
        console.log('Subscription data received:', data);
        const subscriptionData = {
          subscribed: data.subscribed || false,
          subscription_tier: data.subscription_tier || null,
          subscription_end: data.subscription_end || null
        };
        setSubscription(subscriptionData);

        // If subscription is cancelled and user has completed onboarding, reset onboarding
        if (!subscriptionData.subscribed && profile?.onboarding_completed) {
          await resetOnboardingForCancelledUser();
        }
      }
    } catch (error) {
      console.error('Error in checkSubscription:', error);
      setSubscription({ subscribed: false, subscription_tier: null, subscription_end: null });
    }
  };

  const hasActiveSubscription = () => {
    return subscription?.subscribed || false;
  };

  const shouldRedirectToOnboarding = () => {
    if (!profile || !subscription) return false;
    
    // If user completed onboarding but has no active subscription, redirect to onboarding
    return profile.onboarding_completed && !subscription.subscribed;
  };

  const canCreateBot = (currentCount: number) => {
    const limits = getPlanLimits(subscription?.subscription_tier, subscription?.subscribed || false);
    return limits.maxBots === -1 || currentCount < limits.maxBots;
  };

  const canCreateKnowledgeBase = (currentCount: number) => {
    const limits = getPlanLimits(subscription?.subscription_tier, subscription?.subscribed || false);
    return limits.maxKnowledgeBases === -1 || currentCount < limits.maxKnowledgeBases;
  };

  const resetOnboardingForCancelledUser = async () => {
    if (!user) return;

    try {
      console.log('Resetting onboarding for cancelled user:', user.id);
      
      // Reset onboarding completion status
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

      // Clear all onboarding progress
      const { error: progressError } = await supabase
        .from('onboarding_progress')
        .delete()
        .eq('user_id', user.id);

      if (progressError) {
        console.error('Error clearing onboarding progress:', progressError);
        return;
      }

      // Update local profile state
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
          setTimeout(async () => {
            const userProfile = await fetchUserProfile(session.user.id, session.user.email);
            setProfile(userProfile);
            console.log('User profile loaded:', userProfile);
            
            await checkSubscription();
          }, 0);
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
            
            await checkSubscription();
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
    };
  }, []);

  const signOut = async () => {
    console.log('Signing out user...');
    try {
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

  const planLimits = getPlanLimits(subscription?.subscription_tier, subscription?.subscribed || false);

  const value = {
    user,
    session,
    profile,
    subscription,
    loading,
    planLimits,
    signOut,
    updateOnboardingStatus,
    checkSubscription,
    hasActiveSubscription,
    shouldRedirectToOnboarding,
    canCreateBot,
    canCreateKnowledgeBase,
    resetOnboardingForCancelledUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};