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

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  subscription: SubscriptionInfo | null;
  loading: boolean;
  signOut: () => Promise<void>;
  updateOnboardingStatus: (completed: boolean) => Promise<void>;
  checkSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
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

      // If error is not 406 (not found), log it and continue
      if (error && error.code !== "PGRST116") {
        console.error('Error fetching user profile:', error);
      }

      // Second pass: try to insert a profile, but catch duplicate error and fetch again
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
        // If duplicate key, someone else already created the profile: so fetch again!
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

      // After insert, fetch one last time
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
        // Update local profile state
        setProfile(prev => prev ? { ...prev, onboarding_completed: completed } : null);
      }
    } catch (error) {
      console.error('Error in updateOnboardingStatus:', error);
    }
  };

  useEffect(() => {
    console.log('Setting up auth state listener...');
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Updated: new fetchUserProfile usage
          setTimeout(async () => {
            const userProfile = await fetchUserProfile(session.user.id, session.user.email);
            setProfile(userProfile);
            console.log('User profile loaded:', userProfile);
            
            // Check subscription status after profile is loaded
            await checkSubscription();
          }, 0);
        } else {
          setProfile(null);
          setSubscription(null);
        }
        
        setLoading(false);
      }
    );

    // Get initial session
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
            
            // Check subscription status
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
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
    } else {
      console.log('User signed out successfully');
      setProfile(null);
      setSubscription(null);
    }
  };

  const value = {
    user,
    session,
    profile,
    subscription,
    loading,
    signOut,
    updateOnboardingStatus,
    checkSubscription,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
