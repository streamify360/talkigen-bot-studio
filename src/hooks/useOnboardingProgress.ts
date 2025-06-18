import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface OnboardingProgress {
  step_id: number;
  completed_at: string;
  step_data?: any;
}

export const useOnboardingProgress = () => {
  const [progress, setProgress] = useState<OnboardingProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchProgress = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('onboarding_progress')
        .select('*')
        .eq('user_id', user.id)
        .order('step_id');

      if (error) throw error;
      setProgress(data || []);
    } catch (error) {
      console.error('Error fetching onboarding progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const markStepComplete = async (stepId: number, stepData?: any) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('onboarding_progress')
        .upsert({
          user_id: user.id,
          step_id: stepId,
          step_data: stepData || {},
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,step_id'
        });

      if (error) throw error;
      await fetchProgress(); // Refresh progress
    } catch (error) {
      console.error('Error marking step complete:', error);
    }
  };

  const isStepComplete = (stepId: number) => {
    return progress.some(p => p.step_id === stepId);
  };

  const getLastCompletedStep = () => {
    if (progress.length === 0) return -1;
    return Math.max(...progress.map(p => p.step_id));
  };

  const clearProgress = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('onboarding_progress')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
      setProgress([]);
    } catch (error) {
      console.error('Error clearing onboarding progress:', error);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, [user]);

  return {
    progress,
    loading,
    markStepComplete,
    isStepComplete,
    getLastCompletedStep,
    refreshProgress: fetchProgress,
    clearProgress
  };
};