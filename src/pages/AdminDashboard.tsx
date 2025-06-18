
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bot, Users, DollarSign, Activity, Shield, 
  TrendingUp, Database, MessageSquare,
  Settings, LogOut, RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { AdminUserTable } from "@/components/admin/AdminUserTable";
import { SystemSettings } from "@/components/admin/SystemSettings";
import { AdminBotsTable } from "@/components/admin/AdminBotsTable";
import { AdminKnowledgeBaseTable } from "@/components/admin/AdminKnowledgeBaseTable";

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalBots: number;
  totalKnowledgeBases: number;
  bannedUsers: number;
  totalSubscribers: number;
}

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [adminStats, setAdminStats] = useState<AdminStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalBots: 0,
    totalKnowledgeBases: 0,
    bannedUsers: 0,
    totalSubscribers: 0
  });
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signOut } = useAuth();

  useEffect(() => {
    fetchAdminStats();
    
    // Set up real-time subscriptions
    const usersChannel = supabase
      .channel('admin-users-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        console.log('Users data changed, refreshing stats...');
        fetchAdminStats();
      })
      .subscribe();

    const botsChannel = supabase
      .channel('admin-bots-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chatbots' }, () => {
        console.log('Bots data changed, refreshing stats...');
        fetchAdminStats();
      })
      .subscribe();

    const kbChannel = supabase
      .channel('admin-kb-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'knowledge_base' }, () => {
        console.log('Knowledge base data changed, refreshing stats...');
        fetchAdminStats();
      })
      .subscribe();

    const moderationChannel = supabase
      .channel('admin-moderation-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_moderation' }, () => {
        console.log('Moderation data changed, refreshing stats...');
        fetchAdminStats();
      })
      .subscribe();

    // Auto-refresh every 30 seconds if enabled
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(fetchAdminStats, 30000);
    }

    return () => {
      supabase.removeChannel(usersChannel);
      supabase.removeChannel(botsChannel);
      supabase.removeChannel(kbChannel);
      supabase.removeChannel(moderationChannel);
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const fetchAdminStats = async () => {
    try {
      setLoading(true);
      
      // Get total users count
      const { count: totalUsers, error: usersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (usersError && usersError.code !== 'PGRST116') {
        console.error('Error fetching users count:', usersError);
      }

      // Get banned users count
      const { count: bannedUsers, error: bannedError } = await supabase
        .from('user_moderation')
        .select('*', { count: 'exact', head: true })
        .eq('action_type', 'ban')
        .eq('is_active', true);

      if (bannedError && bannedError.code !== 'PGRST116') {
        console.error('Error fetching banned users count:', bannedError);
      }

      // Get total bots count
      const { count: totalBots, error: botsError } = await supabase
        .from('chatbots')
        .select('*', { count: 'exact', head: true });

      if (botsError && botsError.code !== 'PGRST116') {
        console.error('Error fetching bots count:', botsError);
      }

      // Get total knowledge bases count
      const { count: totalKnowledgeBases, error: kbError } = await supabase
        .from('knowledge_base')
        .select('*', { count: 'exact', head: true });

      if (kbError && kbError.code !== 'PGRST116') {
        console.error('Error fetching knowledge bases count:', kbError);
      }

      // Get total subscribers count
      const { count: totalSubscribers, error: subsError } = await supabase
        .from('subscribers')
        .select('*', { count: 'exact', head: true })
        .eq('subscribed', true);

      if (subsError && subsError.code !== 'PGRST116') {
        console.error('Error fetching subscribers count:', subsError);
      }

      setAdminStats({
        totalUsers: totalUsers || 0,
        activeUsers: Math.max(0, (totalUsers || 0) - (bannedUsers || 0)),
        totalBots: totalBots || 0,
        totalKnowledgeBases: totalKnowledgeBases || 0,
        bannedUsers: bannedUsers || 0,
        totalSubscribers: totalSubscribers || 0
      });

    } catch (error) {
      console.error('Error fetching admin stats:', error);
      toast({
        title: "Error",
        description: "Failed to fetch admin statistics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Admin signed out",
        description: "You have been successfully signed out.",
      });
      navigate("/");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    }
  };

  if (loading && adminStats.totalUsers === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-red-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-red-600 to-purple-600 bg-clip-text text-transparent">
                Talkigen Admin
              </span>
            </Link>
            <Badge variant="destructive" className="bg-red-100 text-red-800">
              Admin Panel
            </Badge>
            {autoRefresh && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <Activity className="h-3 w-3 mr-1" />
                Real-time
              </Badge>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={autoRefresh ? "bg-green-50 border-green-200" : ""}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
              {autoRefresh ? 'Auto-refresh On' : 'Auto-refresh Off'}
            </Button>
            <Button variant="outline" size="sm" onClick={fetchAdminStats} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Monitor platform performance and manage users in real-time</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="bots">Bots</TabsTrigger>
            <TabsTrigger value="knowledge">Knowledge</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Real-time Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{adminStats.totalUsers.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    {adminStats.bannedUsers} banned • {adminStats.totalSubscribers} subscribed
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                  <Users className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{adminStats.activeUsers.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    Not banned or suspended
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Bots</CardTitle>
                  <Bot className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{adminStats.totalBots.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    Across all users
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Knowledge Bases</CardTitle>
                  <Database className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{adminStats.totalKnowledgeBases.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    Total knowledge bases
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Platform Health and Quick Actions */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5" />
                    <span>Platform Health</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">System Status</span>
                      <Badge className="bg-green-100 text-green-800">Operational</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Active Users</span>
                      <span className="font-medium">{adminStats.activeUsers}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Banned Users</span>
                      <span className="font-medium text-red-600">{adminStats.bannedUsers}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Subscribers</span>
                      <span className="font-medium text-green-600">{adminStats.totalSubscribers}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5" />
                    <span>Quick Actions</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => setActiveTab("users")}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Manage Users
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => setActiveTab("bots")}
                    >
                      <Bot className="h-4 w-4 mr-2" />
                      View Bots
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => setActiveTab("knowledge")}
                    >
                      <Database className="h-4 w-4 mr-2" />
                      Knowledge Bases
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => setActiveTab("settings")}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      System Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">User Management</h2>
                <p className="text-gray-600">Manage platform users and perform admin actions</p>
              </div>
            </div>

            <AdminUserTable />
          </TabsContent>

          <TabsContent value="bots" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Bot Management</h2>
                <p className="text-gray-600">Monitor and manage chatbots across the platform</p>
              </div>
            </div>

            <AdminBotsTable />
          </TabsContent>

          <TabsContent value="knowledge" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Knowledge Base Management</h2>
                <p className="text-gray-600">Monitor knowledge bases and content across the platform</p>
              </div>
            </div>

            <AdminKnowledgeBaseTable />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Platform Analytics</h2>
              <p className="text-gray-600">Comprehensive platform performance metrics</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {adminStats.totalUsers > 0 ? Math.round((adminStats.totalSubscribers / adminStats.totalUsers) * 100) : 0}%
                  </div>
                  <p className="text-xs text-muted-foreground">Users to subscribers</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Bots per User</CardTitle>
                  <Bot className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {adminStats.activeUsers > 0 ? (adminStats.totalBots / adminStats.activeUsers).toFixed(1) : '0'}
                  </div>
                  <p className="text-xs text-muted-foreground">Bots per active user</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg KB per User</CardTitle>
                  <Database className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {adminStats.activeUsers > 0 ? (adminStats.totalKnowledgeBases / adminStats.activeUsers).toFixed(1) : '0'}
                  </div>
                  <p className="text-xs text-muted-foreground">Knowledge bases per user</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Platform Health</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Excellent</div>
                  <p className="text-xs text-muted-foreground">Overall status</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <SystemSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
