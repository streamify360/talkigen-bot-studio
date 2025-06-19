
-- Enable realtime for subscribers table
ALTER TABLE public.subscribers REPLICA IDENTITY FULL;

-- Add the subscribers table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.subscribers;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subscribers_user_id ON public.subscribers(user_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_email ON public.subscribers(email);
CREATE INDEX IF NOT EXISTS idx_subscribers_stripe_customer_id ON public.subscribers(stripe_customer_id);

-- Add RLS policies for subscribers table
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.subscribers;
DROP POLICY IF EXISTS "Users can update their own subscription" ON public.subscribers;
DROP POLICY IF EXISTS "Service role can manage all subscriptions" ON public.subscribers;

CREATE POLICY "Users can view their own subscription" ON public.subscribers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription" ON public.subscribers
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all subscriptions" ON public.subscribers
  FOR ALL USING (true);

-- Create function to handle subscription updates
CREATE OR REPLACE FUNCTION handle_subscription_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the change for debugging
  INSERT INTO public.system_settings (setting_key, setting_value, updated_by) 
  VALUES (
    'last_subscription_update', 
    jsonb_build_object(
      'user_id', COALESCE(NEW.user_id, OLD.user_id),
      'event', TG_OP,
      'timestamp', NOW()
    ),
    COALESCE(NEW.user_id, OLD.user_id)
  ) ON CONFLICT (setting_key) 
  DO UPDATE SET 
    setting_value = EXCLUDED.setting_value,
    updated_at = NOW();
    
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for subscription changes
DROP TRIGGER IF EXISTS on_subscription_change ON public.subscribers;
CREATE TRIGGER on_subscription_change
  AFTER INSERT OR UPDATE OR DELETE ON public.subscribers
  FOR EACH ROW EXECUTE FUNCTION handle_subscription_change();
