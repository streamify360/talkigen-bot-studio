
-- Create a table for Facebook bots
CREATE TABLE public.facebook_bots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  page_access_token TEXT NOT NULL,
  page_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS) to ensure users can only see their own Facebook bots
ALTER TABLE public.facebook_bots ENABLE ROW LEVEL SECURITY;

-- Create policy that allows users to SELECT their own Facebook bots
CREATE POLICY "Users can view their own Facebook bots" 
  ON public.facebook_bots 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create policy that allows users to INSERT their own Facebook bots
CREATE POLICY "Users can create their own Facebook bots" 
  ON public.facebook_bots 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create policy that allows users to UPDATE their own Facebook bots
CREATE POLICY "Users can update their own Facebook bots" 
  ON public.facebook_bots 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create policy that allows users to DELETE their own Facebook bots
CREATE POLICY "Users can delete their own Facebook bots" 
  ON public.facebook_bots 
  FOR DELETE 
  USING (auth.uid() = user_id);
