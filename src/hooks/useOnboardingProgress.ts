
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface OnboardingProgress {
  step_id: number;
  completed_at: string;
  step_data?: any;
}

interface UseOnboardingProgressProps {
  userId?: string;
}

export const useOnboardingProgress = ({ userId }: UseOnboardingProgressProps = {}) => {
  const [progress, setProgress] = useState<OnboardingProgress[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProgress = useCallback(async () => {
    if (!userId) {
      console.log('No userId provided to useOnboardingProgress');
      setProgress([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      console.log('Fetching onboarding progress for user:', userId);
      const { data, error } = await supabase
        .from('onboarding_progress')
        .select('*')
        .eq('user_id', userId)
        .order('step_id');

      if (error) {
        console.error('Error fetching onboarding progress:', error);
        setProgress([]);
      } else {
        console.log('Onboarding progress fetched:', data);
        setProgress(data || []);
      }
    } catch (error) {
      console.error('Error fetching onboarding progress:', error);
      setProgress([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const markStepComplete = async (stepId: number, stepData?: any) => {
    if (!userId) {
      console.error('No userId found, cannot mark step complete');
      return;
    }

    try {
      console.log('Marking step complete:', stepId, stepData);
      const { error } = await supabase
        .from('onboarding_progress')
        .upsert({
          user_id: userId,
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
    return progress.some(p => p.step_id === stepId);
  };

  const getLastCompletedStep = () => {
    if (progress.length === 0) {
      return -1;
    }
    const lastStep = Math.max(...progress.map(p => p.step_id));
    return lastStep;
  };

  const resetProgress = async () => {
    if (!userId) {
      console.error('No userId found, cannot reset progress');
      return;
    }

    try {
      console.log('Resetting onboarding progress for user:', userId);
      const { error } = await supabase
        .from('onboarding_progress')
        .delete()
        .eq('user_id', userId);

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

  // Fetch progress when userId changes - simplified to avoid infinite loops
  useEffect(() => {
    if (userId) {
      fetchProgress();
    } else {
      setProgress([]);
      setLoading(false);
    }
  }, [fetchProgress]);

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
