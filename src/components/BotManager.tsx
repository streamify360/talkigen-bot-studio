import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bot, Edit3, X, Plus, Globe, Facebook, Send, Trash2, Settings, Copy, Save, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import PlanLimitChecker from "@/components/PlanLimitChecker";

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

interface TelegramBot {
  id: string;
  bot_token: string;
  bot_name: string | null;
  chatbot_id: string | null;
  created_at: string;
  updated_at: string;
}

interface FacebookBot {
  id: string;
  page_access_token: string;
  page_name: string | null;
  chatbot_id: string | null;
  created_at: string;
  updated_at: string;
}

interface BotManagerProps {
  onDataChange?: () => void;
}

const BotManager = ({ onDataChange }: BotManagerProps) => {
  const [bots, setBots] = useState<ChatBot[]>([]);
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [telegramBots, setTelegramBots] = useState<TelegramBot[]>([]);
  const [facebookBots, setFacebookBots] = useState<FacebookBot[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingBot, setEditingBot] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  
  // Form state
  const [botName, setBotName] = useState("");
  const [botDescription, setBotDescription] = useState("");
  const [selectedKnowledgeBase, setSelectedKnowledgeBase] = useState("");
  const [systemMessage, setSystemMessage] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#3B82F6");
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [fallbackMessage, setFallbackMessage] = useState("");
  const [personality, setPersonality] = useState("professional");
  const [isActive, setIsActive] = useState(true);

  // Integration form state
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [telegramBotToken, setTelegramBotToken] = useState("");
  const [telegramBotName, setTelegramBotName] = useState("");
  const [facebookPageToken, setFacebookPageToken] = useState("");
  const [facebookPageName, setFacebookPageName] = useState("");

  const { toast } = useToast();
  const { user, canCreateBot } = useAuth();

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
    if (user) {
      loadBots();
      loadKnowledgeBases();
      loadTelegramBots();
      loadFacebookBots();
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

  const loadTelegramBots = async () => {
    try {
      const { data, error } = await supabase
        .from('telegram_bots')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTelegramBots(data || []);
    } catch (error) {
      console.error('Error loading Telegram bots:', error);
    }
  };

  const loadFacebookBots = async () => {
    try {
      const { data, error } = await supabase
        .from('facebook_bots')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFacebookBots(data || []);
    } catch (error) {
      console.error('Error loading Facebook bots:', error);
    }
  };

  const resetForm = () => {
    setBotName("");
    setBotDescription("");
    setSelectedKnowledgeBase("");
    setSystemMessage("");
    setPrimaryColor("#3B82F6");
    setWelcomeMessage("");
    setFallbackMessage("");
    setPersonality("professional");
    setIsActive(true);
    setWebsiteUrl("");
    setTelegramBotToken("");
    setTelegramBotName("");
    setFacebookPageToken("");
    setFacebookPageName("");
    setEditingBot(null);
    setShowCreateForm(false);
    setActiveTab("basic");
  };

  const handleEditBot = (bot: ChatBot) => {
    setEditingBot(bot.id);
    setBotName(bot.name);
    setBotDescription(bot.description);
    setSelectedKnowledgeBase(bot.configuration?.knowledgeBaseId || "");
    setSystemMessage(bot.configuration?.systemMessage || bot.description || "");
    setPrimaryColor(bot.configuration?.primaryColor || "#3B82F6");
    setWelcomeMessage(bot.configuration?.welcomeMessage || "Hi! How can I help you today?");
    setFallbackMessage(bot.configuration?.fallbackMessage || "I'm sorry, I don't understand. Could you please rephrase your question?");
    setPersonality(bot.configuration?.personality || "professional");
    setIsActive(bot.is_active);
    setWebsiteUrl(bot.configuration?.websiteUrl || "");
    
    // Load existing integrations for this bot
    const telegramBot = telegramBots.find(tb => tb.chatbot_id === bot.id);
    if (telegramBot) {
      setTelegramBotToken(telegramBot.bot_token);
      setTelegramBotName(telegramBot.bot_name || "");
    }
    
    const facebookBot = facebookBots.find(fb => fb.chatbot_id === bot.id);
    if (facebookBot) {
      setFacebookPageToken(facebookBot.page_access_token);
      setFacebookPageName(facebookBot.page_name || "");
    }
    
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
      await loadTelegramBots();
      await loadFacebookBots();
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

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to create a chatbot.",
        variant: "destructive",
      });
      return;
    }

    // Check plan limits for new bots
    if (!editingBot && !canCreateBot(bots.length)) {
      toast({
        title: "Plan limit reached",
        description: "You've reached the maximum number of chatbots for your current plan. Please upgrade to create more bots.",
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
        welcomeMessage: welcomeMessage || "Hi! How can I help you today?",
        fallbackMessage: fallbackMessage || "I'm sorry, I don't understand. Could you please rephrase your question?",
        personality,
        websiteUrl
      };

      let botId = editingBot;

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
      } else {
        // Create new bot
        const { data, error } = await supabase
          .from('chatbots')
          .insert({
            user_id: user?.id,
            name: botName,
            description: botDescription,
            configuration,
            is_active: isActive
          })
          .select()
          .single();

        if (error) throw error;
        botId = data.id;
      }

      // Handle Telegram integration
      if (telegramBotToken.trim()) {
        const existingTelegramBot = telegramBots.find(tb => tb.chatbot_id === botId);
        
        if (existingTelegramBot) {
          // Update existing Telegram bot
          await supabase
            .from('telegram_bots')
            .update({
              bot_token: telegramBotToken.trim(),
              bot_name: telegramBotName.trim() || null,
              chatbot_id: botId,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingTelegramBot.id);
        } else {
          // Create new Telegram bot
          await supabase
            .from('telegram_bots')
            .insert({
              user_id: user?.id,
              bot_token: telegramBotToken.trim(),
              bot_name: telegramBotName.trim() || null,
              chatbot_id: botId
            });
        }

        // Send to webhook
        try {
          await fetch('https://services.talkigen.com/webhook/4caab28c-c63c-4286-9716-3b0a74f5c680', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `token=${encodeURIComponent(telegramBotToken.trim())}&knowledgebase_id=${encodeURIComponent(selectedKnowledgeBase)}`
          });
        } catch (webhookError) {
          console.error('Webhook error:', webhookError);
        }
      }

      // Handle Facebook integration
      if (facebookPageToken.trim()) {
        const existingFacebookBot = facebookBots.find(fb => fb.chatbot_id === botId);
        
        if (existingFacebookBot) {
          // Update existing Facebook bot
          await supabase
            .from('facebook_bots')
            .update({
              page_access_token: facebookPageToken.trim(),
              page_name: facebookPageName.trim() || null,
              chatbot_id: botId,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingFacebookBot.id);
        } else {
          // Create new Facebook bot
          await supabase
            .from('facebook_bots')
            .insert({
              user_id: user?.id,
              page_access_token: facebookPageToken.trim(),
              page_name: facebookPageName.trim() || null,
              chatbot_id: botId
            });
        }
      }

      toast({
        title: editingBot ? "Bot updated" : "Bot created",
        description: `Your chatbot has been successfully ${editingBot ? "updated" : "created"}.`,
      });

      resetForm();
      await loadBots();
      await loadTelegramBots();
      await loadFacebookBots();
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "The code has been copied to your clipboard.",
    });
  };

  const generateWidgetCode = (bot: ChatBot) => {
    const widgetId = `widget_${bot.id}`;
    return `<!-- Talkigen Chat Widget -->
<script>
  (function() {
    const script = document.createElement('script');
    script.src = 'https://rjvpzflhgwduveemjibw.supabase.co/functions/v1/widget';
    script.async = true;
    script.onload = function() {
      TalkigenWidget.init({
        widgetId: '${widgetId}',
        botName: '${bot.name}',
        welcomeMessage: '${bot.configuration?.welcomeMessage || "Hi! How can I help you today?"}',
        primaryColor: '${bot.configuration?.primaryColor || "#3B82F6"}',
        knowledgeBaseId: '${bot.configuration?.knowledgeBaseId || ""}',
        systemMessage: '${bot.configuration?.systemMessage || bot.description || "You are a helpful assistant."}'
      });
    };
    document.head.appendChild(script);
  })();
</script>`;
  };

  const generateFacebookWebhookUrl = (bot: ChatBot) => {
    return `https://services.talkigen.com/webhook/71130fd5-9f5b-4b51-8797-7eec99b98338?knowledgebase_id=${bot.configuration?.knowledgeBaseId || ""}&chatbot_id=${bot.id}`;
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

  const getBotIntegrations = (bot: ChatBot) => {
    const integrations = [];
    
    if (bot.configuration?.websiteUrl) {
      integrations.push("Website");
    }
    
    if (telegramBots.some(tb => tb.chatbot_id === bot.id)) {
      integrations.push("Telegram");
    }
    
    if (facebookBots.some(fb => fb.chatbot_id === bot.id)) {
      integrations.push("Facebook");
    }
    
    return integrations;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Chatbots</h2>
          <p className="text-gray-600">Manage and deploy your AI chatbots</p>
        </div>
        {canCreateBot(bots.length) && (
          <Button
            onClick={() => setShowCreateForm(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Bot
          </Button>
        )}
      </div>

      {/* Plan Limit Check */}
      <PlanLimitChecker currentCount={bots.length} limitType="bots">
        {/* Bot List */}
        {bots.length > 0 ? (
          <div className="grid gap-6">
            {bots.map((bot) => {
              const integrations = getBotIntegrations(bot);
              return (
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
                            {integrations.length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {integrations.length} Integration{integrations.length !== 1 ? 's' : ''}
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
                        <p className="text-gray-500">Integrations</p>
                        <div className="flex items-center space-x-1">
                          {integrations.length > 0 ? (
                            integrations.map((integration, index) => (
                              <span key={index} className="text-xs bg-gray-100 px-2 py-1 rounded">
                                {integration}
                              </span>
                            ))
                          ) : (
                            <span className="font-medium text-gray-400">None</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Quick Integration Info */}
                    {integrations.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="grid md:grid-cols-3 gap-4 text-sm">
                          {bot.configuration?.websiteUrl && (
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <Globe className="h-4 w-4 text-blue-600" />
                                <span className="font-medium">Website</span>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(generateWidgetCode(bot))}
                                className="text-xs"
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                Copy Code
                              </Button>
                            </div>
                          )}
                          
                          {telegramBots.some(tb => tb.chatbot_id === bot.id) && (
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <Send className="h-4 w-4 text-blue-600" />
                                <span className="font-medium">Telegram</span>
                              </div>
                              <p className="text-xs text-gray-500">
                                {telegramBots.find(tb => tb.chatbot_id === bot.id)?.bot_name || "Connected"}
                              </p>
                            </div>
                          )}
                          
                          {facebookBots.some(fb => fb.chatbot_id === bot.id) && (
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <Facebook className="h-4 w-4 text-blue-600" />
                                <span className="font-medium">Facebook</span>
                              </div>
                              <p className="text-xs text-gray-500">
                                {facebookBots.find(fb => fb.chatbot_id === bot.id)?.page_name || "Connected"}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="border-dashed border-2">
            <CardContent className="pt-6 text-center">
              <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No chatbots yet</h3>
              <p className="text-gray-500 mb-4">Create your first chatbot to get started</p>
              {canCreateBot(0) && (
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Chatbot
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </PlanLimitChecker>

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
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic">Basic Settings</TabsTrigger>
                <TabsTrigger value="integrations">Integrations</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
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
                  <Label htmlFor="systemMessage">System Message</Label>
                  <Textarea
                    id="systemMessage"
                    placeholder="You are a helpful AI assistant for Company XYZ. You help customers with product inquiries, provide technical support, and guide them through our services. Always be helpful, professional, and accurate in your responses."
                    value={systemMessage}
                    onChange={(e) => setSystemMessage(e.target.value)}
                    rows={4}
                  />
                  <p className="text-xs text-gray-500">
                    This message defines your bot's role and behavior. It will be used as the system prompt.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Personality</Label>
                  <Select value={personality} onValueChange={setPersonality}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {personalities.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          <div>
                            <div className="font-medium">{p.label}</div>
                            <div className="text-sm text-gray-500">{p.description}</div>
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
                          onClick={() => setPrimaryColor(color)}
                          className={`w-8 h-8 rounded-full border-2 ${
                            primaryColor === color ? 'border-gray-800' : 'border-gray-300'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <Input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-16 h-8 p-1 rounded"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="welcomeMessage">Welcome Message</Label>
                    <Textarea
                      id="welcomeMessage"
                      placeholder="Hi! How can I help you today?"
                      value={welcomeMessage}
                      onChange={(e) => setWelcomeMessage(e.target.value)}
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fallbackMessage">Fallback Message</Label>
                    <Textarea
                      id="fallbackMessage"
                      placeholder="I'm sorry, I don't understand. Could you please rephrase your question?"
                      value={fallbackMessage}
                      onChange={(e) => setFallbackMessage(e.target.value)}
                      rows={2}
                    />
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
              </TabsContent>

              <TabsContent value="integrations" className="space-y-6">
                {/* Website Integration */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center space-x-2">
                      <Globe className="h-5 w-5 text-blue-600" />
                      <CardTitle className="text-lg">Website Integration</CardTitle>
                    </div>
                    <CardDescription>
                      Add a chat widget to your website
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="websiteUrl">Website URL (Optional)</Label>
                      <Input
                        id="websiteUrl"
                        placeholder="https://yourwebsite.com"
                        value={websiteUrl}
                        onChange={(e) => setWebsiteUrl(e.target.value)}
                      />
                    </div>
                    
                    {editingBot && (
                      <div className="space-y-2">
                        <Label>Widget Embed Code</Label>
                        <div className="relative">
                          <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-xs overflow-x-auto max-h-32">
                            {generateWidgetCode({ id: editingBot, name: botName, configuration: { knowledgeBaseId: selectedKnowledgeBase, systemMessage, primaryColor, welcomeMessage } } as ChatBot)}
                          </pre>
                          <Button
                            variant="outline"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={() => copyToClipboard(generateWidgetCode({ id: editingBot, name: botName, configuration: { knowledgeBaseId: selectedKnowledgeBase, systemMessage, primaryColor, welcomeMessage } } as ChatBot))}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Telegram Integration */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center space-x-2">
                      <Send className="h-5 w-5 text-blue-600" />
                      <CardTitle className="text-lg">Telegram Integration</CardTitle>
                    </div>
                    <CardDescription>
                      Connect your Telegram bot
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 mb-2">Setup Instructions</h4>
                      <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                        <li>Message @BotFather on Telegram</li>
                        <li>Send /newbot command</li>
                        <li>Choose a name and username for your bot</li>
                        <li>Copy the bot token provided by BotFather</li>
                      </ol>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="telegramBotName">Bot Name (Optional)</Label>
                        <Input
                          id="telegramBotName"
                          placeholder="Enter a name for your bot"
                          value={telegramBotName}
                          onChange={(e) => setTelegramBotName(e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="telegramBotToken">Bot Token</Label>
                        <Input
                          id="telegramBotToken"
                          placeholder="Enter your Telegram Bot Token"
                          value={telegramBotToken}
                          onChange={(e) => setTelegramBotToken(e.target.value)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Facebook Integration */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center space-x-2">
                      <Facebook className="h-5 w-5 text-blue-600" />
                      <CardTitle className="text-lg">Facebook Messenger Integration</CardTitle>
                    </div>
                    <CardDescription>
                      Connect your Facebook page
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 mb-2">Setup Instructions</h4>
                      <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                        <li>Create a Facebook App in the Meta Developer Console</li>
                        <li>Add Messenger product to your app</li>
                        <li>Generate a Page Access Token for your Facebook page</li>
                        <li>Use the webhook URL and verify token provided below</li>
                      </ol>
                    </div>

                    {editingBot && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Webhook URL</Label>
                          <div className="relative">
                            <Input
                              value={generateFacebookWebhookUrl({ id: editingBot, configuration: { knowledgeBaseId: selectedKnowledgeBase } } as ChatBot)}
                              readOnly
                              className="bg-gray-50 font-mono text-xs"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              className="absolute top-1 right-1"
                              onClick={() => copyToClipboard(generateFacebookWebhookUrl({ id: editingBot, configuration: { knowledgeBaseId: selectedKnowledgeBase } } as ChatBot))}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Verify Token</Label>
                          <div className="relative">
                            <Input
                              value="gT4xL9vPzQm2Wd8KsBy7NeAhUcRf"
                              readOnly
                              className="bg-gray-50 font-mono"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              className="absolute top-1 right-1"
                              onClick={() => copyToClipboard("gT4xL9vPzQm2Wd8KsBy7NeAhUcRf")}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="facebookPageName">Page Name (Optional)</Label>
                        <Input
                          id="facebookPageName"
                          placeholder="Enter your Facebook page name"
                          value={facebookPageName}
                          onChange={(e) => setFacebookPageName(e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="facebookPageToken">Page Access Token</Label>
                        <Input
                          id="facebookPageToken"
                          placeholder="Enter your Facebook Page Access Token"
                          value={facebookPageToken}
                          onChange={(e) => setFacebookPageToken(e.target.value)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end space-x-2 pt-6 border-t">
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