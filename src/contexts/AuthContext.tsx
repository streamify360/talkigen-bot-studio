
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
const getPlanLimits = (tier: string | null): PlanLimits => {
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
  const [subscription, setSubscription] = useState<SubscriptionInfo>({ 
    subscribed: false, 
    subscription_tier: null, 
    subscription_end: null 
  });
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (userId: string) => {
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
          const { data: retry } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();
          return retry;
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
    if (!user) {
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');

      if (error) {
        console.error('Error checking subscription:', error);
      } else {
        const subscriptionData = {
          subscribed: data.subscribed || false,
          subscription_tier: data.subscription_tier || null,
          subscription_end: data.subscription_end || null
        };
        setSubscription(subscriptionData);
      }
    } catch (error) {
      console.error('Error in checkSubscription:', error);
    }
  };

  const hasActiveSubscription = () => {
    return subscription?.subscribed || false;
  };

  const shouldRedirectToOnboarding = () => {
    if (!profile) return false;
    return !profile.onboarding_completed;
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
    let mounted = true;

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserProfile(session.user.id).then(userProfile => {
          if (mounted) {
            setProfile(userProfile);
            setLoading(false);
          }
        });
      } else {
        setLoading(false);
      }
    });

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          const userProfile = await fetchUserProfile(session.user.id);
          if (mounted) {
            setProfile(userProfile);
          }
        } else {
          if (mounted) {
            setProfile(null);
            setSubscription({ subscribed: false, subscription_tier: null, subscription_end: null });
          }
        }
        
        if (mounted) {
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
        throw error;
      } else {
        setProfile(null);
        setSubscription({ subscribed: false, subscription_tier: null, subscription_end: null });
        setUser(null);
        setSession(null);
      }
    } catch (error) {
      console.error('Failed to sign out:', error);
      throw error;
    }
  };

  const planLimits = getPlanLimits(subscription?.subscription_tier);

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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
