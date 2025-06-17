
-- Create admin roles table
CREATE TABLE public.admin_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    granted_by UUID REFERENCES auth.users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create user management table for bans and moderation
CREATE TABLE public.user_moderation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    action_type TEXT NOT NULL CHECK (action_type IN ('ban', 'unban', 'warning')),
    reason TEXT,
    admin_id UUID REFERENCES auth.users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

-- Create system settings table for pricing plans
CREATE TABLE public.system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT NOT NULL UNIQUE,
    setting_value JSONB NOT NULL,
    updated_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create temp login tokens table for admin login-as-user
CREATE TABLE public.temp_login_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_moderation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.temp_login_tokens ENABLE ROW LEVEL SECURITY;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.admin_roles 
        WHERE admin_roles.user_id = $1
    );
$$;

-- Create function to check if user is banned
CREATE OR REPLACE FUNCTION public.is_user_banned(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_moderation 
        WHERE user_moderation.user_id = $1 
        AND action_type = 'ban' 
        AND is_active = true 
        AND (expires_at IS NULL OR expires_at > NOW())
    );
$$;

-- RLS Policies for admin_roles
CREATE POLICY "Admins can view admin roles" ON public.admin_roles
    FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can manage admin roles" ON public.admin_roles
    FOR ALL USING (public.is_admin());

-- RLS Policies for user_moderation
CREATE POLICY "Admins can view user moderation" ON public.user_moderation
    FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can manage user moderation" ON public.user_moderation
    FOR ALL USING (public.is_admin());

-- RLS Policies for system_settings
CREATE POLICY "Admins can view system settings" ON public.system_settings
    FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can manage system settings" ON public.system_settings
    FOR ALL USING (public.is_admin());

-- RLS Policies for temp_login_tokens
CREATE POLICY "Admins can manage temp login tokens" ON public.temp_login_tokens
    FOR ALL USING (public.is_admin());

-- Insert the admin user
INSERT INTO public.admin_roles (user_id, role) 
SELECT id, 'super_admin' 
FROM auth.users 
WHERE email = 'yahyahanifofficial@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'super_admin';

-- Insert default pricing plans
INSERT INTO public.system_settings (setting_key, setting_value) VALUES 
('pricing_plans', '{
    "starter": {
        "name": "Starter",
        "price": 9.99,
        "features": ["3 Chatbots", "Basic Analytics", "Email Support", "1GB Storage"],
        "limits": {
            "maxBots": 3,
            "maxKnowledgeBases": 2,
            "maxMessages": 1000,
            "maxStorage": 100
        }
    },
    "professional": {
        "name": "Professional", 
        "price": 19.99,
        "features": ["10 Chatbots", "Advanced Analytics", "Priority Support", "10GB Storage", "Custom Branding"],
        "limits": {
            "maxBots": 10,
            "maxKnowledgeBases": 5,
            "maxMessages": 10000,
            "maxStorage": 1000
        }
    },
    "enterprise": {
        "name": "Enterprise",
        "price": 49.99, 
        "features": ["Unlimited Chatbots", "Full Analytics Suite", "24/7 Support", "100GB Storage", "White Label", "API Access"],
        "limits": {
            "maxBots": -1,
            "maxKnowledgeBases": -1,
            "maxMessages": 100000,
            "maxStorage": 10000
        }
    }
}'::jsonb)
ON CONFLICT (setting_key) DO NOTHING;
