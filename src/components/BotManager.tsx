import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bot, Plus, Edit, Trash2, Eye, EyeOff, MessageSquare, Database } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import PlanLimitChecker from "./PlanLimitChecker";

interface ChatBot {
  id: string;
  name: string;
  description: string;
  configuration: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface BotManagerProps {
  onDataChange?: () => void;
}

const BotManager = ({ onDataChange }: BotManagerProps) => {
  const [bots, setBots] = useState<ChatBot[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingBot, setEditingBot] = useState<ChatBot | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    personality: "professional",
    primaryColor: "#3B82F6",
    welcomeMessage: "Hi! How can I help you today?",
    fallbackMessage: "I'm sorry, I don't understand. Could you please rephrase your question?",
    knowledgeBaseId: ""
  });
  const [knowledgeBases, setKnowledgeBases] = useState<Array<{id: string, title: string}>>([]);
  const { toast } = useToast();
  const { user } = useAuth();
  const { planLimits, isInitialized } = useSubscription();

  const personalities = [
    { value: "professional", label: "Professional", description: "Formal and business-like" },
    { value: "friendly", label: "Friendly", description: "Warm and approachable" },
    { value: "casual", label: "Casual", description: "Relaxed and conversational" },
    { value: "technical", label: "Technical", description: "Precise and detailed" }
  ];

  const colorOptions = [
    "#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", 
    "#EF4444", "#6366F1", "#EC4899", "#14B8A6"
  ];

  useEffect(() => {
    if (user && isInitialized) {
      loadBots();
      loadKnowledgeBases();
    }
  }, [user, isInitialized]);

  const loadBots = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('chatbots')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBots(data || []);
      onDataChange?.();
    } catch (error) {
      console.error('Error loading bots:', error);
      toast({
        title: "Error",
        description: "Failed to load chatbots.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadKnowledgeBases = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('knowledge_base')
        .select('id, title')
        .eq('user_id', user.id)
        .eq('file_type', 'knowledge_base')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setKnowledgeBases(data || []);
    } catch (error) {
      console.error('Error loading knowledge bases:', error);
    }
  };

  const createBot = async () => {
    try {
      const botData = {
        user_id: user?.id,
        name: `Bot ${bots.length + 1}`,
        description: 'A new chatbot',
        is_active: true,
        configuration: {}
      };

      const { data, error } = await supabase
        .from('chatbots')
        .insert([botData])
        .select();

      if (error) throw error;

      setBots([data?.[0], ...bots].filter(Boolean));
      onDataChange?.();
      
      toast({
        title: "Bot Created",
        description: `${data?.[0]?.name || 'Bot'} has been created successfully.`,
      });
    } catch (error) {
      console.error('Error creating bot:', error);
      toast({
        title: "Error",
        description: "Failed to create chatbot.",
        variant: "destructive",
      });
    }
  };

  const toggleBotStatus = async (bot: ChatBot) => {
    try {
      const { error } = await supabase
        .from('chatbots')
        .update({ is_active: !bot.is_active })
        .eq('id', bot.id);

      if (error) throw error;

      setBots(bots.map(b => 
        b.id === bot.id ? { ...b, is_active: !b.is_active } : b
      ));
      
      toast({
        title: bot.is_active ? "Bot Deactivated" : "Bot Activated",
        description: `${bot.name} is now ${bot.is_active ? 'inactive' : 'active'}.`,
      });
    } catch (error) {
      console.error('Error toggling bot status:', error);
      toast({
        title: "Error",
        description: "Failed to update bot status.",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (bot: ChatBot) => {
    setEditingBot(bot);
    const config = bot.configuration || {};
    setEditForm({
      name: bot.name,
      description: bot.description || "",
      personality: config.personality || "professional",
      primaryColor: config.primaryColor || "#3B82F6",
      welcomeMessage: config.welcomeMessage || "Hi! How can I help you today?",
      fallbackMessage: config.fallbackMessage || "I'm sorry, I don't understand. Could you please rephrase your question?",
      knowledgeBaseId: config.knowledgeBaseId || ""
    });
  };

  const closeEditDialog = () => {
    setEditingBot(null);
    setEditForm({
      name: "",
      description: "",
      personality: "professional",
      primaryColor: "#3B82F6",
      welcomeMessage: "Hi! How can I help you today?",
      fallbackMessage: "I'm sorry, I don't understand. Could you please rephrase your question?",
      knowledgeBaseId: ""
    });
  };

  const saveBot = async () => {
    if (!editingBot || !user) return;

    try {
      const botData = {
        name: editForm.name,
        description: editForm.description,
        configuration: {
          personality: editForm.personality,
          primaryColor: editForm.primaryColor,
          welcomeMessage: editForm.welcomeMessage,
          fallbackMessage: editForm.fallbackMessage,
          knowledgeBaseId: editForm.knowledgeBaseId
        }
      };

      const { error } = await supabase
        .from('chatbots')
        .update(botData)
        .eq('id', editingBot.id);

      if (error) throw error;

      setBots(bots.map(b => 
        b.id === editingBot.id ? { ...b, ...botData } : b
      ));
      onDataChange?.();
      
      toast({
        title: "Bot Updated",
        description: `${editForm.name} has been updated successfully.`,
      });
      
      closeEditDialog();
    } catch (error) {
      console.error('Error updating bot:', error);
      toast({
        title: "Error",
        description: "Failed to update bot.",
        variant: "destructive",
      });
    }
  };

  const deleteBot = async (bot: ChatBot) => {
    if (!confirm(`Are you sure you want to delete "${bot.name}"?`)) return;

    try {
      const { error } = await supabase
        .from('chatbots')
        .delete()
        .eq('id', bot.id);

      if (error) throw error;

      setBots(bots.filter(b => b.id !== bot.id));
      onDataChange?.();
      
      toast({
        title: "Bot Deleted",
        description: `${bot.name} has been deleted successfully.`,
      });
    } catch (error) {
      console.error('Error deleting bot:', error);
      toast({
        title: "Error",
        description: "Failed to delete bot.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getVisibleBots = () => {
    if (planLimits.maxBots === -1) {
      return bots;
    }
    return bots.slice(0, planLimits.maxBots);
  };

  const visibleBots = getVisibleBots();
  const hasHiddenBots = bots.length > visibleBots.length;

  // Show loading only while actively loading data
  if (loading && bots.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Chatbots</h2>
          <p className="text-gray-600">
            Manage your AI chatbots ({visibleBots.length}/{planLimits.maxBots === -1 ? '∞' : planLimits.maxBots} active)
            {hasHiddenBots && (
              <span className="text-amber-600 ml-2">
                • {bots.length - visibleBots.length} bot{bots.length - visibleBots.length !== 1 ? 's' : ''} hidden due to plan limits
              </span>
            )}
          </p>
        </div>
        
        <PlanLimitChecker currentCount={bots.length} limitType="bots">
          <Button onClick={createBot}>
            <Plus className="h-4 w-4 mr-2" />
            Create Bot
          </Button>
        </PlanLimitChecker>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Bots ({visibleBots.length})</TabsTrigger>
          <TabsTrigger value="active">Active ({visibleBots.filter(bot => bot.is_active).length})</TabsTrigger>
          <TabsTrigger value="inactive">Inactive ({visibleBots.filter(bot => !bot.is_active).length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {visibleBots.length > 0 ? (
            <div className="grid gap-4">
              {visibleBots.map((bot) => (
                <Card key={bot.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Bot className="h-8 w-8 text-blue-600" />
                        <div>
                          <CardTitle className="text-lg">{bot.name}</CardTitle>
                          <CardDescription>{bot.description}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={bot.is_active ? "secondary" : "outline"}>
                          {bot.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleBotStatus(bot)}
                        >
                          {bot.is_active ? (
                            <EyeOff className="h-4 w-4 mr-1" />
                          ) : (
                            <Eye className="h-4 w-4 mr-1" />
                          )}
                          {bot.is_active ? "Deactivate" : "Activate"}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Created: {formatDate(bot.created_at)}</span>
                        <span>Updated: {formatDate(bot.updated_at)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(bot)}>
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteBot(bot)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Bot className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No chatbots yet</h3>
                <p className="text-gray-600 mb-4">Create your first chatbot to get started</p>
                <PlanLimitChecker currentCount={bots.length} limitType="bots">
                  <Button onClick={createBot}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Bot
                  </Button>
                </PlanLimitChecker>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          {visibleBots.filter(bot => bot.is_active).length > 0 ? (
            <div className="grid gap-4">
              {visibleBots.filter(bot => bot.is_active).map((bot) => (
                <Card key={bot.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Bot className="h-8 w-8 text-blue-600" />
                        <div>
                          <CardTitle className="text-lg">{bot.name}  </CardTitle>
                          <CardDescription>{bot.description}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">Active</Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleBotStatus(bot)}
                        >
                          <EyeOff className="h-4 w-4 mr-1" />
                          Deactivate
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Created: {formatDate(bot.created_at)}</span>
                        <span>Updated: {formatDate(bot.updated_at)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(bot)}>
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteBot(bot)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Eye className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No active chatbots</h3>
                <p className="text-gray-600">Activate some bots to see them here</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="inactive" className="space-y-4">
          {visibleBots.filter(bot => !bot.is_active).length > 0 ? (
            <div className="grid gap-4">
              {visibleBots.filter(bot => !bot.is_active).map((bot) => (
                <Card key={bot.id} className="hover:shadow-md transition-shadow opacity-75">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Bot className="h-8 w-8 text-gray-400" />
                        <div>
                          <CardTitle className="text-lg">{bot.name}</CardTitle>
                          <CardDescription>{bot.description}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">Inactive</Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleBotStatus(bot)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Activate
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Created: {formatDate(bot.created_at)}</span>
                        <span>Updated: {formatDate(bot.updated_at)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(bot)}>
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteBot(bot)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <EyeOff className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No inactive chatbots</h3>
                <p className="text-gray-600">All your bots are currently active</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Bot Dialog */}
      <Dialog open={!!editingBot} onOpenChange={closeEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Bot: {editingBot?.name}</DialogTitle>
          </DialogHeader>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="botName">Bot Name</Label>
                <Input
                  id="botName"
                  placeholder="e.g., Support Assistant"
                  value={editForm.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="knowledgeBase">Knowledge Base</Label>
                <Select 
                  value={editForm.knowledgeBaseId} 
                  onValueChange={(value) => setEditForm({...editForm, knowledgeBaseId: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a knowledge base" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {knowledgeBases.map((kb) => (
                      <SelectItem key={kb.id} value={kb.id}>
                        <div className="flex items-center space-x-2">
                          <Database className="h-4 w-4" />
                          <span>{kb.title}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="botDescription">System Message</Label>
                <Textarea
                  id="botDescription"
                  placeholder="Describe your bot's role and behavior..."
                  value={editForm.description}
                  onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Personality</Label>
                <Select value={editForm.personality} onValueChange={(value) => setEditForm({...editForm, personality: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {personalities.map((personality) => (
                      <SelectItem key={personality.value} value={personality.value}>
                        <div>
                          <div className="font-medium">{personality.label}</div>
                          <div className="text-sm text-gray-500">{personality.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Primary Color</Label>
                <div className="flex items-center space-x-2">
                  <div className="grid grid-cols-4 gap-2">
                    {colorOptions.map((color) => (
                      <button
                        key={color}
                        onClick={() => setEditForm({...editForm, primaryColor: color})}
                        className={`w-8 h-8 rounded-full border-2 ${
                          editForm.primaryColor === color ? 'border-gray-800' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <Input
                    type="color"
                    value={editForm.primaryColor}
                    onChange={(e) => setEditForm({...editForm, primaryColor: e.target.value})}
                    className="w-16 h-8 p-1 rounded"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="welcomeMessage">Welcome Message</Label>
                <Textarea
                  id="welcomeMessage"
                  placeholder="What should your bot say when users start a conversation?"
                  value={editForm.welcomeMessage}
                  onChange={(e) => setEditForm({...editForm, welcomeMessage: e.target.value})}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fallbackMessage">Fallback Message</Label>
                <Textarea
                  id="fallbackMessage"
                  placeholder="What should your bot say when it doesn't understand?"
                  value={editForm.fallbackMessage}
                  onChange={(e) => setEditForm({...editForm, fallbackMessage: e.target.value})}
                  rows={2}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-3 flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5" />
                  <span>Preview</span>
                </h4>
                <Card className="bg-gray-50">
                  <CardContent className="p-4">
                    <div className="bg-white rounded-lg shadow-sm p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: editForm.primaryColor }}
                          >
                            <Bot className="h-5 w-5 text-white" />
                          </div>
                          <span className="font-medium">{editForm.name || "Your Bot"}</span>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {personalities.find(p => p.value === editForm.personality)?.label}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex">
                          <div 
                            className="max-w-xs px-3 py-2 rounded-lg text-sm text-white"
                            style={{ backgroundColor: editForm.primaryColor }}
                          >
                            {editForm.welcomeMessage}
                          </div>
                        </div>
                        
                        <div className="flex justify-end">
                          <div className="max-w-xs px-3 py-2 rounded-lg bg-gray-200 text-sm">
                            Hello! I have a question.
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 mt-6">
            <Button variant="outline" onClick={closeEditDialog}>
              Cancel
            </Button>
            <Button onClick={saveBot}>
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BotManager;
