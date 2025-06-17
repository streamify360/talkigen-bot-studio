
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const AdminLogin = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleAdminLogin = async () => {
      if (!token) {
        toast({
          title: "Invalid token",
          description: "No login token provided",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      try {
        // Verify the token and get user info
        const { data: tokenData, error: tokenError } = await supabase
          .from('temp_login_tokens')
          .select(`
            *,
            target_user:target_user_id(id, email)
          `)
          .eq('token', token)
          .eq('used_at', null)
          .gt('expires_at', new Date().toISOString())
          .single();

        if (tokenError || !tokenData) {
          toast({
            title: "Invalid or expired token",
            description: "This login link is no longer valid",
            variant: "destructive",
          });
          navigate("/");
          return;
        }

        // Mark token as used
        await supabase
          .from('temp_login_tokens')
          .update({ used_at: new Date().toISOString() })
          .eq('id', tokenData.id);

        // Generate a new session for the target user
        const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
          type: 'magiclink',
          email: tokenData.target_user.email,
        });

        if (sessionError) {
          throw sessionError;
        }

        // Sign in with the generated link
        const { error: signInError } = await supabase.auth.signInWithOtp({
          email: tokenData.target_user.email,
          options: {
            emailRedirectTo: window.location.origin + '/dashboard',
          }
        });

        if (signInError) {
          throw signInError;
        }

        toast({
          title: "Admin login successful",
          description: `Logged in as ${tokenData.target_user.email}`,
        });

        navigate('/dashboard');

      } catch (error: any) {
        console.error('Admin login error:', error);
        toast({
          title: "Login failed",
          description: error.message || "Failed to login as user",
          variant: "destructive",
        });
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    handleAdminLogin();
  }, [token, navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Admin Login</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          {loading ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="text-gray-600">Processing admin login...</p>
            </>
          ) : (
            <p className="text-gray-600">Login completed. Redirecting...</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
