
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Search, 
  Bot, 
  Eye, 
  Trash2,
  User,
  Calendar,
  Activity
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ChatBot {
  id: string;
  name: string;
  description: string;
  user_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user_email?: string;
  user_name?: string;
}

export const AdminBotsTable = () => {
  const [bots, setBots] = useState<ChatBot[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedBot, setSelectedBot] = useState<ChatBot | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchBots();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('admin-bots-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chatbots' }, () => {
        console.log('Bots data changed, refreshing...');
        fetchBots();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchBots = async () => {
    try {
      setLoading(true);
      
      // Get bots with user information
      const { data, error } = await supabase.functions.invoke('admin-user-management', {
        body: { action: 'list_bots' }
      });

      if (error) {
        throw error;
      }

      setBots(data || []);
    } catch (error: any) {
      console.error('Error fetching bots:', error);
      toast({
        title: "Error",
        description: "Failed to fetch bots",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBot = async (botId: string) => {
    try {
      const { error } = await supabase.functions.invoke('admin-user-management', {
        body: {
          action: 'delete_bot',
          bot_id: botId
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Bot deleted",
        description: "The bot has been deleted successfully",
      });

      fetchBots();
    } catch (error: any) {
      console.error('Error deleting bot:', error);
      toast({
        title: "Error",
        description: "Failed to delete bot",
        variant: "destructive",
      });
    }
  };

  const handleToggleBotStatus = async (botId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.functions.invoke('admin-user-management', {
        body: {
          action: 'toggle_bot_status',
          bot_id: botId,
          is_active: !currentStatus
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: currentStatus ? "Bot deactivated" : "Bot activated",
        description: `The bot has been ${currentStatus ? 'deactivated' : 'activated'} successfully`,
      });

      fetchBots();
    } catch (error: any) {
      console.error('Error toggling bot status:', error);
      toast({
        title: "Error",
        description: "Failed to update bot status",
        variant: "destructive",
      });
    }
  };

  const filteredBots = bots.filter(bot =>
    bot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (bot.user_email && bot.user_email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (bot.description && bot.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search bots by name, owner, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={fetchBots} variant="outline">
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bot Management ({filteredBots.length} bots)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bot Details</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBots.map((bot) => (
                <TableRow key={bot.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium flex items-center">
                        <Bot className="h-4 w-4 mr-2" />
                        {bot.name}
                      </p>
                      {bot.description && (
                        <p className="text-sm text-gray-500 mt-1">{bot.description}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2 text-gray-400" />
                      <div>
                        <p className="font-medium">{bot.user_name || 'Unknown'}</p>
                        <p className="text-sm text-gray-500">{bot.user_email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={bot.is_active ? "default" : "secondary"}
                      className={bot.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}
                    >
                      <Activity className="h-3 w-3 mr-1" />
                      {bot.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(bot.created_at).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedBot(bot)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Bot Details: {bot.name}</DialogTitle>
                            <DialogDescription>
                              Detailed information about this bot
                            </DialogDescription>
                          </DialogHeader>
                          {selectedBot && (
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium">Bot Name</label>
                                <p className="text-sm text-gray-600">{selectedBot.name}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Description</label>
                                <p className="text-sm text-gray-600">{selectedBot.description || 'No description'}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Owner</label>
                                <p className="text-sm text-gray-600">{selectedBot.user_email}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Status</label>
                                <p className="text-sm text-gray-600">{selectedBot.is_active ? 'Active' : 'Inactive'}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Created</label>
                                <p className="text-sm text-gray-600">{new Date(selectedBot.created_at).toLocaleString()}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Last Updated</label>
                                <p className="text-sm text-gray-600">{new Date(selectedBot.updated_at).toLocaleString()}</p>
                              </div>
                              <div className="flex space-x-2 pt-4">
                                <Button
                                  onClick={() => handleToggleBotStatus(selectedBot.id, selectedBot.is_active)}
                                  variant={selectedBot.is_active ? "outline" : "default"}
                                  className="flex-1"
                                >
                                  {selectedBot.is_active ? 'Deactivate' : 'Activate'}
                                </Button>
                                <Button
                                  onClick={() => handleDeleteBot(selectedBot.id)}
                                  variant="destructive"
                                  className="flex-1"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredBots.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    No bots found matching your search criteria
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
