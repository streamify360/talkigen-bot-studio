
-- Create table to track individual onboarding step completion
CREATE TABLE public.onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  step_id INTEGER NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  step_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, step_id)
);

-- Enable Row Level Security
ALTER TABLE public.onboarding_progress ENABLE ROW LEVEL SECURITY;

-- Create policies for onboarding_progress table
CREATE POLICY "Users can view their own onboarding progress" 
  ON public.onboarding_progress 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own onboarding progress" 
  ON public.onboarding_progress 
  FOR ALL 
  USING (auth.uid() = user_id);

-- Add subscription_status to profiles table for webhook updates
ALTER TABLE public.profiles 
ADD COLUMN subscription_status TEXT DEFAULT 'none';

-- Update subscribers table to include webhook_received timestamp
ALTER TABLE public.subscribers 
ADD COLUMN webhook_received TIMESTAMP WITH TIME ZONE;
