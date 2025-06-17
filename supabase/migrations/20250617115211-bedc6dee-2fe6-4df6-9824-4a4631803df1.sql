
-- Add chatbot_id foreign key to facebook_bots table
ALTER TABLE public.facebook_bots 
ADD COLUMN chatbot_id UUID REFERENCES public.chatbots(id) ON DELETE CASCADE;

-- Add chatbot_id foreign key to telegram_bots table  
ALTER TABLE public.telegram_bots 
ADD COLUMN chatbot_id UUID REFERENCES public.chatbots(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX idx_facebook_bots_chatbot_id ON public.facebook_bots(chatbot_id);
CREATE INDEX idx_telegram_bots_chatbot_id ON public.telegram_bots(chatbot_id);
