
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';

interface OnboardingProtectedRouteProps {
  children: React.ReactNode;
}

const OnboardingProtectedRoute: React.FC<OnboardingProtectedRouteProps> = ({ children }) => {
  const { user, profile, loading: authLoading } = useAuth();
  const { subscription, isTrialExpired, isLoading: subscriptionLoading } = useSubscription();

  console.log('OnboardingProtectedRoute check:', {
    authLoading,
    subscriptionLoading,
    user: !!user,
    profileOnboardingCompleted: profile?.onboarding_completed,
    subscriptionSubscribed: subscription?.subscribed,
    isTrialExpired
  });

  // Show loading while auth or subscription is loading
  if (authLoading || subscriptionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If no user, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user hasn't completed onboarding at all, allow access to onboarding
  if (profile && !profile.onboarding_completed) {
    return <>{children}</>;
  }

  // If user completed onboarding but subscription is invalid, allow access to onboarding to fix subscription
  if (profile?.onboarding_completed && subscription && (!subscription.subscribed && !subscription.is_trial)) {
    return <>{children}</>;
  }

  // If trial expired, allow access to onboarding to renew
  if (isTrialExpired) {
    return <>{children}</>;
  }

  // If user has completed onboarding and has valid subscription, redirect to dashboard
  if (profile?.onboarding_completed && subscription && (subscription.subscribed || subscription.is_trial) && !isTrialExpired) {
    return <Navigate to="/dashboard" replace />;
  }

  // Default: allow access to onboarding
  return <>{children}</>;
};

export default OnboardingProtectedRoute;
