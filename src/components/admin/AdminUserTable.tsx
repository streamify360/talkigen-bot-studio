
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Search, 
  MoreVertical, 
  UserCheck, 
  UserX, 
  Key, 
  LogIn,
  Calendar
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  company: string;
  created_at: string;
  last_sign_in_at: string;
}

interface UserModerationAction {
  id: string;
  action_type: string;
  reason: string;
  created_at: string;
  expires_at: string | null;
  is_active: boolean;
}

export const AdminUserTable = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [banReason, setBanReason] = useState("");
  const [banDuration, setBanDuration] = useState("permanent");
  const [userActions, setUserActions] = useState<UserModerationAction[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Call admin user management function to get users with profiles
      const { data, error } = await supabase.functions.invoke('admin-user-management', {
        body: { action: 'list_users' }
      });

      if (error) {
        throw error;
      }

      setUsers(data || []);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserActions = async (userId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-user-management', {
        body: { action: 'get_user_actions', user_id: userId }
      });

      if (error) {
        throw error;
      }

      setUserActions(data || []);
    } catch (error: any) {
      console.error('Error fetching user actions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch user actions",
        variant: "destructive",
      });
    }
  };

  const handleBanUser = async () => {
    if (!selectedUser) return;

    try {
      const expiresAt = banDuration === 'permanent' ? null : 
        new Date(Date.now() + parseInt(banDuration) * 24 * 60 * 60 * 1000).toISOString();

      const { error } = await supabase.functions.invoke('admin-user-management', {
        body: {
          action: 'ban_user',
          user_id: selectedUser.id,
          reason: banReason,
          expires_at: expiresAt
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "User banned",
        description: `${selectedUser.email} has been banned successfully`,
      });

      setBanReason("");
      setBanDuration("permanent");
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      console.error('Error banning user:', error);
      toast({
        title: "Error",
        description: "Failed to ban user",
        variant: "destructive",
      });
    }
  };

  const handleUnbanUser = async (userId: string) => {
    try {
      const { error } = await supabase.functions.invoke('admin-user-management', {
        body: {
          action: 'unban_user',
          user_id: userId
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "User unbanned",
        description: "User has been unbanned successfully",
      });

      fetchUsers();
    } catch (error: any) {
      console.error('Error unbanning user:', error);
      toast({
        title: "Error",
        description: "Failed to unban user",
        variant: "destructive",
      });
    }
  };

  const handleLoginAsUser = async (userId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-login-as-user', {
        body: { target_user_id: userId }
      });

      if (error) {
        throw error;
      }

      // Open the login URL in a new tab
      window.open(data.login_url, '_blank');
      
      toast({
        title: "Login link generated",
        description: "Opening login link in new tab",
      });
    } catch (error: any) {
      console.error('Error generating login link:', error);
      toast({
        title: "Error",
        description: "Failed to generate login link",
        variant: "destructive",
      });
    }
  };

  const handleResetPassword = async (userEmail: string) => {
    try {
      const { error } = await supabase.functions.invoke('admin-reset-password', {
        body: { user_email: userEmail }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Password reset sent",
        description: `Password reset email sent to ${userEmail}`,
      });
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast({
        title: "Error",
        description: "Failed to send password reset",
        variant: "destructive",
      });
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.first_name && user.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.last_name && user.last_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleUserSelect = (user: User) => {
    setSelectedUser({
      id: user.id,
      email: user.email,
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      company: user.company || '',
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at || ''
    });
    fetchUserActions(user.id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search users by email or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={fetchUsers} variant="outline">
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Management ({filteredUsers.length} users)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Last Sign In</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{user.first_name} {user.last_name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>{user.company || 'N/A'}</TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleLoginAsUser(user.id)}
                      >
                        <LogIn className="h-4 w-4 mr-1" />
                        Login As
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleResetPassword(user.email)}
                      >
                        <Key className="h-4 w-4 mr-1" />
                        Reset PWD
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUserSelect(user)}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Manage User: {user.email}</DialogTitle>
                            <DialogDescription>
                              Perform moderation actions on this user account
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Ban Reason</label>
                              <Textarea
                                placeholder="Enter reason for ban..."
                                value={banReason}
                                onChange={(e) => setBanReason(e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Ban Duration</label>
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
                            <div className="flex space-x-2">
                              <Button
                                onClick={handleBanUser}
                                variant="destructive"
                                className="flex-1"
                              >
                                <UserX className="h-4 w-4 mr-2" />
                                Ban User
                              </Button>
                              <Button
                                onClick={() => handleUnbanUser(user.id)}
                                variant="outline"
                                className="flex-1"
                              >
                                <UserCheck className="h-4 w-4 mr-2" />
                                Unban User
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
