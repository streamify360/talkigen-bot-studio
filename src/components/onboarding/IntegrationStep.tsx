
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Globe, Facebook, Send, Copy, CheckCircle, ExternalLink, Code, Eye } from "lucide-react";
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
        
        const config = botData.configuration || {};
        
        setBotConfig({
          knowledgeBaseId: config.knowledgeBaseId || "",
          systemMessage: botData.description || "You are a helpful assistant that provides support for our website visitors.",
          welcomeMessage: config.welcomeMessage || "Hi! How can I help you today?",
          primaryColor: config.primaryColor || "#3B82F6",
          name: botData.name || "Chat Assistant"
        });
      } else {
        console.log('IntegrationStep: No bot configuration found, using defaults');
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
    const config = {
      knowledgeBaseId: botConfig.knowledgeBaseId,
      systemMessage: botConfig.systemMessage,
      primaryColor: botConfig.primaryColor,
      welcomeMessage: botConfig.welcomeMessage
    };

    return `<!-- Talkigen Chat Widget -->
<div id="talkigen-chat-widget"></div>
<script>
  (function() {
    // Widget configuration
    const config = ${JSON.stringify(config, null, 4)};
    
    // Create widget container
    const widgetContainer = document.getElementById('talkigen-chat-widget');
    if (!widgetContainer) return;
    
    // Widget styles
    const styles = \`
      #talkigen-chat-widget {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 9999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      
      .talkigen-chat-button {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        border: none;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
        background-color: \${config.primaryColor};
      }
      
      .talkigen-chat-button:hover {
        transform: scale(1.05);
        box-shadow: 0 6px 16px rgba(0,0,0,0.2);
      }
      
      .talkigen-chat-window {
        position: absolute;
        bottom: 70px;
        right: 0;
        width: 350px;
        height: 450px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.15);
        border: 1px solid #e5e7eb;
        display: none;
        flex-direction: column;
        overflow: hidden;
      }
      
      .talkigen-chat-header {
        background-color: \${config.primaryColor};
        color: white;
        padding: 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      
      .talkigen-chat-messages {
        flex: 1;
        padding: 16px;
        overflow-y: auto;
        background-color: #f9fafb;
      }
      
      .talkigen-message {
        margin-bottom: 12px;
        display: flex;
      }
      
      .talkigen-message.user {
        justify-content: flex-end;
      }
      
      .talkigen-message-bubble {
        max-width: 80%;
        padding: 8px 12px;
        border-radius: 12px;
        font-size: 14px;
        line-height: 1.4;
      }
      
      .talkigen-message.user .talkigen-message-bubble {
        background-color: \${config.primaryColor};
        color: white;
      }
      
      .talkigen-message.bot .talkigen-message-bubble {
        background-color: white;
        border: 1px solid #e5e7eb;
        color: #374151;
      }
      
      .talkigen-chat-input {
        padding: 16px;
        border-top: 1px solid #e5e7eb;
        background: white;
        display: flex;
        gap: 8px;
      }
      
      .talkigen-input-field {
        flex: 1;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        padding: 8px 12px;
        font-size: 14px;
        outline: none;
      }
      
      .talkigen-input-field:focus {
        border-color: \${config.primaryColor};
        box-shadow: 0 0 0 2px \${config.primaryColor}20;
      }
      
      .talkigen-send-button {
        background-color: \${config.primaryColor};
        color: white;
        border: none;
        border-radius: 8px;
        padding: 8px 12px;
        cursor: pointer;
        font-size: 14px;
      }
      
      .talkigen-send-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    \`;
    
    // Inject styles
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
    
    // Widget state
    let isOpen = false;
    let messages = [];
    
    // Create widget HTML
    widgetContainer.innerHTML = \`
      <div class="talkigen-chat-window" id="chat-window">
        <div class="talkigen-chat-header">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 8px; height: 8px; background: #10b981; border-radius: 50%;"></div>
            <span style="font-weight: 500;">${botConfig.name}</span>
          </div>
          <button onclick="toggleChat()" style="background: none; border: none; color: white; cursor: pointer; font-size: 18px;">×</button>
        </div>
        <div class="talkigen-chat-messages" id="chat-messages"></div>
        <div class="talkigen-chat-input">
          <input type="text" class="talkigen-input-field" id="message-input" placeholder="Type your message..." />
          <button class="talkigen-send-button" onclick="sendMessage()">Send</button>
        </div>
      </div>
      <button class="talkigen-chat-button" onclick="toggleChat()">
        <svg width="24" height="24" fill="white" viewBox="0 0 24 24">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
        </svg>
      </button>
    \`;
    
    // Global functions
    window.toggleChat = function() {
      const chatWindow = document.getElementById('chat-window');
      isOpen = !isOpen;
      chatWindow.style.display = isOpen ? 'flex' : 'none';
      
      if (isOpen && messages.length === 0) {
        addMessage(config.welcomeMessage, false);
      }
    };
    
    window.sendMessage = function() {
      const input = document.getElementById('message-input');
      const message = input.value.trim();
      
      if (!message) return;
      
      addMessage(message, true);
      input.value = '';
      
      // Send to webhook
      fetch('https://services.talkigen.com/webhook/2f8bbc2f-e9d7-4c60-b789-2e3196af6f23', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          knowledgebase_id: config.knowledgeBaseId,
          system_message: config.systemMessage,
          message: message
        })
      })
      .then(response => response.json())
      .then(data => {
        addMessage(data.output || 'Sorry, I encountered an error.', false);
      })
      .catch(error => {
        console.error('Error:', error);
        addMessage('Sorry, I\\'m having trouble connecting.', false);
      });
    };
    
    function addMessage(text, isUser) {
      messages.push({ text, isUser });
      const messagesContainer = document.getElementById('chat-messages');
      const messageDiv = document.createElement('div');
      messageDiv.className = \`talkigen-message \${isUser ? 'user' : 'bot'}\`;
      messageDiv.innerHTML = \`<div class="talkigen-message-bubble">\${text}</div>\`;
      messagesContainer.appendChild(messageDiv);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    // Handle Enter key
    document.getElementById('message-input').addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        sendMessage();
      }
    });
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
                      <span className="text-blue-800 font-medium">Knowledge Base:</span>
                      <p className="text-blue-700">{botConfig.knowledgeBaseId ? 'Connected' : 'Not connected'}</p>
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
                  <Label>Embed Code</Label>
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
                  
                  <div className="space-y-2">
                    <Label htmlFor="telegramBotToken">Bot Token</Label>
                    <Input
                      id="telegramBotToken"
                      placeholder="Enter your Telegram Bot Token"
                      value={credentials.telegramBotToken}
                      onChange={(e) => handleCredentialChange("telegramBotToken", e.target.value)}
                    />
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
