
-- Add foreign key constraints for facebook_bots and telegram_bots to reference chatbots table
-- This will allow us to access chatbot descriptions through the relationship

-- First, let's make sure the foreign key columns exist and are properly set up
ALTER TABLE public.facebook_bots 
DROP CONSTRAINT IF EXISTS facebook_bots_chatbot_id_fkey;

ALTER TABLE public.telegram_bots 
DROP CONSTRAINT IF EXISTS telegram_bots_chatbot_id_fkey;

-- Add the foreign key constraints
ALTER TABLE public.facebook_bots 
ADD CONSTRAINT facebook_bots_chatbot_id_fkey 
FOREIGN KEY (chatbot_id) REFERENCES public.chatbots(id) ON DELETE CASCADE;

ALTER TABLE public.telegram_bots 
ADD CONSTRAINT telegram_bots_chatbot_id_fkey 
FOREIGN KEY (chatbot_id) REFERENCES public.chatbots(id) ON DELETE CASCADE;

-- Create indexes for better performance when joining
CREATE INDEX IF NOT EXISTS idx_facebook_bots_chatbot_id ON public.facebook_bots(chatbot_id);
CREATE INDEX IF NOT EXISTS idx_telegram_bots_chatbot_id ON public.telegram_bots(chatbot_id);
