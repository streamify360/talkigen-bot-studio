
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';

interface OnboardingProtectedRouteProps {
  children: React.ReactNode;
}

const OnboardingProtectedRoute: React.FC<OnboardingProtectedRouteProps> = ({ children }) => {
  const { user, profile, loading, shouldRedirectToOnboarding } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setCheckingAdmin(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('admin_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error('Error checking admin status:', error);
        }

        setIsAdmin(!!data);
        
        // If user is admin, redirect them to admin dashboard
        if (data) {
          console.log('Admin user detected, redirecting to admin dashboard');
          window.location.href = '/admin';
          return;
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setCheckingAdmin(false);
      }
    };

    checkAdminStatus();
  }, [user]);

  if (loading || checkingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user is admin, they should already be redirected above
  // This is a fallback in case the redirect doesn't work
  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  // If user hasn't completed onboarding, redirect to onboarding
  if (profile && !profile.onboarding_completed) {
    return <Navigate to="/onboarding" replace />;
  }

  // If user completed onboarding but subscription is cancelled, redirect to onboarding
  if (shouldRedirectToOnboarding()) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};

export default OnboardingProtectedRoute;
