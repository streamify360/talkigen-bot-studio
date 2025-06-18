
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
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
  subscription_status: string | null;
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
  isAdmin: boolean;
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
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = useCallback(async (userId: string) => {
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
            subscription_status: 'none',
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
  }, []);

  const checkAdminStatus = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('admin_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking admin status:', error);
      }

      return !!data;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }, []);

  const checkSubscription = useCallback(async () => {
    if (!user) {
      setSubscription({ subscribed: false, subscription_tier: null, subscription_end: null });
      return;
    }

    try {
      console.log('Checking subscription status...');
      const { data, error } = await supabase.functions.invoke('check-subscription');

      if (error) {
        console.error('Error checking subscription:', error);
        setSubscription({ subscribed: false, subscription_tier: null, subscription_end: null });
      } else {
        console.log('Subscription data received:', data);
        setSubscription({
          subscribed: data.subscribed || false,
          subscription_tier: data.subscription_tier || null,
          subscription_end: data.subscription_end || null
        });
      }
    } catch (error) {
      console.error('Error in checkSubscription:', error);
      setSubscription({ subscribed: false, subscription_tier: null, subscription_end: null });
    }
  }, [user]);

  const hasActiveSubscription = useCallback(() => {
    return subscription?.subscribed || false;
  }, [subscription?.subscribed]);

  const shouldRedirectToOnboarding = useCallback(() => {
    if (!profile || isAdmin) return false;
    
    // If user hasn't completed onboarding, redirect to onboarding
    if (!profile.onboarding_completed) return true;
    
    // If user completed onboarding but has no active subscription, redirect to onboarding
    return profile.onboarding_completed && !hasActiveSubscription();
  }, [profile, isAdmin, hasActiveSubscription]);

  const updateOnboardingStatus = async (completed: boolean) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          onboarding_completed: completed,
          updated_at: new Date().toISOString()
        })
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

  // Simplified auth state management to prevent infinite loading
  useEffect(() => {
    console.log('Setting up auth state listener...');
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Use setTimeout to defer async operations and prevent deadlocks
          setTimeout(async () => {
            try {
              // Check admin status first
              const adminStatus = await checkAdminStatus(session.user.id);
              setIsAdmin(adminStatus);

              // Fetch user profile
              const userProfile = await fetchUserProfile(session.user.id);
              setProfile(userProfile);
              console.log('User profile loaded:', userProfile);
              
              // Check subscription for non-admin users
              if (!adminStatus) {
                await checkSubscription();
              } else {
                setSubscription({ subscribed: true, subscription_tier: 'admin', subscription_end: null });
              }
            } catch (error) {
              console.error('Error in auth state change handler:', error);
            } finally {
              setLoading(false);
            }
          }, 0);
        } else {
          setProfile(null);
          setSubscription(null);
          setIsAdmin(false);
          setLoading(false);
        }
      }
    );

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting initial session:', error);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error in getSession:', error);
        setLoading(false);
      }
    };

    getInitialSession();

    return () => {
      console.log('Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, [fetchUserProfile, checkAdminStatus, checkSubscription]);

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
        setIsAdmin(false);
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
    isAdmin,
    signOut,
    updateOnboardingStatus,
    checkSubscription,
    hasActiveSubscription,
    shouldRedirectToOnboarding,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
