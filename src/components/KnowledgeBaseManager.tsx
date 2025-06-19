import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Database, Plus, Upload, FileText, Trash2, Edit, 
  Search, Filter, Download, Eye, AlertCircle,
  File, FileImage, FileVideo
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useKnowledgeBaseLimits } from "@/hooks/useKnowledgeBaseLimits";
import { supabase } from "@/integrations/supabase/client";

interface KnowledgeBase {
  id: string;
  title: string;
  content: string;
  file_type: string;
  created_at: string;
  updated_at: string;
  file_size?: number;
  fileCount?: number;
  totalSize?: number;
}

const KnowledgeBaseManager = () => {
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { canCreateKnowledgeBase } = useKnowledgeBaseLimits();

  useEffect(() => {
    loadKnowledgeBases();
  }, [user]);

  const loadKnowledgeBases = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('knowledge_base')
        .select('*')
        .eq('user_id', user.id)
        .eq('file_type', 'knowledge_base')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setKnowledgeBases(data || []);
    } catch (error) {
      console.error('Error loading knowledge bases:', error);
      toast({
        title: "Error",
        description: "Failed to load knowledge bases.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createKnowledgeBase = async () => {
    if (!user) return;

    if (!newTitle) {
      toast({
        title: "Error",
        description: "Title is required.",
        variant: "destructive",
      });
      return;
    }

    if (!canCreateKnowledgeBase(knowledgeBases.length)) {
      toast({
        title: "Limit Reached",
        description: "You have reached the maximum number of knowledge bases allowed for your plan.",
        variant: "destructive",
      });
      return;
    }

    try {
      setCreating(true);

      const { data, error } = await supabase
        .from('knowledge_base')
        .insert([
          { 
            user_id: user.id, 
            title: newTitle, 
            content: newDescription,
            file_type: 'knowledge_base'
          }
        ])
        .select()

      if (error) throw error;

      toast({
        title: "Knowledge base created",
        description: "New knowledge base has been created successfully.",
      });

      setNewTitle("");
      setNewDescription("");
      setShowCreateForm(false);
      await loadKnowledgeBases();
    } catch (error) {
      console.error('Error creating knowledge base:', error);
      toast({
        title: "Error",
        description: "Failed to create knowledge base. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const deleteKnowledgeBase = async (id: string) => {
    if (!user) return;

    if (!confirm("Are you sure you want to delete this knowledge base? This action cannot be undone.")) {
      return;
    }

    try {
      setLoading(true);

      // Delete associated files first
      const { data: files, error: filesError } = await supabase
        .from('knowledge_base')
        .select('id')
        .eq('user_id', user.id)
        .neq('file_type', 'knowledge_base')
        .like('content', `%/${id}/%`);

      if (filesError) throw filesError;

      if (files && files.length > 0) {
        const fileIdsToDelete = files.map(file => file.id);

        const { error: deleteFilesError } = await supabase
          .from('knowledge_base')
          .delete()
          .in('id', fileIdsToDelete);

        if (deleteFilesError) throw deleteFilesError;
      }

      // Then delete the knowledge base itself
      const { error } = await supabase
        .from('knowledge_base')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Knowledge base deleted",
        description: "Knowledge base has been deleted successfully.",
      });

      await loadKnowledgeBases();
    } catch (error) {
      console.error('Error deleting knowledge base:', error);
      toast({
        title: "Error",
        description: "Failed to delete knowledge base. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const uploadFile = async (knowledgeBaseId: string) => {
    if (!user || !selectedFile) return;

    try {
      setLoading(true);

      const fileExt = selectedFile.name.split('.').pop();
      const filePath = `knowledge_base/${user.id}/${knowledgeBaseId}/${selectedFile.name}`;

      const { data, error } = await supabase.storage
        .from('files')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const publicURL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/files/${data.path}`;

      const { error: kbError } = await supabase
        .from('knowledge_base')
        .insert([
          { 
            user_id: user.id, 
            title: selectedFile.name, 
            content: publicURL,
            file_type: fileExt || 'txt',
            file_size: selectedFile.size
          }
        ]);

      if (kbError) throw kbError;

      toast({
        title: "File uploaded",
        description: `${selectedFile.name} has been uploaded successfully.`,
      });

      setSelectedFile(null);
      await loadKnowledgeBases();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Error",
        description: "Failed to upload file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType.toLowerCase()) {
      case 'pdf': return <FileText className="h-4 w-4 mr-2" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif': return <FileImage className="h-4 w-4 mr-2" />;
      case 'mp4':
      case 'mov':
      case 'avi': return <FileVideo className="h-4 w-4 mr-2" />;
      default: return <FileText className="h-4 w-4 mr-2" />;
    }
  };

  const filteredKnowledgeBases = knowledgeBases.filter(kb =>
    kb.title.toLowerCase().includes(searchTerm.toLowerCase())
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
      <div>
        <h2 className="text-2xl font-bold">Knowledge Base</h2>
        <p className="text-gray-600">Manage your knowledge bases and files</p>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Input
            type="text"
            placeholder="Search knowledge bases..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="sm:w-64"
          />
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
        <Button onClick={() => setShowCreateForm(true)} disabled={creating}>
          <Plus className="h-4 w-4 mr-2" />
          Create Knowledge Base
        </Button>
      </div>

      {/* Create Knowledge Base Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Knowledge Base</CardTitle>
            <CardDescription>Enter the details for your new knowledge base</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Enter title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter description"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="ghost" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
              <Button onClick={createKnowledgeBase} disabled={creating}>
                Create
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Knowledge Base List */}
      {filteredKnowledgeBases.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Database className="h-10 w-10 mx-auto text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-500">No knowledge bases found.</p>
            <p className="text-sm text-gray-400">Create a new knowledge base to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredKnowledgeBases.map((kb) => (
            <Card key={kb.id} className="bg-white shadow-md rounded-lg overflow-hidden">
              <CardHeader className="px-4 py-3">
                <CardTitle className="text-lg font-semibold">{kb.title}</CardTitle>
                <CardDescription className="text-gray-500 text-sm">{kb.content}</CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-1" />
                    {kb.file_type}
                  </div>
                  <div>
                    Updated: {new Date(kb.updated_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex justify-end mt-4 space-x-2">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                  <Button variant="secondary" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => deleteKnowledgeBase(kb.id)}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default KnowledgeBaseManager;
