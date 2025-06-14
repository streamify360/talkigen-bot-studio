
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Bot, Palette, MessageSquare, Zap, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BotSetupStepProps {
  onComplete: () => void;
  onSkip: () => void;
}

const BotSetupStep = ({ onComplete, onSkip }: BotSetupStepProps) => {
  const [botConfig, setBotConfig] = useState({
    name: "",
    description: "",
    personality: "professional",
    primaryColor: "#3B82F6",
    welcomeMessage: "Hi! How can I help you today?",
    fallbackMessage: "I'm sorry, I don't understand. Could you please rephrase your question?"
  });
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

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

  const handleInputChange = (field: string, value: string) => {
    setBotConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCreateBot = async () => {
    if (!botConfig.name.trim()) {
      toast({
        title: "Bot name required",
        description: "Please enter a name for your chatbot.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);

    // Simulate bot creation
    setTimeout(() => {
      setIsCreating(false);
      toast({
        title: "Chatbot created successfully!",
        description: `${botConfig.name} is ready to be deployed.`,
      });
      onComplete();
    }, 2000);
  };

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
            <Label htmlFor="botDescription">Description</Label>
            <Textarea
              id="botDescription"
              placeholder="Describe what your bot does..."
              value={botConfig.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              rows={3}
            />
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
                    <Badge variant="secondary" className="text-xs">
                      {personalities.find(p => p.value === botConfig.personality)?.label}
                    </Badge>
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
          <span>{isCreating ? "Creating Bot..." : "Create Chatbot"}</span>
        </Button>
      </div>
    </div>
  );
};

export default BotSetupStep;
