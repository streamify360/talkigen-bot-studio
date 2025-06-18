
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
  const [initialized, setInitialized] = useState(false);

  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      console.log('Fetching profile for user:', userId);
      let { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (data) {
        console.log('Profile found:', data);
        return data;
      }

      if (error && error.code !== "PGRST116") {
        console.error('Error fetching user profile:', error);
        return null;
      }

      // Create profile if it doesn't exist
      console.log('Creating new profile for user:', userId);
      const { data: newProfile, error: createError } = await supabase
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
        ])
        .select()
        .single();
      
      if (createError) {
        console.error("Failed to create profile:", createError);
        return null;
      }

      return newProfile;
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

  // Initialize auth state
  useEffect(() => {
    if (initialized) return;

    console.log('Initializing auth state...');
    
    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (initialSession?.user) {
          console.log('Initial session found:', initialSession.user.email);
          setSession(initialSession);
          setUser(initialSession.user);
          
          // Load user data
          const [userProfile, adminStatus] = await Promise.all([
            fetchUserProfile(initialSession.user.id),
            checkAdminStatus(initialSession.user.id)
          ]);
          
          setProfile(userProfile);
          setIsAdmin(adminStatus);
          
          // Check subscription for non-admin users
          if (!adminStatus && userProfile) {
            await checkSubscription();
          } else if (adminStatus) {
            setSubscription({ subscribed: true, subscription_tier: 'admin', subscription_end: null });
          }
        }
      } catch (error) {
        console.error('Error during auth initialization:', error);
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };

    initializeAuth();
  }, [initialized, fetchUserProfile, checkAdminStatus, checkSubscription]);

  // Set up auth state listener
  useEffect(() => {
    if (!initialized) return;

    console.log('Setting up auth state listener...');
    
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setProfile(null);
          setSubscription(null);
          setIsAdmin(false);
          return;
        }
        
        if (session?.user && event === 'SIGNED_IN') {
          setSession(session);
          setUser(session.user);
          
          // Load user data
          const [userProfile, adminStatus] = await Promise.all([
            fetchUserProfile(session.user.id),
            checkAdminStatus(session.user.id)
          ]);
          
          setProfile(userProfile);
          setIsAdmin(adminStatus);
          
          // Check subscription for non-admin users
          if (!adminStatus && userProfile) {
            await checkSubscription();
          } else if (adminStatus) {
            setSubscription({ subscribed: true, subscription_tier: 'admin', subscription_end: null });
          }
        }
      }
    );

    return () => {
      console.log('Cleaning up auth subscription');
      authSubscription.unsubscribe();
    };
  }, [initialized, fetchUserProfile, checkAdminStatus, checkSubscription]);

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
