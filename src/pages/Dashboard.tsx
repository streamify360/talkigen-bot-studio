import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Bot, Database, MessageSquare, Settings, Plus, TrendingUp, 
  Users, Clock, Globe, Facebook, Send, MoreVertical, 
  BarChart3, PieChart, Activity, CreditCard, User, LogOut,
  Edit, Trash2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import KnowledgeBaseManager from "@/components/KnowledgeBaseManager";
import BotManager from "@/components/BotManager";
import BillingManager from "@/components/BillingManager";
import AccountSettings from "@/components/AccountSettings";
import DashboardFooter from "@/components/DashboardFooter";

interface ChatBot {
  id: string;
  name: string;
  description: string;
  configuration: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface KnowledgeBase {
  id: string;
  title: string;
  content: string;
  file_type: string;
  created_at: string;
  updated_at: string;
  fileCount?: number;
  totalSize?: number;
}

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [bots, setBots] = useState<ChatBot[]>([]);
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signOut, user, checkSubscription, subscription } = useAuth();

  useEffect(() => {
    if (user) {
      // Check subscription status immediately when dashboard loads
      checkSubscription().then(() => {
        loadDashboardData();
      }).catch(error => {
        console.error("Error checking subscription on dashboard load:", error);
        loadDashboardData();
      });
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load chatbots
      const { data: botsData, error: botsError } = await supabase
        .from('chatbots')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (botsError) throw botsError;

      // Load knowledge bases (main records)
      const { data: kbData, error: kbError } = await supabase
        .from('knowledge_base')
        .select('*')
        .eq('user_id', user?.id)
        .eq('file_type', 'knowledge_base')
        .order('created_at', { ascending: false });

      if (kbError) throw kbError;

      // For each KB, count files and calculate total size
      const kbWithStats = await Promise.all(
        (kbData || []).map(async (kb) => {
          const { data: files } = await supabase
            .from('knowledge_base')
            .select('file_size')
            .eq('user_id', user?.id)
            .neq('file_type', 'knowledge_base')
            .like('content', `%/${kb.id}/%`);

          const fileCount = files?.length || 0;
          const totalSize = files?.reduce((sum, file) => sum + (file.file_size || 0), 0) || 0;

          return {
            ...kb,
            fileCount,
            totalSize
          };
        })
      );

      setBots(botsData || []);
      setKnowledgeBases(kbWithStats);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data.",
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
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
      navigate("/");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "website": return <Globe className="h-4 w-4" />;
      case "facebook": return <Facebook className="h-4 w-4" />;
      case "telegram": return <Send className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const stats = {
    totalBots: bots.length,
    totalKnowledgeBases: knowledgeBases.length,
    activeBots: bots.filter(bot => bot.is_active).length,
    totalFiles: knowledgeBases.reduce((sum, kb) => sum + (kb.fileCount || 0), 0)
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-2">
              <Bot className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Talkigen
              </span>
            </Link>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              {subscription?.subscription_tier || "Free"} Plan
            </Badge>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={() => setActiveTab("billing")}>
              <CreditCard className="h-4 w-4 mr-2" />
              Billing
            </Button>
            <Button variant="outline" size="sm" onClick={() => setActiveTab("settings")}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Manage your chatbots and knowledge bases</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="bots">Bots</TabsTrigger>
            <TabsTrigger value="knowledge">Knowledge</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Bots</CardTitle>
                  <Bot className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalBots}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.activeBots} active
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Knowledge Bases</CardTitle>
                  <Database className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalKnowledgeBases}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.totalFiles} files total
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatFileSize(knowledgeBases.reduce((sum, kb) => sum + (kb.totalSize || 0), 0))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Across all knowledge bases
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {bots.length > 0 || knowledgeBases.length > 0 
                      ? formatDate(Math.max(
                          ...bots.map(b => new Date(b.updated_at).getTime()),
                          ...knowledgeBases.map(kb => new Date(kb.updated_at).getTime())
                        ).toString())
                      : 'Never'
                    }
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Latest activity
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Stats */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Bot className="h-5 w-5" />
                    <span>Recent Bots</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {bots.slice(0, 3).map((bot) => (
                      <div key={bot.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{bot.name}</p>
                          <p className="text-sm text-gray-500">{bot.description}</p>
                        </div>
                        <Badge variant={bot.is_active ? "secondary" : "outline"}>
                          {bot.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    ))}
                    {bots.length === 0 && (
                      <p className="text-sm text-gray-500">No bots created yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Database className="h-5 w-5" />
                    <span>Recent Knowledge Bases</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {knowledgeBases.slice(0, 3).map((kb) => (
                      <div key={kb.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{kb.title}</p>
                          <p className="text-sm text-gray-500">
                            {kb.fileCount} files • {formatFileSize(kb.totalSize || 0)}
                          </p>
                        </div>
                        <p className="text-xs text-gray-400">{formatDate(kb.updated_at)}</p>
                      </div>
                    ))}
                    {knowledgeBases.length === 0 && (
                      <p className="text-sm text-gray-500">No knowledge bases created yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="bots" className="space-y-6">
            <BotManager onDataChange={loadDashboardData} />
          </TabsContent>

          <TabsContent value="knowledge" className="space-y-6">
            <KnowledgeBaseManager />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Analytics</h2>
              <p className="text-gray-600">Track your chatbot performance and user engagement</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Bots</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalBots}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.activeBots} currently active
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Knowledge Bases</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalKnowledgeBases}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.totalFiles} total files
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Storage Usage</CardTitle>
                  <PieChart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatFileSize(knowledgeBases.reduce((sum, kb) => sum + (kb.totalSize || 0), 0))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Across all files
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Performance Overview</CardTitle>
                <CardDescription>
                  Your dashboard shows {stats.totalBots} bots and {stats.totalKnowledgeBases} knowledge bases
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>Detailed analytics charts coming soon</p>
                    <p className="text-sm mt-2">Start creating more bots to see insights</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="space-y-6">
            <BillingManager />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <AccountSettings />
          </TabsContent>
        </Tabs>
      </div>

      <DashboardFooter />
    </div>
  );
};

export default Dashboard;