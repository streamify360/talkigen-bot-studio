
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
          .select('*')
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

        // Get target user email
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(tokenData.target_user_id);

        if (userError || !userData.user) {
          toast({
            title: "User not found",
            description: "Target user no longer exists",
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

        // Generate a magic link for the target user
        const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
          type: 'magiclink',
          email: userData.user.email!,
          options: {
            redirectTo: `${window.location.origin}/dashboard`
          }
        });

        if (linkError) {
          throw linkError;
        }

        // Extract the access and refresh tokens from the magic link
        const url = new URL(linkData.properties.action_link);
        const accessToken = url.searchParams.get('access_token');
        const refreshToken = url.searchParams.get('refresh_token');

        if (accessToken && refreshToken) {
          // Set the session using the tokens
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (sessionError) {
            throw sessionError;
          }

          toast({
            title: "Admin login successful",
            description: `Logged in as ${userData.user.email}`,
          });

          navigate('/dashboard');
        } else {
          throw new Error('Failed to extract tokens from magic link');
        }

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
