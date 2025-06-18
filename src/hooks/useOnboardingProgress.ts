
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
      console.log('Fetching onboarding progress for user:', user.id);
      const { data, error } = await supabase
        .from('onboarding_progress')
        .select('*')
        .eq('user_id', user.id)
        .order('step_id');

      if (error) {
        console.error('Error fetching onboarding progress:', error);
        throw error;
      }
      
      console.log('Onboarding progress fetched:', data);
      setProgress(data || []);
    } catch (error) {
      console.error('Error fetching onboarding progress:', error);
      setProgress([]);
    } finally {
      setLoading(false);
    }
  };

  const markStepComplete = async (stepId: number, stepData?: any) => {
    if (!user) {
      console.error('No user found, cannot mark step complete');
      return;
    }

    try {
      console.log('Marking step complete:', stepId, stepData);
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

      if (error) {
        console.error('Error marking step complete:', error);
        throw error;
      }
      
      console.log('Step marked complete successfully');
      await fetchProgress(); // Refresh progress
    } catch (error) {
      console.error('Error marking step complete:', error);
    }
  };

  const isStepComplete = (stepId: number) => {
    const isComplete = progress.some(p => p.step_id === stepId);
    console.log(`Step ${stepId} is complete:`, isComplete);
    return isComplete;
  };

  const getLastCompletedStep = () => {
    if (progress.length === 0) {
      console.log('No progress found, returning -1');
      return -1;
    }
    const lastStep = Math.max(...progress.map(p => p.step_id));
    console.log('Last completed step:', lastStep);
    return lastStep;
  };

  const resetProgress = async () => {
    if (!user) {
      console.error('No user found, cannot reset progress');
      return;
    }

    try {
      console.log('Resetting onboarding progress for user:', user.id);
      const { error } = await supabase
        .from('onboarding_progress')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        console.error('Error resetting progress:', error);
        throw error;
      }
      
      console.log('Progress reset successfully');
      setProgress([]);
    } catch (error) {
      console.error('Error resetting progress:', error);
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
    resetProgress,
    refreshProgress: fetchProgress
  };
};
