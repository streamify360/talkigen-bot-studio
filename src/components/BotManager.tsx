
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bot, Edit3, X, Plus, Globe, Facebook, Send, Trash2, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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
}

interface BotManagerProps {
  onDataChange?: () => void;
}

const BotManager = ({ onDataChange }: BotManagerProps) => {
  const [bots, setBots] = useState<ChatBot[]>([]);
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingBot, setEditingBot] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Form state
  const [botName, setBotName] = useState("");
  const [botDescription, setBotDescription] = useState("");
  const [selectedKnowledgeBase, setSelectedKnowledgeBase] = useState("");
  const [systemMessage, setSystemMessage] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#3B82F6");
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [isActive, setIsActive] = useState(true);

  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadBots();
      loadKnowledgeBases();
    }
  }, [user]);

  const loadBots = async () => {
    try {
      const { data, error } = await supabase
        .from('chatbots')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBots(data || []);
    } catch (error) {
      console.error('Error loading bots:', error);
      toast({
        title: "Error",
        description: "Failed to load chatbots.",
        variant: "destructive",
      });
    }
  };

  const loadKnowledgeBases = async () => {
    try {
      const { data, error } = await supabase
        .from('knowledge_base')
        .select('id, title')
        .eq('user_id', user?.id)
        .eq('file_type', 'knowledge_base')
        .order('title');

      if (error) throw error;
      setKnowledgeBases(data || []);
    } catch (error) {
      console.error('Error loading knowledge bases:', error);
    }
  };

  const resetForm = () => {
    setBotName("");
    setBotDescription("");
    setSelectedKnowledgeBase("");
    setSystemMessage("");
    setPrimaryColor("#3B82F6");
    setWelcomeMessage("");
    setIsActive(true);
    setEditingBot(null);
    setShowCreateForm(false);
  };

  const handleEditBot = (bot: ChatBot) => {
    setEditingBot(bot.id);
    setBotName(bot.name);
    setBotDescription(bot.description);
    setSelectedKnowledgeBase(bot.configuration?.knowledgeBaseId || "");
    setSystemMessage(bot.configuration?.systemMessage || "");
    setPrimaryColor(bot.configuration?.primaryColor || "#3B82F6");
    setWelcomeMessage(bot.configuration?.welcomeMessage || "");
    setIsActive(bot.is_active);
    setShowCreateForm(true);
  };

  const handleDeleteBot = async (botId: string) => {
    if (!confirm("Are you sure you want to delete this bot? This action cannot be undone.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('chatbots')
        .delete()
        .eq('id', botId)
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "Bot deleted",
        description: "The chatbot has been successfully deleted.",
      });

      await loadBots();
      onDataChange?.();
    } catch (error) {
      console.error('Error deleting bot:', error);
      toast({
        title: "Error",
        description: "Failed to delete the bot. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSaveBot = async () => {
    if (!botName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for your bot.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const configuration = {
        knowledgeBaseId: selectedKnowledgeBase,
        systemMessage: systemMessage || "You are a helpful AI assistant.",
        primaryColor,
        welcomeMessage: welcomeMessage || "Hi! How can I help you today?"
      };

      if (editingBot) {
        // Update existing bot
        const { error } = await supabase
          .from('chatbots')
          .update({
            name: botName,
            description: botDescription,
            configuration,
            is_active: isActive,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingBot)
          .eq('user_id', user?.id);

        if (error) throw error;

        toast({
          title: "Bot updated",
          description: "Your chatbot has been successfully updated.",
        });
      } else {
        // Create new bot
        const { error } = await supabase
          .from('chatbots')
          .insert({
            user_id: user?.id,
            name: botName,
            description: botDescription,
            configuration,
            is_active: isActive
          });

        if (error) throw error;

        toast({
          title: "Bot created",
          description: "Your chatbot has been successfully created.",
        });
      }

      resetForm();
      await loadBots();
      onDataChange?.();
    } catch (error) {
      console.error('Error saving bot:', error);
      toast({
        title: "Error",
        description: "Failed to save the bot. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "website": return <Globe className="h-4 w-4" />;
      case "facebook": return <Facebook className="h-4 w-4" />;
      case "telegram": return <Send className="h-4 w-4" />;
      default: return <Bot className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Chatbots</h2>
          <p className="text-gray-600">Manage and deploy your AI chatbots</p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Bot
        </Button>
      </div>

      {/* Bot List */}
      {bots.length > 0 ? (
        <div className="grid gap-6">
          {bots.map((bot) => (
            <Card key={bot.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Bot className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{bot.name}</CardTitle>
                      <CardDescription>{bot.description}</CardDescription>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant={bot.is_active ? "secondary" : "outline"}>
                          {bot.is_active ? "Active" : "Inactive"}
                        </Badge>
                        {bot.configuration?.knowledgeBaseId && (
                          <Badge variant="outline" className="text-xs">
                            KB Connected
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditBot(bot)}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteBot(bot.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Created</p>
                    <p className="font-medium">{formatDate(bot.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Updated</p>
                    <p className="font-medium">{formatDate(bot.updated_at)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Status</p>
                    <p className="font-medium">{bot.is_active ? "Active" : "Inactive"}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Knowledge Base</p>
                    <p className="font-medium">
                      {bot.configuration?.knowledgeBaseId ? "Connected" : "None"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed border-2">
          <CardContent className="pt-6 text-center">
            <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No chatbots yet</h3>
            <p className="text-gray-500 mb-4">Create your first chatbot to get started</p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Chatbot
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Form */}
      {showCreateForm && (
        <Card className="border-blue-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {editingBot ? "Edit Chatbot" : "Create New Chatbot"}
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={resetForm}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="botName">Bot Name</Label>
                <Input
                  id="botName"
                  placeholder="e.g., Customer Support Bot"
                  value={botName}
                  onChange={(e) => setBotName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="knowledgeBase">Knowledge Base</Label>
                <Select value={selectedKnowledgeBase} onValueChange={setSelectedKnowledgeBase}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a knowledge base" />
                  </SelectTrigger>
                  <SelectContent>
                    {knowledgeBases.map((kb) => (
                      <SelectItem key={kb.id} value={kb.id}>
                        {kb.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="botDescription">Description</Label>
              <Textarea
                id="botDescription"
                placeholder="Describe what this bot does..."
                value={botDescription}
                onChange={(e) => setBotDescription(e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="systemMessage">System Message</Label>
              <Textarea
                id="systemMessage"
                placeholder="You are a helpful AI assistant..."
                value={systemMessage}
                onChange={(e) => setSystemMessage(e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="welcomeMessage">Welcome Message</Label>
                <Input
                  id="welcomeMessage"
                  placeholder="Hi! How can I help you today?"
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="primaryColor">Primary Color</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="primaryColor"
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-16 h-10"
                  />
                  <Input
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    placeholder="#3B82F6"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
              <Label htmlFor="isActive">Bot is active</Label>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button 
                onClick={handleSaveBot}
                disabled={isProcessing}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {isProcessing 
                  ? (editingBot ? "Updating..." : "Creating...") 
                  : (editingBot ? "Update Bot" : "Create Bot")
                }
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BotManager;
