import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, Trash2, Database, Edit3, X, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import PlanLimitChecker from "@/components/PlanLimitChecker";

interface ExistingFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

interface ExistingKnowledgeBase {
  id: string;
  title: string;
  content: string | null;
  files: ExistingFile[];
}

const KnowledgeBaseManager = () => {
  const [knowledgeBaseName, setKnowledgeBaseName] = useState("");
  const [description, setDescription] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [existingKnowledgeBases, setExistingKnowledgeBases] = useState<ExistingKnowledgeBase[]>([]);
  const [editingKB, setEditingKB] = useState<string | null>(null);
  const [existingFiles, setExistingFiles] = useState<ExistingFile[]>([]);
  const [filesToDelete, setFilesToDelete] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { toast } = useToast();
  const { canCreateKnowledgeBase } = useAuth();

  useEffect(() => {
    loadExistingKnowledgeBases();
  }, []);

  const loadExistingKnowledgeBases = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: kbData, error: kbError } = await supabase
        .from('knowledge_base')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('file_type', 'knowledge_base')
        .order('created_at', { ascending: false });

      if (kbError) throw kbError;

      const knowledgeBasesWithFiles = await Promise.all(
        (kbData || []).map(async (kb) => {
          const { data: files, error: filesError } = await supabase
            .from('knowledge_base')
            .select('id, title, file_size, file_type, content')
            .eq('user_id', session.user.id)
            .neq('file_type', 'knowledge_base')
            .order('created_at', { ascending: true });

          const kbFiles = (files || [])
            .filter(file => file.content?.includes(`/${kb.id}/`))
            .map(file => ({
              id: file.id,
              name: file.title,
              size: file.file_size || 0,
              type: file.file_type || 'application/octet-stream',
              url: file.content || ''
            }));

          return {
            id: kb.id,
            title: kb.title,
            content: kb.content,
            files: kbFiles
          };
        })
      );

      setExistingKnowledgeBases(knowledgeBasesWithFiles);
    } catch (error) {
      console.error('Error loading knowledge bases:', error);
      toast({
        title: "Error",
        description: "Failed to load existing knowledge bases.",
        variant: "destructive",
      });
    }
  };

  const handleEditKB = (kb: ExistingKnowledgeBase) => {
    setShowCreateForm(true);
    setEditingKB(kb.id);
    setKnowledgeBaseName(kb.title);
    setDescription(kb.content || "");
    setExistingFiles(kb.files);
    setUploadedFiles([]);
    setFilesToDelete([]);
  };

  const handleCancelEdit = () => {
    setEditingKB(null);
    setKnowledgeBaseName("");
    setDescription("");
    setExistingFiles([]);
    setUploadedFiles([]);
    setFilesToDelete([]);
    setShowCreateForm(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const validTypes = ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      return validTypes.includes(file.type) && file.size <= 10 * 1024 * 1024; // 10MB limit
    });

    if (validFiles.length !== files.length) {
      toast({
        title: "Some files were skipped",
        description: "Only PDF, DOC, DOCX, and TXT files under 10MB are supported.",
        variant: "destructive",
      });
    }

    setUploadedFiles([...uploadedFiles, ...validFiles]);
  };

  const removeNewFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const removeExistingFile = (fileId: string) => {
    setExistingFiles(existingFiles.filter(f => f.id !== fileId));
    setFilesToDelete([...filesToDelete, fileId]);
  };

  const handleCreate = async () => {
    if (!knowledgeBaseName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for your knowledge base.",
        variant: "destructive",
      });
      return;
    }

    // Check plan limits for new knowledge bases
    if (!canCreateKnowledgeBase(existingKnowledgeBases.length)) {
      toast({
        title: "Plan limit reached",
        description: "You've reached the maximum number of knowledge bases for your current plan. Please upgrade to create more.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setUploadProgress(0);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("No active session");
      }

      const formData = new FormData();
      formData.append("name", knowledgeBaseName);
      if (description) {
        formData.append("description", description);
      }
      
      uploadedFiles.forEach(file => {
        formData.append("files", file);
      });

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch(`https://rjvpzflhgwduveemjibw.supabase.co/functions/v1/create-knowledge-base`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: formData
      });

      const result = await response.json();
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!result.success) {
        throw new Error(result.error || "Failed to create knowledge base");
      }

      toast({
        title: "Knowledge base created!",
        description: `Successfully processed ${uploadedFiles.length} files and stored them in GCP bucket.`,
      });

      // Reset form and reload data
      setKnowledgeBaseName("");
      setDescription("");
      setUploadedFiles([]);
      await loadExistingKnowledgeBases();
      setShowCreateForm(false);

    } catch (error) {
      console.error("Error creating knowledge base:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create knowledge base. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdate = async () => {
    if (!knowledgeBaseName.trim() || !editingKB) {
      toast({
        title: "Name required",
        description: "Please enter a name for your knowledge base.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setUploadProgress(0);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("No active session");
      }

      const formData = new FormData();
      formData.append("knowledgeBaseId", editingKB);
      formData.append("name", knowledgeBaseName);
      if (description) {
        formData.append("description", description);
      }
      formData.append("filesToDelete", JSON.stringify(filesToDelete));
      
      uploadedFiles.forEach(file => {
        formData.append("newFiles", file);
      });

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch(`https://rjvpzflhgwduveemjibw.supabase.co/functions/v1/update-knowledge-base`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: formData
      });

      const result = await response.json();
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!result.success) {
        throw new Error(result.error || "Failed to update knowledge base");
      }

      toast({
        title: "Knowledge base updated!",
        description: `Successfully updated knowledge base with ${uploadedFiles.length} new files.`,
      });

      // Reset form and reload data
      handleCancelEdit();
      await loadExistingKnowledgeBases();

    } catch (error) {
      console.error("Error updating knowledge base:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update knowledge base. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isEditing = editingKB !== null;
  const totalFiles = existingFiles.length + uploadedFiles.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Knowledge Bases</h2>
          <p className="text-gray-600">Manage your AI knowledge bases and files</p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Create New</span>
        </Button>
      </div>

      {/* Plan Limit Check */}
      <PlanLimitChecker currentCount={existingKnowledgeBases.length} limitType="knowledgeBases">
        {/* Knowledge Base List */}
        {existingKnowledgeBases.length > 0 ? (
          <div className="grid gap-4">
            {existingKnowledgeBases.map((kb) => (
              <Card key={kb.id} className="border border-gray-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{kb.title}</CardTitle>
                      {kb.content && (
                        <CardDescription className="mt-1">{kb.content}</CardDescription>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditKB(kb)}
                      className="flex items-center space-x-1"
                    >
                      <Edit3 className="h-4 w-4" />
                      <span>Edit</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>{kb.files.length} file{kb.files.length !== 1 ? 's' : ''}</span>
                    <span>•</span>
                    <span>
                      {kb.files.reduce((total, file) => total + file.size, 0) > 0
                        ? formatFileSize(kb.files.reduce((total, file) => total + file.size, 0))
                        : '0 Bytes'
                      }
                    </span>
                  </div>
                  {kb.files.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {kb.files.slice(0, 3).map((file) => (
                        <div key={file.id} className="flex items-center space-x-1 bg-gray-100 px-2 py-1 rounded text-xs">
                          <FileText className="h-3 w-3" />
                          <span className="truncate max-w-[100px]">{file.name}</span>
                        </div>
                      ))}
                      {kb.files.length > 3 && (
                        <div className="bg-gray-100 px-2 py-1 rounded text-xs">
                          +{kb.files.length - 3} more
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed border-2">
            <CardContent className="pt-6 text-center">
              <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No knowledge bases yet</h3>
              <p className="text-gray-500 mb-4">Create your first knowledge base to get started</p>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Knowledge Base
              </Button>
            </CardContent>
          </Card>
        )}
      </PlanLimitChecker>

      {/* Create/Edit Form Modal overlay could go here */}
      {/* For now, just show inline form when editing or creating */}
      {showCreateForm && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            {isEditing && (
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium">Editing: {knowledgeBaseName}</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelEdit}
                  className="flex items-center space-x-1"
                >
                  <X className="h-4 w-4" />
                  <span>Cancel</span>
                </Button>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="kbName">Knowledge Base Name</Label>
              <Input
                id="kbName"
                placeholder="e.g., Customer Support FAQs"
                value={knowledgeBaseName}
                onChange={(e) => setKnowledgeBaseName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="kbDescription">Description (Optional)</Label>
              <Textarea
                id="kbDescription"
                placeholder="Describe what this knowledge base contains..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Upload Files</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-2">
                  Drag and drop files here, or click to browse
                </p>
                <p className="text-xs text-gray-500 mb-4">
                  Supports PDF, DOC, DOCX, TXT (max 10MB each)
                </p>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                  disabled={isProcessing}
                />
                <Button variant="outline" asChild disabled={isProcessing}>
                  <label htmlFor="file-upload" className="cursor-pointer">
                    Choose Files
                  </label>
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-3">
                Files ({totalFiles})
              </h4>
              
              {totalFiles === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="pt-6 text-center">
                    <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No files uploaded yet</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {/* Existing Files */}
                  {existingFiles.map((file) => (
                    <Card key={file.id} className="p-3 bg-blue-50 border-blue-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="text-sm font-medium truncate max-w-[200px]">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(file.size)} • Existing
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeExistingFile(file.id)}
                          className="text-red-600 hover:text-red-700"
                          disabled={isProcessing}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}

                  {/* New Files */}
                  {uploadedFiles.map((file, index) => (
                    <Card key={index} className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="text-sm font-medium truncate max-w-[200px]">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(file.size)} • New
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeNewFile(index)}
                          className="text-red-600 hover:text-red-700"
                          disabled={isProcessing}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {isProcessing && (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-3 mb-3">
                    <Database className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">
                      {isEditing ? "Updating knowledge base..." : "Processing files..."}
                    </span>
                  </div>
                  <Progress value={uploadProgress} className="mb-2" />
                  <p className="text-sm text-gray-600">
                    {uploadProgress < 50 ? (isEditing ? "Updating knowledge base..." : "Creating knowledge base...") : 
                     uploadProgress < 90 ? "Processing files in GCP bucket..." : 
                     "Almost done!"}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {showCreateForm && (
        <div className="flex items-center justify-end pt-4">
          <Button
            onClick={isEditing ? handleUpdate : handleCreate}
            disabled={isProcessing || !knowledgeBaseName.trim()}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 flex items-center space-x-2"
          >
            <Database className="h-4 w-4" />
            <span>
              {isProcessing 
                ? (isEditing ? "Updating..." : "Processing...") 
                : (isEditing ? "Update Knowledge Base" : "Create Knowledge Base")
              }
            </span>
          </Button>
        </div>
      )}
    </div>
  );
};

export default KnowledgeBaseManager;