
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
  Database, 
  Eye, 
  Trash2,
  User,
  Calendar,
  FileText,
  HardDrive
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface KnowledgeBase {
  id: string;
  title: string;
  content: string;
  user_id: string;
  chatbot_id: string;
  file_size: number;
  file_type: string;
  gcp_file_path: string;
  created_at: string;
  updated_at: string;
  user_email?: string;
  user_name?: string;
  bot_name?: string;
}

export const AdminKnowledgeBaseTable = () => {
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedKB, setSelectedKB] = useState<KnowledgeBase | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchKnowledgeBases();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('admin-kb-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'knowledge_base' }, () => {
        console.log('Knowledge base data changed, refreshing...');
        fetchKnowledgeBases();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchKnowledgeBases = async () => {
    try {
      setLoading(true);
      
      // Get knowledge bases with user and bot information
      const { data, error } = await supabase.functions.invoke('admin-user-management', {
        body: { action: 'list_knowledge_bases' }
      });

      if (error) {
        throw error;
      }

      setKnowledgeBases(data || []);
    } catch (error: any) {
      console.error('Error fetching knowledge bases:', error);
      toast({
        title: "Error",
        description: "Failed to fetch knowledge bases",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteKB = async (kbId: string) => {
    try {
      const { error } = await supabase.functions.invoke('admin-user-management', {
        body: {
          action: 'delete_knowledge_base',
          kb_id: kbId
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Knowledge base deleted",
        description: "The knowledge base has been deleted successfully",
      });

      fetchKnowledgeBases();
    } catch (error: any) {
      console.error('Error deleting knowledge base:', error);
      toast({
        title: "Error",
        description: "Failed to delete knowledge base",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return 'N/A';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredKBs = knowledgeBases.filter(kb =>
    kb.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (kb.user_email && kb.user_email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (kb.bot_name && kb.bot_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (kb.file_type && kb.file_type.toLowerCase().includes(searchTerm.toLowerCase()))
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
            placeholder="Search knowledge bases by title, owner, bot, or file type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={fetchKnowledgeBases} variant="outline">
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Knowledge Base Management ({filteredKBs.length} knowledge bases)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Knowledge Base</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Bot</TableHead>
                <TableHead>File Info</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredKBs.map((kb) => (
                <TableRow key={kb.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium flex items-center">
                        <Database className="h-4 w-4 mr-2" />
                        {kb.title}
                      </p>
                      {kb.content && (
                        <p className="text-sm text-gray-500 mt-1 truncate max-w-xs">
                          {kb.content.substring(0, 100)}...
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2 text-gray-400" />
                      <div>
                        <p className="font-medium">{kb.user_name || 'Unknown'}</p>
                        <p className="text-sm text-gray-500">{kb.user_email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {kb.bot_name ? (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        {kb.bot_name}
                      </Badge>
                    ) : (
                      <span className="text-sm text-gray-500">No bot assigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {kb.file_type && (
                        <div className="flex items-center">
                          <FileText className="h-3 w-3 mr-1" />
                          <span className="font-medium">{kb.file_type.toUpperCase()}</span>
                        </div>
                      )}
                      {kb.file_size && (
                        <div className="flex items-center text-gray-500 mt-1">
                          <HardDrive className="h-3 w-3 mr-1" />
                          <span>{formatFileSize(kb.file_size)}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(kb.created_at).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedKB(kb)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Knowledge Base: {kb.title}</DialogTitle>
                            <DialogDescription>
                              Detailed information about this knowledge base
                            </DialogDescription>
                          </DialogHeader>
                          {selectedKB && (
                            <div className="space-y-4 max-h-96 overflow-y-auto">
                              <div>
                                <label className="text-sm font-medium">Title</label>
                                <p className="text-sm text-gray-600">{selectedKB.title}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Content Preview</label>
                                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded max-h-32 overflow-y-auto">
                                  {selectedKB.content || 'No content available'}
                                </p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Owner</label>
                                <p className="text-sm text-gray-600">{selectedKB.user_email}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Associated Bot</label>
                                <p className="text-sm text-gray-600">{selectedKB.bot_name || 'No bot assigned'}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">File Type</label>
                                <p className="text-sm text-gray-600">{selectedKB.file_type || 'N/A'}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">File Size</label>
                                <p className="text-sm text-gray-600">{formatFileSize(selectedKB.file_size)}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">File Path</label>
                                <p className="text-sm text-gray-600 break-all">{selectedKB.gcp_file_path || 'N/A'}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Created</label>
                                <p className="text-sm text-gray-600">{new Date(selectedKB.created_at).toLocaleString()}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Last Updated</label>
                                <p className="text-sm text-gray-600">{new Date(selectedKB.updated_at).toLocaleString()}</p>
                              </div>
                              <div className="flex space-x-2 pt-4">
                                <Button
                                  onClick={() => handleDeleteKB(selectedKB.id)}
                                  variant="destructive"
                                  className="flex-1"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Knowledge Base
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
              {filteredKBs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No knowledge bases found matching your search criteria
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
