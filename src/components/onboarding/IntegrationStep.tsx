
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Globe, Facebook, Send, Copy, CheckCircle, ExternalLink, Code } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface IntegrationStepProps {
  onComplete: () => void;
  onSkip: () => void;
}

const IntegrationStep = ({ onComplete, onSkip }: IntegrationStepProps) => {
  const [activeIntegrations, setActiveIntegrations] = useState<string[]>([]);
  const [credentials, setCredentials] = useState({
    facebookPageToken: "",
    facebookVerifyToken: "",
    telegramBotToken: "",
    websiteUrl: ""
  });
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

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

  const websiteEmbedCode = `<script>
  (function() {
    var script = document.createElement('script');
    script.src = 'https://widget.talkigen.com/widget.js';
    script.setAttribute('data-bot-id', 'your-bot-id');
    script.setAttribute('data-primary-color', '#3B82F6');
    document.head.appendChild(script);
  })();
</script>`;

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

              <TabsContent value="website" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="websiteUrl">Website URL (Optional)</Label>
                  <Input
                    id="websiteUrl"
                    placeholder="https://yourwebsite.com"
                    value={credentials.websiteUrl}
                    onChange={(e) => handleCredentialChange("websiteUrl", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Embed Code</Label>
                  <div className="relative">
                    <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto">
                      {websiteEmbedCode}
                    </pre>
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(websiteEmbedCode)}
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
