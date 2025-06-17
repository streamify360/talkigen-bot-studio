
-- Create a table to store Telegram bot tokens
CREATE TABLE public.telegram_bots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  bot_token TEXT NOT NULL,
  bot_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS) to ensure users can only see their own tokens
ALTER TABLE public.telegram_bots ENABLE ROW LEVEL SECURITY;

-- Create policy that allows users to SELECT their own tokens
CREATE POLICY "Users can view their own telegram bots" 
  ON public.telegram_bots 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create policy that allows users to INSERT their own tokens
CREATE POLICY "Users can create their own telegram bots" 
  ON public.telegram_bots 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create policy that allows users to UPDATE their own tokens
CREATE POLICY "Users can update their own telegram bots" 
  ON public.telegram_bots 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create policy that allows users to DELETE their own tokens
CREATE POLICY "Users can delete their own telegram bots" 
  ON public.telegram_bots 
  FOR DELETE 
  USING (auth.uid() = user_id);
