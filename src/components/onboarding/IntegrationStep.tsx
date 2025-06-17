import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Globe, Facebook, Send, Copy, CheckCircle, ExternalLink, Code, Eye, Edit, Save, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import ChatWidget from "../widget/ChatWidget";

interface IntegrationStepProps {
  onComplete: () => void;
  onSkip: () => void;
}

interface BotConfig {
  knowledgeBaseId: string;
  systemMessage: string;
  welcomeMessage: string;
  primaryColor: string;
  name: string;
}

interface TelegramBot {
  id: string;
  bot_token: string;
  bot_name: string | null;
  created_at: string;
  updated_at: string;
}

// Type guard to check if config is an object with expected properties
const isValidBotConfiguration = (config: any): config is { knowledgeBaseId?: string; welcomeMessage?: string; primaryColor?: string } => {
  return config && typeof config === 'object' && !Array.isArray(config);
};

const IntegrationStep = ({ onComplete, onSkip }: IntegrationStepProps) => {
  const [activeIntegrations, setActiveIntegrations] = useState<string[]>([]);
  const [credentials, setCredentials] = useState({
    facebookPageToken: "",
    facebookVerifyToken: "",
    telegramBotToken: "",
    websiteUrl: ""
  });
  const [botConfig, setBotConfig] = useState<BotConfig>({
    knowledgeBaseId: "",
    systemMessage: "You are a helpful assistant that provides support for our website visitors.",
    welcomeMessage: "Hi! How can I help you today?",
    primaryColor: "#3B82F6",
    name: "Chat Assistant"
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isLoadingBotConfig, setIsLoadingBotConfig] = useState(true);
  const [widgetId, setWidgetId] = useState<string>('');
  const [telegramBots, setTelegramBots] = useState<TelegramBot[]>([]);
  const [isLoadingTelegramBots, setIsLoadingTelegramBots] = useState(false);
  const [isSavingTelegramBot, setIsSavingTelegramBot] = useState(false);
  const [editingTelegramBot, setEditingTelegramBot] = useState<string | null>(null);
  const [telegramBotName, setTelegramBotName] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();

  const integrations = [
    {
      id: "website",
      name: "Website",
      icon: Globe,
      description: "Add a chat widget to your website",
      difficulty: "Easy",
      color: "bg-blue-500"
    },
    {
      id: "facebook",
      name: "Facebook Messenger",
      icon: Facebook,
      description: "Connect to your Facebook page",
      difficulty: "Medium",
      color: "bg-blue-600"
    },
    {
      id: "telegram",
      name: "Telegram",
      icon: Send,
      description: "Create a Telegram bot",
      difficulty: "Medium",
      color: "bg-blue-400"
    }
  ];

  // Load bot configuration from Step 3
  useEffect(() => {
    loadBotConfiguration();
  }, [user]);

  // Load Telegram bots when user changes
  useEffect(() => {
    if (user) {
      loadTelegramBots();
    }
  }, [user]);

  const loadBotConfiguration = async () => {
    if (!user) {
      setIsLoadingBotConfig(false);
      return;
    }

    try {
      console.log('IntegrationStep: Loading bot configuration for user:', user.id);
      
      const { data: botData, error } = await supabase
        .from('chatbots')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('IntegrationStep: Error loading bot config:', error);
        throw error;
      }

      if (botData) {
        console.log('IntegrationStep: Found bot configuration:', botData);
        
        // Safely handle the configuration object
        const config = isValidBotConfiguration(botData.configuration) ? botData.configuration : {};
        
        setBotConfig({
          knowledgeBaseId: config.knowledgeBaseId || "",
          systemMessage: botData.description || "You are a helpful assistant that provides support for our website visitors.",
          welcomeMessage: config.welcomeMessage || "Hi! How can I help you today?",
          primaryColor: config.primaryColor || "#3B82F6",
          name: botData.name || "Chat Assistant"
        });
        
        // Generate a unique widget ID for this bot
        setWidgetId(`widget_${botData.id}`);
      } else {
        console.log('IntegrationStep: No bot configuration found, using defaults');
        // Generate a fallback widget ID
        setWidgetId(`widget_${user.id.slice(0, 8)}`);
      }
    } catch (error) {
      console.error('IntegrationStep: Error loading bot configuration:', error);
      toast({
        title: "Error loading bot configuration",
        description: "Using default settings. You can modify them in the bot setup step.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingBotConfig(false);
    }
  };

  const loadTelegramBots = async () => {
    if (!user) return;

    setIsLoadingTelegramBots(true);
    try {
      const { data, error } = await supabase
        .from('telegram_bots')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTelegramBots(data || []);
    } catch (error) {
      console.error('Error loading Telegram bots:', error);
      toast({
        title: "Error loading Telegram bots",
        description: "Failed to load your saved Telegram bots.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingTelegramBots(false);
    }
  };

  const saveTelegramBot = async () => {
    if (!user || !credentials.telegramBotToken.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid Telegram bot token.",
        variant: "destructive",
      });
      return;
    }

    setIsSavingTelegramBot(true);
    try {
      // Save to database
      const botData = {
        user_id: user.id,
        bot_token: credentials.telegramBotToken.trim(),
        bot_name: telegramBotName.trim() || null,
        updated_at: new Date().toISOString()
      };

      let result;
      if (editingTelegramBot) {
        // Update existing bot
        result = await supabase
          .from('telegram_bots')
          .update(botData)
          .eq('id', editingTelegramBot)
          .eq('user_id', user.id);
      } else {
        // Create new bot
        result = await supabase
          .from('telegram_bots')
          .insert(botData);
      }

      if (result.error) throw result.error;

      // Send token to webhook
      const webhookResponse = await fetch('https://services.talkigen.com/webhook/4caab28c-c63c-4286-9716-3b0a74f5c680', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `token=${encodeURIComponent(credentials.telegramBotToken.trim())}`
      });

      if (!webhookResponse.ok) {
        console.error('Webhook response not ok:', webhookResponse.status);
        // Don't throw error here, as the database save was successful
      }

      toast({
        title: "Success",
        description: editingTelegramBot ? "Telegram bot updated successfully!" : "Telegram bot saved successfully!",
      });

      // Reset form
      setCredentials(prev => ({ ...prev, telegramBotToken: "" }));
      setTelegramBotName("");
      setEditingTelegramBot(null);
      
      // Reload bots
      await loadTelegramBots();
    } catch (error) {
      console.error('Error saving Telegram bot:', error);
      toast({
        title: "Error",
        description: "Failed to save Telegram bot. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingTelegramBot(false);
    }
  };

  const editTelegramBot = (bot: TelegramBot) => {
    setCredentials(prev => ({ ...prev, telegramBotToken: bot.bot_token }));
    setTelegramBotName(bot.bot_name || "");
    setEditingTelegramBot(bot.id);
  };

  const deleteTelegramBot = async (botId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('telegram_bots')
        .delete()
        .eq('id', botId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Telegram bot deleted successfully!",
      });

      await loadTelegramBots();
    } catch (error) {
      console.error('Error deleting Telegram bot:', error);
      toast({
        title: "Error",
        description: "Failed to delete Telegram bot. Please try again.",
        variant: "destructive",
      });
    }
  };

  const cancelEdit = () => {
    setCredentials(prev => ({ ...prev, telegramBotToken: "" }));
    setTelegramBotName("");
    setEditingTelegramBot(null);
  };

  const handleIntegrationToggle = (integrationId: string) => {
    setActiveIntegrations(prev => 
      prev.includes(integrationId)
        ? prev.filter(id => id !== integrationId)
        : [...prev, integrationId]
    );
  };

  const handleCredentialChange = (field: string, value: string) => {
    setCredentials(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "The code has been copied to your clipboard.",
    });
  };

  const generateWidgetCode = () => {
    if (!widgetId) {
      return '<!-- Please complete bot setup first -->';
    }

    return `<!-- Talkigen Chat Widget -->
<script>
  (function() {
    const script = document.createElement('script');
    script.src = 'https://rjvpzflhgwduveemjibw.supabase.co/functions/v1/widget';
    script.async = true;
    script.onload = function() {
      TalkigenWidget.init({
        widgetId: '${widgetId}',
        botName: '${botConfig.name}',
        welcomeMessage: '${botConfig.welcomeMessage}',
        primaryColor: '${botConfig.primaryColor}'
      });
    };
    document.head.appendChild(script);
  })();
</script>`;
  };

  const handleSaveIntegrations = async () => {
    setIsSaving(true);

    // Simulate saving integrations
    setTimeout(() => {
      setIsSaving(false);
      toast({
        title: "Integrations configured!",
        description: `Successfully set up ${activeIntegrations.length} platform(s).`,
      });
      onComplete();
    }, 1500);
  };

  if (isLoadingBotConfig) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your bot configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Set up platform integrations</h3>
        <p className="text-gray-600">
          Choose where you want to deploy your chatbot and configure the connections.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        {integrations.map((integration) => (
          <Card
            key={integration.id}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              activeIntegrations.includes(integration.id)
                ? 'ring-2 ring-blue-500 shadow-lg'
                : ''
            }`}
            onClick={() => handleIntegrationToggle(integration.id)}
          >
            <CardHeader className="text-center pb-3">
              <div className={`w-12 h-12 rounded-lg ${integration.color} flex items-center justify-center mx-auto mb-2`}>
                <integration.icon className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-lg">{integration.name}</CardTitle>
              <CardDescription className="text-sm">{integration.description}</CardDescription>
              <Badge variant={integration.difficulty === "Easy" ? "secondary" : "outline"} className="text-xs">
                {integration.difficulty}
              </Badge>
            </CardHeader>
            <CardContent className="pt-0 text-center">
              {activeIntegrations.includes(integration.id) ? (
                <div className="flex items-center justify-center space-x-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Selected</span>
                </div>
              ) : (
                <span className="text-sm text-gray-500">Click to select</span>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {activeIntegrations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Code className="h-5 w-5" />
              <span>Configuration</span>
            </CardTitle>
            <CardDescription>
              Configure the selected platforms below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={activeIntegrations[0]} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                {integrations.map((integration) => (
                  <TabsTrigger
                    key={integration.id}
                    value={integration.id}
                    disabled={!activeIntegrations.includes(integration.id)}
                    className="flex items-center space-x-2"
                  >
                    <integration.icon className="h-4 w-4" />
                    <span>{integration.name}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="website" className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-blue-900 mb-2">Your Bot Configuration</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-blue-800 font-medium">Bot Name:</span>
                      <p className="text-blue-700">{botConfig.name}</p>
                    </div>
                    <div>
                      <span className="text-blue-800 font-medium">Widget ID:</span>
                      <p className="text-blue-700 font-mono text-xs">{widgetId || 'Loading...'}</p>
                    </div>
                    <div>
                      <span className="text-blue-800 font-medium">Primary Color:</span>
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-4 h-4 rounded border"
                          style={{ backgroundColor: botConfig.primaryColor }}
                        />
                        <span className="text-blue-700">{botConfig.primaryColor}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-blue-800 font-medium">Welcome Message:</span>
                      <p className="text-blue-700 truncate">{botConfig.welcomeMessage}</p>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="websiteUrl">Website URL (Optional)</Label>
                      <Input
                        id="websiteUrl"
                        placeholder="https://yourwebsite.com"
                        value={credentials.websiteUrl}
                        onChange={(e) => handleCredentialChange("websiteUrl", e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Widget Preview</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowPreview(!showPreview)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        {showPreview ? 'Hide' : 'Show'} Preview
                      </Button>
                    </div>
                    
                    {showPreview && (
                      <div className="relative bg-gray-100 rounded-lg p-4 h-64">
                        <div className="text-xs text-gray-500 mb-2">Preview (click the chat button)</div>
                        <ChatWidget
                          knowledgeBaseId={botConfig.knowledgeBaseId}
                          systemMessage={botConfig.systemMessage}
                          primaryColor={botConfig.primaryColor}
                          welcomeMessage={botConfig.welcomeMessage}
                          position="bottom-right"
                        />
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Widget Embed Code</Label>
                  <div className="relative">
                    <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-xs overflow-x-auto max-h-64">
                      {generateWidgetCode()}
                    </pre>
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(generateWidgetCode())}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600">
                    Copy this code and paste it before the closing &lt;/body&gt; tag on your website.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="facebook" className="space-y-4">
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Setup Instructions</h4>
                    <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                      <li>Create a Facebook App in the Meta Developer Console</li>
                      <li>Add Messenger product to your app</li>
                      <li>Generate a Page Access Token</li>
                      <li>Set up webhook URL: <code className="bg-blue-100 px-1 rounded">https://api.talkigen.com/webhook/facebook</code></li>
                    </ol>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="facebookPageToken">Page Access Token</Label>
                    <Input
                      id="facebookPageToken"
                      placeholder="Enter your Facebook Page Access Token"
                      value={credentials.facebookPageToken}
                      onChange={(e) => handleCredentialChange("facebookPageToken", e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="facebookVerifyToken">Verify Token</Label>
                    <Input
                      id="facebookVerifyToken"
                      placeholder="Create a verify token (any string)"
                      value={credentials.facebookVerifyToken}
                      onChange={(e) => handleCredentialChange("facebookVerifyToken", e.target.value)}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="telegram" className="space-y-4">
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Setup Instructions</h4>
                    <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                      <li>Message @BotFather on Telegram</li>
                      <li>Send /newbot command</li>
                      <li>Choose a name and username for your bot</li>
                      <li>Copy the bot token provided by BotFather</li>
                    </ol>
                    <Button variant="outline" size="sm" className="mt-2">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open BotFather
                    </Button>
                  </div>
                  
                  {/* Saved Telegram Bots */}
                  {isLoadingTelegramBots ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p className="text-sm text-gray-600">Loading saved bots...</p>
                    </div>
                  ) : telegramBots.length > 0 && (
                    <div className="space-y-2">
                      <Label>Saved Telegram Bots</Label>
                      <div className="space-y-2">
                        {telegramBots.map((bot) => (
                          <div key={bot.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <div className="font-medium text-sm">
                                {bot.bot_name || 'Unnamed Bot'}
                              </div>
                              <div className="text-xs text-gray-500 font-mono">
                                {bot.bot_token.substring(0, 20)}...
                              </div>
                              <div className="text-xs text-gray-400">
                                Created: {new Date(bot.created_at).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => editTelegramBot(bot)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteTelegramBot(bot.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add/Edit Bot Form */}
                  <div className="space-y-4 border-t pt-4">
                    <Label>{editingTelegramBot ? 'Edit Telegram Bot' : 'Add New Telegram Bot'}</Label>
                    
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
                        value={credentials.telegramBotToken}
                        onChange={(e) => handleCredentialChange("telegramBotToken", e.target.value)}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={saveTelegramBot}
                        disabled={isSavingTelegramBot || !credentials.telegramBotToken.trim()}
                        className="flex items-center space-x-2"
                      >
                        <Save className="h-4 w-4" />
                        <span>{isSavingTelegramBot ? "Saving..." : editingTelegramBot ? "Update Bot" : "Save Bot"}</span>
                      </Button>
                      
                      {editingTelegramBot && (
                        <Button
                          variant="outline"
                          onClick={cancelEdit}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between pt-4">
        <Button variant="outline" onClick={onSkip}>
          Configure Later
        </Button>
        <Button
          onClick={handleSaveIntegrations}
          disabled={activeIntegrations.length === 0 || isSaving}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 flex items-center space-x-2"
        >
          <CheckCircle className="h-4 w-4" />
          <span>{isSaving ? "Saving..." : "Complete Setup"}</span>
        </Button>
      </div>
    </div>
  );
};

export default IntegrationStep;
