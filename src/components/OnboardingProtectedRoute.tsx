
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface OnboardingProtectedRouteProps {
  children: React.ReactNode;
}

const OnboardingProtectedRoute: React.FC<OnboardingProtectedRouteProps> = ({ children }) => {
  const { user, profile, loading } = useAuth();

  console.log('OnboardingProtectedRoute:', { user: !!user, profile, loading });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    console.log('No user, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // If profile doesn't exist yet, show loading
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If user hasn't completed onboarding, redirect to onboarding
  if (!profile.onboarding_completed) {
    console.log('Onboarding not completed, redirecting to onboarding');
    return <Navigate to="/onboarding" replace />;
  }

  // Allow access to dashboard
  console.log('Access granted to dashboard');
  return <>{children}</>;
};

export default OnboardingProtectedRoute;
