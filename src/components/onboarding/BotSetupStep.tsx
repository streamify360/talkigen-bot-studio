
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Bot, Palette, MessageSquare, Zap, User, Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface BotSetupStepProps {
  onComplete: () => void;
  onSkip: () => void;
}

interface KnowledgeBase {
  id: string;
  title: string;
  created_at: string;
}

const BotSetupStep = ({ onComplete, onSkip }: BotSetupStepProps) => {
  const [botConfig, setBotConfig] = useState({
    name: "",
    description: "",
    personality: "professional",
    primaryColor: "#3B82F6",
    welcomeMessage: "Hi! How can I help you today?",
    fallbackMessage: "I'm sorry, I don't understand. Could you please rephrase your question?",
    knowledgeBaseId: ""
  });
  const [isCreating, setIsCreating] = useState(false);
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [loadingKnowledgeBases, setLoadingKnowledgeBases] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

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

  // Load existing bot configuration and knowledge bases on component mount
  useEffect(() => {
    console.log('BotSetupStep: Component mounted, starting data load...');
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('BotSetupStep: Loading data for user:', user?.id);

      if (!user) {
        console.log('BotSetupStep: No user found, setting defaults');
        setIsLoading(false);
        return;
      }

      // Load both functions in parallel
      await Promise.all([
        loadExistingBotConfig(),
        loadKnowledgeBases()
      ]);

    } catch (error) {
      console.error('BotSetupStep: Error loading data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadExistingBotConfig = async () => {
    if (!user) {
      console.log('BotSetupStep: No user found, skipping bot config load');
      return;
    }

    try {
      console.log('BotSetupStep: Loading existing bot configuration for user:', user.id);
      
      // Check if user already has a bot configuration
      const { data: existingBot, error } = await supabase
        .from('chatbots')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('BotSetupStep: Error loading bot config:', error);
        throw error;
      }

      if (existingBot) {
        console.log('BotSetupStep: Found existing bot:', existingBot);
        
        // Safely parse configuration object
        let config: any = {};
        
        if (existingBot.configuration && typeof existingBot.configuration === 'object') {
          config = existingBot.configuration;
        }
        
        console.log('BotSetupStep: Parsed config:', config);
        
        setBotConfig({
          name: existingBot.name || "",
          description: existingBot.description || "",
          personality: config.personality || "professional",
          primaryColor: config.primaryColor || "#3B82F6",
          welcomeMessage: config.welcomeMessage || "Hi! How can I help you today?",
          fallbackMessage: config.fallbackMessage || "I'm sorry, I don't understand. Could you please rephrase your question?",
          knowledgeBaseId: config.knowledgeBaseId || ""
        });
      } else {
        console.log('BotSetupStep: No existing bot found, using defaults');
      }
    } catch (error) {
      console.error('BotSetupStep: Error loading existing bot config:', error);
      throw error;
    }
  };

  const loadKnowledgeBases = async () => {
    if (!user) {
      console.log('BotSetupStep: No user found, skipping knowledge bases load');
      setLoadingKnowledgeBases(false);
      return;
    }

    try {
      console.log('BotSetupStep: Loading knowledge bases for user:', user.id);
      
      const { data, error } = await supabase
        .from('knowledge_base')
        .select('id, title, created_at')
        .eq('user_id', user.id)
        .eq('file_type', 'knowledge_base')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('BotSetupStep: Error loading knowledge bases:', error);
        throw error;
      } else {
        console.log('BotSetupStep: Loaded knowledge bases:', data);
        setKnowledgeBases(data || []);
      }
    } catch (error) {
      console.error('BotSetupStep: Error loading knowledge bases:', error);
      throw error;
    } finally {
      setLoadingKnowledgeBases(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    console.log('BotSetupStep: Input changed:', field, value);
    setBotConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCreateBot = async () => {
    console.log('BotSetupStep: Creating/updating bot with config:', botConfig);
    
    if (!botConfig.name.trim()) {
      toast({
        title: "Bot name required",
        description: "Please enter a name for your chatbot.",
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

    setIsCreating(true);

    try {
      // Check if bot already exists
      const { data: existingBot, error: checkError } = await supabase
        .from('chatbots')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (checkError) {
        console.error('BotSetupStep: Error checking existing bot:', checkError);
        throw checkError;
      }

      const botData = {
        user_id: user.id,
        name: botConfig.name,
        description: botConfig.description,
        configuration: {
          personality: botConfig.personality,
          primaryColor: botConfig.primaryColor,
          welcomeMessage: botConfig.welcomeMessage,
          fallbackMessage: botConfig.fallbackMessage,
          knowledgeBaseId: botConfig.knowledgeBaseId
        },
        is_active: true
      };

      console.log('BotSetupStep: Bot data to save:', botData);

      if (existingBot) {
        console.log('BotSetupStep: Updating existing bot with ID:', existingBot.id);
        // Update existing bot
        const { error } = await supabase
          .from('chatbots')
          .update(botData)
          .eq('id', existingBot.id);

        if (error) {
          console.error('BotSetupStep: Error updating bot:', error);
          throw error;
        }
      } else {
        console.log('BotSetupStep: Creating new bot');
        // Create new bot
        const { error } = await supabase
          .from('chatbots')
          .insert([botData]);

        if (error) {
          console.error('BotSetupStep: Error creating bot:', error);
          throw error;
        }
      }

      console.log('BotSetupStep: Bot saved successfully');
      toast({
        title: "Chatbot saved successfully!",
        description: `${botConfig.name} configuration has been saved.`,
      });
      onComplete();
    } catch (error) {
      console.error('BotSetupStep: Error saving bot configuration:', error);
      toast({
        title: "Error saving chatbot",
        description: "Failed to save your chatbot configuration. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading bot configuration...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="text-red-600 mb-4">
            <p className="font-medium">Error loading bot configuration</p>
            <p className="text-sm">{error}</p>
          </div>
          <Button 
            onClick={loadData}
            variant="outline"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Configure your chatbot</h3>
        <p className="text-gray-600">
          Customize your bot's personality, appearance, and default messages.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="botName">Bot Name</Label>
            <Input
              id="botName"
              placeholder="e.g., Support Assistant"
              value={botConfig.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="knowledgeBase">Knowledge Base</Label>
            <Select 
              value={botConfig.knowledgeBaseId} 
              onValueChange={(value) => handleInputChange("knowledgeBaseId", value)}
              disabled={loadingKnowledgeBases}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingKnowledgeBases ? "Loading..." : "Select a knowledge base"} />
              </SelectTrigger>
              <SelectContent>
                {knowledgeBases.length === 0 ? (
                  <SelectItem value="" disabled>
                    No knowledge bases found
                  </SelectItem>
                ) : (
                  knowledgeBases.map((kb) => (
                    <SelectItem key={kb.id} value={kb.id}>
                      <div className="flex items-center space-x-2">
                        <Database className="h-4 w-4" />
                        <span>{kb.title}</span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {knowledgeBases.length === 0 && !loadingKnowledgeBases && (
              <p className="text-sm text-gray-500">
                No knowledge bases found. Create one in Step 2 first.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="botDescription">System Message</Label>
            <Textarea
              id="botDescription"
              placeholder="You are an AI assistant for Company XYZ. You help customers with product inquiries, provide technical support, and guide them through our services. Always be helpful, professional, and accurate in your responses."
              value={botConfig.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              rows={4}
            />
            <p className="text-xs text-gray-500">
              This message defines your bot's role and behavior. It will be used as the system prompt.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Personality</Label>
            <Select value={botConfig.personality} onValueChange={(value) => handleInputChange("personality", value)}>
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
                    onClick={() => handleInputChange("primaryColor", color)}
                    className={`w-8 h-8 rounded-full border-2 ${
                      botConfig.primaryColor === color ? 'border-gray-800' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <Input
                type="color"
                value={botConfig.primaryColor}
                onChange={(e) => handleInputChange("primaryColor", e.target.value)}
                className="w-16 h-8 p-1 rounded"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="welcomeMessage">Welcome Message</Label>
            <Textarea
              id="welcomeMessage"
              placeholder="What should your bot say when users start a conversation?"
              value={botConfig.welcomeMessage}
              onChange={(e) => handleInputChange("welcomeMessage", e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fallbackMessage">Fallback Message</Label>
            <Textarea
              id="fallbackMessage"
              placeholder="What should your bot say when it doesn't understand?"
              value={botConfig.fallbackMessage}
              onChange={(e) => handleInputChange("fallbackMessage", e.target.value)}
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
                        style={{ backgroundColor: botConfig.primaryColor }}
                      >
                        <Bot className="h-5 w-5 text-white" />
                      </div>
                      <span className="font-medium">{botConfig.name || "Your Bot"}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className="text-xs">
                        {personalities.find(p => p.value === botConfig.personality)?.label}
                      </Badge>
                      {botConfig.knowledgeBaseId && (
                        <Badge variant="outline" className="text-xs">
                          <Database className="h-3 w-3 mr-1" />
                          KB Connected
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex">
                      <div 
                        className="max-w-xs px-3 py-2 rounded-lg text-sm text-white"
                        style={{ backgroundColor: botConfig.primaryColor }}
                      >
                        {botConfig.welcomeMessage}
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <div className="max-w-xs px-3 py-2 rounded-lg bg-gray-200 text-sm">
                        Hello! I have a question about your product.
                      </div>
                    </div>
                    
                    <div className="flex">
                      <div 
                        className="max-w-xs px-3 py-2 rounded-lg text-sm text-white"
                        style={{ backgroundColor: botConfig.primaryColor }}
                      >
                        I'd be happy to help! What would you like to know?
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center space-x-2">
                <Zap className="h-4 w-4" />
                <span>AI Features</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>Natural Language Processing</span>
                  <Badge variant="secondary">Enabled</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Context Awareness</span>
                  <Badge variant="secondary">Enabled</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Knowledge Base Integration</span>
                  <Badge variant={botConfig.knowledgeBaseId ? "secondary" : "outline"}>
                    {botConfig.knowledgeBaseId ? "Connected" : "Not Connected"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Multi-language Support</span>
                  <Badge variant="secondary">Pro Feature</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4">
        <Button variant="outline" onClick={onSkip}>
          Use Default Settings
        </Button>
        <Button
          onClick={handleCreateBot}
          disabled={isCreating}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 flex items-center space-x-2"
        >
          <Bot className="h-4 w-4" />
          <span>{isCreating ? "Saving Bot..." : "Create Chatbot"}</span>
        </Button>
      </div>
    </div>
  );
};

export default BotSetupStep;
