
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { UserCheck, UserX, Key, LogIn, Ban } from "lucide-react";

interface User {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string;
  profiles?: {
    first_name: string;
    last_name: string;
    company: string;
  };
  user_moderation?: Array<{
    action_type: string;
    is_active: boolean;
    expires_at: string;
  }>;
}

export const AdminUserTable = () => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [banReason, setBanReason] = useState("");
  const [banDuration, setBanDuration] = useState<string>("permanent");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          company,
          created_at
        `);

      if (error) throw error;
      return data;
    }
  });

  const loginAsUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.functions.invoke('admin-login-as-user', {
        body: { target_user_id: userId }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      window.open(data.login_url, '_blank');
      toast({
        title: "Login link generated",
        description: "Opening login link in new tab",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (userEmail: string) => {
      const { data, error } = await supabase.functions.invoke('admin-reset-password', {
        body: { user_email: userEmail }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Password reset sent",
        description: "Password reset email has been sent to the user",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const banUserMutation = useMutation({
    mutationFn: async ({ userId, reason, duration }: { userId: string; reason: string; duration: string }) => {
      const expires_at = duration === 'permanent' ? null : 
        new Date(Date.now() + parseInt(duration) * 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase.functions.invoke('admin-user-management', {
        body: { 
          action: 'ban',
          target_user_id: userId,
          reason,
          expires_at
        }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "User banned",
        description: "User has been banned successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setSelectedUser(null);
      setBanReason("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const unbanUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.functions.invoke('admin-user-management', {
        body: { 
          action: 'unban',
          target_user_id: userId
        }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "User unbanned",
        description: "User has been unbanned successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading users...</div>;
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users?.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <div>
                  <div className="font-medium">
                    {user.first_name} {user.last_name}
                  </div>
                </div>
              </TableCell>
              <TableCell>{user.company || 'N/A'}</TableCell>
              <TableCell>
                {new Date(user.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <Badge className="bg-green-100 text-green-800">Active</Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loginAsUserMutation.mutate(user.id)}
                    disabled={loginAsUserMutation.isPending}
                  >
                    <LogIn className="h-4 w-4 mr-1" />
                    Login As
                  </Button>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedUser(user)}
                      >
                        <Ban className="h-4 w-4 mr-1" />
                        Ban User
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Ban User</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium">Reason</label>
                          <Textarea
                            value={banReason}
                            onChange={(e) => setBanReason(e.target.value)}
                            placeholder="Enter reason for ban..."
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Duration</label>
                          <Select value={banDuration} onValueChange={setBanDuration}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1 Day</SelectItem>
                              <SelectItem value="7">7 Days</SelectItem>
                              <SelectItem value="30">30 Days</SelectItem>
                              <SelectItem value="permanent">Permanent</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          onClick={() => banUserMutation.mutate({
                            userId: user.id,
                            reason: banReason,
                            duration: banDuration
                          })}
                          disabled={banUserMutation.isPending || !banReason}
                          className="w-full"
                        >
                          Ban User
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
