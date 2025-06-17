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

interface FacebookBot {
  id: string;
  page_access_token: string;
  page_name: string | null;
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
  const [telegramBot, setTelegramBot] = useState<TelegramBot | null>(null);
  const [isLoadingTelegramBot, setIsLoadingTelegramBot] = useState(false);
  const [isSavingTelegramBot, setIsSavingTelegramBot] = useState(false);
  const [isEditingTelegramBot, setIsEditingTelegramBot] = useState(false);
  const [telegramBotName, setTelegramBotName] = useState("");
  
  // New Facebook bot state
  const [facebookBot, setFacebookBot] = useState<FacebookBot | null>(null);
  const [isLoadingFacebookBot, setIsLoadingFacebookBot] = useState(false);
  const [isSavingFacebookBot, setIsSavingFacebookBot] = useState(false);
  const [isEditingFacebookBot, setIsEditingFacebookBot] = useState(false);
  const [facebookPageName, setFacebookPageName] = useState("");
  const [chatbotId, setChatbotId] = useState<string>('');
  
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

  // Load bots when user changes
  useEffect(() => {
    if (user) {
      loadTelegramBot();
      loadFacebookBot();
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
        
        // Store chatbot ID for Facebook webhook URL
        setChatbotId(botData.id);
        
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

  const loadTelegramBot = async () => {
    if (!user) return;

    setIsLoadingTelegramBot(true);
    try {
      const { data, error } = await supabase
        .from('telegram_bots')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw error;
      }
      
      setTelegramBot(data || null);
      if (data) {
        setCredentials(prev => ({ ...prev, telegramBotToken: data.bot_token }));
        setTelegramBotName(data.bot_name || "");
      }
    } catch (error) {
      console.error('Error loading Telegram bot:', error);
      toast({
        title: "Error loading Telegram bot",
        description: "Failed to load your saved Telegram bot.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingTelegramBot(false);
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
      if (telegramBot) {
        // Update existing bot
        result = await supabase
          .from('telegram_bots')
          .update(botData)
          .eq('id', telegramBot.id)
          .eq('user_id', user.id);
      } else {
        // Create new bot
        result = await supabase
          .from('telegram_bots')
          .insert(botData);
      }

      if (result.error) throw result.error;

      // Send token and knowledgebase_id to webhook
      const webhookResponse = await fetch('https://services.talkigen.com/webhook/4caab28c-c63c-4286-9716-3b0a74f5c680', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `token=${encodeURIComponent(credentials.telegramBotToken.trim())}&knowledgebase_id=${encodeURIComponent(botConfig.knowledgeBaseId)}`
      });

      if (!webhookResponse.ok) {
        console.error('Webhook response not ok:', webhookResponse.status);
        // Don't throw error here, as the database save was successful
      }

      toast({
        title: "Success",
        description: telegramBot ? "Telegram bot updated successfully!" : "Telegram bot saved successfully!",
      });

      // Mark telegram as active integration
      if (!activeIntegrations.includes('telegram')) {
        setActiveIntegrations(prev => [...prev, 'telegram']);
      }

      setIsEditingTelegramBot(false);
      
      // Reload bot
      await loadTelegramBot();
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

  const editTelegramBot = () => {
    if (telegramBot) {
      setCredentials(prev => ({ ...prev, telegramBotToken: telegramBot.bot_token }));
      setTelegramBotName(telegramBot.bot_name || "");
      setIsEditingTelegramBot(true);
    }
  };

  const deleteTelegramBot = async () => {
    if (!user || !telegramBot) return;

    try {
      const { error } = await supabase
        .from('telegram_bots')
        .delete()
        .eq('id', telegramBot.id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Telegram bot deleted successfully!",
      });

      // Remove telegram from active integrations
      setActiveIntegrations(prev => prev.filter(id => id !== 'telegram'));
      setTelegramBot(null);
      setCredentials(prev => ({ ...prev, telegramBotToken: "" }));
      setTelegramBotName("");
      setIsEditingTelegramBot(false);
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
    if (telegramBot) {
      setCredentials(prev => ({ ...prev, telegramBotToken: telegramBot.bot_token }));
      setTelegramBotName(telegramBot.bot_name || "");
    } else {
      setCredentials(prev => ({ ...prev, telegramBotToken: "" }));
      setTelegramBotName("");
    }
    setIsEditingTelegramBot(false);
  };

  // New Facebook bot functions
  const loadFacebookBot = async () => {
    if (!user) return;

    setIsLoadingFacebookBot(true);
    try {
      const { data, error } = await supabase
        .from('facebook_bots')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw error;
      }
      
      setFacebookBot(data || null);
      if (data) {
        setCredentials(prev => ({ ...prev, facebookPageToken: data.page_access_token }));
        setFacebookPageName(data.page_name || "");
      }
    } catch (error) {
      console.error('Error loading Facebook bot:', error);
      toast({
        title: "Error loading Facebook bot",
        description: "Failed to load your saved Facebook bot.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingFacebookBot(false);
    }
  };

  const saveFacebookBot = async () => {
    if (!user || !credentials.facebookPageToken.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid Facebook Page Access Token.",
        variant: "destructive",
      });
      return;
    }

    setIsSavingFacebookBot(true);
    try {
      // Save to database
      const botData = {
        user_id: user.id,
        page_access_token: credentials.facebookPageToken.trim(),
        page_name: facebookPageName.trim() || null,
        updated_at: new Date().toISOString()
      };

      let result;
      if (facebookBot) {
        // Update existing bot
        result = await supabase
          .from('facebook_bots')
          .update(botData)
          .eq('id', facebookBot.id)
          .eq('user_id', user.id);
      } else {
        // Create new bot
        result = await supabase
          .from('facebook_bots')
          .insert(botData);
      }

      if (result.error) throw result.error;

      toast({
        title: "Success",
        description: facebookBot ? "Facebook bot updated successfully!" : "Facebook bot saved successfully!",
      });

      // Mark facebook as active integration
      if (!activeIntegrations.includes('facebook')) {
        setActiveIntegrations(prev => [...prev, 'facebook']);
      }

      setIsEditingFacebookBot(false);
      
      // Reload bot
      await loadFacebookBot();
    } catch (error) {
      console.error('Error saving Facebook bot:', error);
      toast({
        title: "Error",
        description: "Failed to save Facebook bot. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingFacebookBot(false);
    }
  };

  const editFacebookBot = () => {
    if (facebookBot) {
      setCredentials(prev => ({ ...prev, facebookPageToken: facebookBot.page_access_token }));
      setFacebookPageName(facebookBot.page_name || "");
      setIsEditingFacebookBot(true);
    }
  };

  const deleteFacebookBot = async () => {
    if (!user || !facebookBot) return;

    try {
      const { error } = await supabase
        .from('facebook_bots')
        .delete()
        .eq('id', facebookBot.id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Facebook bot deleted successfully!",
      });

      // Remove facebook from active integrations
      setActiveIntegrations(prev => prev.filter(id => id !== 'facebook'));
      setFacebookBot(null);
      setCredentials(prev => ({ ...prev, facebookPageToken: "" }));
      setFacebookPageName("");
      setIsEditingFacebookBot(false);
    } catch (error) {
      console.error('Error deleting Facebook bot:', error);
      toast({
        title: "Error",
        description: "Failed to delete Facebook bot. Please try again.",
        variant: "destructive",
      });
    }
  };

  const cancelFacebookEdit = () => {
    if (facebookBot) {
      setCredentials(prev => ({ ...prev, facebookPageToken: facebookBot.page_access_token }));
      setFacebookPageName(facebookBot.page_name || "");
    } else {
      setCredentials(prev => ({ ...prev, facebookPageToken: "" }));
      setFacebookPageName("");
    }
    setIsEditingFacebookBot(false);
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
        primaryColor: '${botConfig.primaryColor}',
        knowledgeBaseId: '${botConfig.knowledgeBaseId}',
        systemMessage: '${botConfig.systemMessage}'
      });
    };
    document.head.appendChild(script);
  })();
</script>`;
  };

  const generateFacebookWebhookUrl = () => {
    return `https://services.talkigen.com/webhook/71130fd5-9f5b-4b51-8797-7eec99b98338?knowledgebase_id=${botConfig.knowledgeBaseId}&chatbot_id=${chatbotId}`;
  };

  const saveIntegrationProgress = async () => {
    if (!user) return;

    try {
      const stepData = {
        integrations: activeIntegrations,
        websiteUrl: credentials.websiteUrl,
        hasTelegramBot: !!telegramBot,
        hasFacebookMessenger: !!facebookBot,
        hasWebsiteWidget: activeIntegrations.includes('website')
      };

      const { error } = await supabase
        .from('onboarding_progress')
        .upsert({
          user_id: user.id,
          step_id: 3, // Step 4 (0-indexed)
          step_data: stepData,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,step_id'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving integration progress:', error);
    }
  };

  const handleSaveIntegrations = async () => {
    setIsSaving(true);

    try {
      // Save progress to database
      await saveIntegrationProgress();

      toast({
        title: "Integrations configured!",
        description: `Successfully set up ${activeIntegrations.length} platform(s).`,
      });
      
      onComplete();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save integration settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Load existing integrations when component mounts
  useEffect(() => {
    const loadExistingIntegrations = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('onboarding_progress')
          .select('step_data')
          .eq('user_id', user.id)
          .eq('step_id', 3)
          .maybeSingle();

        if (error) throw error;

        if (data?.step_data) {
          const stepData = data.step_data as any;
          if (stepData.integrations) {
            setActiveIntegrations(stepData.integrations);
          }
          if (stepData.websiteUrl) {
            setCredentials(prev => ({ ...prev, websiteUrl: stepData.websiteUrl }));
          }
        }
      } catch (error) {
        console.error('Error loading existing integrations:', error);
      }
    };

    loadExistingIntegrations();
  }, [user]);

  // Auto-mark integrations as active based on saved data
  useEffect(() => {
    const newActiveIntegrations = [...activeIntegrations];
    
    if (telegramBot && !newActiveIntegrations.includes('telegram')) {
      newActiveIntegrations.push('telegram');
    }
    
    if (facebookBot && !newActiveIntegrations.includes('facebook')) {
      newActiveIntegrations.push('facebook');
    }
    
    if (credentials.websiteUrl && !newActiveIntegrations.includes('website')) {
      newActiveIntegrations.push('website');
    }

    if (newActiveIntegrations.length !== activeIntegrations.length) {
      setActiveIntegrations(newActiveIntegrations);
    }
  }, [telegramBot, facebookBot, credentials.websiteUrl]);

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
                      <Label htmlFor="websiteUrl">Website URL</Label>
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
                      <li>Generate a Page Access Token for your Facebook page</li>
                      <li>Use the webhook URL and verify token provided below</li>
                    </ol>
                    <Button variant="outline" size="sm" className="mt-2">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open Meta Developer Console
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Webhook URL</Label>
                      <div className="relative">
                        <Input
                          value={generateFacebookWebhookUrl()}
                          readOnly
                          className="bg-gray-50 font-mono text-xs"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="absolute top-1 right-1"
                          onClick={() => copyToClipboard(generateFacebookWebhookUrl())}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-gray-600">
                        Use this URL in your Facebook App webhook configuration.
                      </p>
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
                      <p className="text-sm text-gray-600">
                        Use this verify token in your Facebook App webhook configuration.
                      </p>
                    </div>
                  </div>
                  
                  {/* Current Facebook Bot */}
                  {isLoadingFacebookBot ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p className="text-sm text-gray-600">Loading bot...</p>
                    </div>
                  ) : facebookBot && !isEditingFacebookBot ? (
                    <div className="space-y-2">
                      <Label>Current Facebook Bot</Label>
                      <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium text-sm text-green-800">
                            {facebookBot.page_name || 'Unnamed Page'}
                          </div>
                          <div className="text-xs text-green-600 font-mono">
                            {facebookBot.page_access_token.substring(0, 20)}...
                          </div>
                          <div className="text-xs text-green-500">
                            Created: {new Date(facebookBot.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={editFacebookBot}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={deleteFacebookBot}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 border-t pt-4">
                      <Label>{facebookBot ? 'Edit Facebook Bot' : 'Add Facebook Bot'}</Label>
                      
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
                          value={credentials.facebookPageToken}
                          onChange={(e) => handleCredentialChange("facebookPageToken", e.target.value)}
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={saveFacebookBot}
                          disabled={isSavingFacebookBot || !credentials.facebookPageToken.trim()}
                          className="flex items-center space-x-2"
                        >
                          <Save className="h-4 w-4" />
                          <span>{isSavingFacebookBot ? "Saving..." : facebookBot ? "Update Bot" : "Save Bot"}</span>
                        </Button>
                        
                        {isEditingFacebookBot && (
                          <Button
                            variant="outline"
                            onClick={cancelFacebookEdit}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
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
                  
                  {/* Current Telegram Bot */}
                  {isLoadingTelegramBot ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p className="text-sm text-gray-600">Loading bot...</p>
                    </div>
                  ) : telegramBot && !isEditingTelegramBot ? (
                    <div className="space-y-2">
                      <Label>Current Telegram Bot</Label>
                      <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium text-sm text-green-800">
                            {telegramBot.bot_name || 'Unnamed Bot'}
                          </div>
                          <div className="text-xs text-green-600 font-mono">
                            {telegramBot.bot_token.substring(0, 20)}...
                          </div>
                          <div className="text-xs text-green-500">
                            Created: {new Date(telegramBot.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={editTelegramBot}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={deleteTelegramBot}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 border-t pt-4">
                      <Label>{telegramBot ? 'Edit Telegram Bot' : 'Add Telegram Bot'}</Label>
                      
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
                          <span>{isSavingTelegramBot ? "Saving..." : telegramBot ? "Update Bot" : "Save Bot"}</span>
                        </Button>
                        
                        {isEditingTelegramBot && (
                          <Button
                            variant="outline"
                            onClick={cancelEdit}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-end pt-4">
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
