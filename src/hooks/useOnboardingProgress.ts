
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OnboardingStep {
  id: number;
  step_id: number;
  completed_at: string;
  step_data: any;
}

interface UseOnboardingProgressProps {
  userId?: string;
}

export const useOnboardingProgress = ({ userId }: UseOnboardingProgressProps) => {
  const [progress, setProgress] = useState<OnboardingStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchProgress = useCallback(async () => {
    if (!userId) {
      setProgress([]);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('onboarding_progress')
        .select('*')
        .eq('user_id', userId)
        .order('step_id', { ascending: true });

      if (fetchError) {
        console.error('Error fetching onboarding progress:', fetchError);
        setError(fetchError.message);
      } else {
        setProgress(data || []);
      }
    } catch (error) {
      console.error('Error in fetchProgress:', error);
      setError('Failed to fetch progress');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const markStepComplete = useCallback(async (stepId: number, stepData: any = {}) => {
    if (!userId) {
      console.error('No user ID provided');
      return;
    }

    try {
      // Check if step is already completed
      const existingStep = progress.find(p => p.step_id === stepId);
      if (existingStep) {
        console.log(`Step ${stepId} already completed`);
        return;
      }

      const { data, error } = await supabase
        .from('onboarding_progress')
        .insert([
          {
            user_id: userId,
            step_id: stepId,
            step_data: stepData,
            completed_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Error marking step complete:', error);
        toast({
          title: "Error",
          description: "Failed to save progress. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Update local state immediately
      setProgress(prev => [...prev, data]);
      
      console.log(`Step ${stepId} marked as complete`);
    } catch (error) {
      console.error('Error in markStepComplete:', error);
      toast({
        title: "Error",
        description: "Failed to save progress. Please try again.",
        variant: "destructive",
      });
    }
  }, [userId, progress, toast]);

  const resetProgress = useCallback(async () => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('onboarding_progress')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('Error resetting progress:', error);
      } else {
        setProgress([]);
        console.log('Onboarding progress reset');
      }
    } catch (error) {
      console.error('Error in resetProgress:', error);
    }
  }, [userId]);

  const isStepComplete = useCallback((stepId: number) => {
    return progress.some(p => p.step_id === stepId);
  }, [progress]);

  const getLastCompletedStep = useCallback(() => {
    if (progress.length === 0) return -1;
    const completedSteps = progress.map(p => p.step_id).sort((a, b) => a - b);
    return completedSteps[completedSteps.length - 1];
  }, [progress]);

  return {
    progress,
    loading,
    error,
    markStepComplete,
    resetProgress,
    isStepComplete,
    getLastCompletedStep,
    refreshProgress: fetchProgress,
  };
};
