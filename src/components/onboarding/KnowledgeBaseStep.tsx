import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, Trash2, CheckCircle, Database, Edit3, X, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface KnowledgeBaseStepProps {
  onComplete: () => void;
  onSkip: () => void;
}

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

const KnowledgeBaseStep = ({ onComplete }: KnowledgeBaseStepProps) => {
  const [knowledgeBaseName, setKnowledgeBaseName] = useState("");
  const [description, setDescription] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [existingKnowledgeBase, setExistingKnowledgeBase] = useState<ExistingKnowledgeBase | null>(null);
  const [editingKB, setEditingKB] = useState<string | null>(null);
  const [existingFiles, setExistingFiles] = useState<ExistingFile[]>([]);
  const [filesToDelete, setFilesToDelete] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  // Load existing knowledge base (should be only one during onboarding)
  useEffect(() => {
    loadExistingKnowledgeBase();
  }, []);

  const loadExistingKnowledgeBase = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Get knowledge base entries (parent records) - limit to 1 for onboarding
      const { data: kbData, error: kbError } = await supabase
        .from('knowledge_base')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('file_type', 'knowledge_base')
        .order('created_at', { ascending: false })
        .limit(1);

      if (kbError) throw kbError;

      if (kbData && kbData.length > 0) {
        const kb = kbData[0];
        
        // Get associated files
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

        setExistingKnowledgeBase({
          id: kb.id,
          title: kb.title,
          content: kb.content,
          files: kbFiles
        });
      }
    } catch (error) {
      console.error('Error loading knowledge base:', error);
      toast({
        title: "Error",
        description: "Failed to load existing knowledge base.",
        variant: "destructive",
      });
    }
  };

  const handleEditKB = (kb: ExistingKnowledgeBase) => {
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

      // Add knowledgebase_id to the webhook data for each file
      if (result.knowledgeBase && result.uploadedFiles) {
        for (const file of result.uploadedFiles) {
          // The webhook is already sent by the edge function, but we could enhance it
          // to include the knowledgebase_id in the future if needed
          console.log(`File ${file.name} uploaded with knowledge base ID: ${result.knowledgeBase.id}`);
        }
      }

      toast({
        title: "Knowledge base created!",
        description: `Successfully processed ${uploadedFiles.length} files and stored them in GCP bucket.`,
      });

      // Reset form and reload data
      setKnowledgeBaseName("");
      setDescription("");
      setUploadedFiles([]);
      await loadExistingKnowledgeBase();

      setTimeout(() => {
        onComplete();
      }, 1000);

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
      await loadExistingKnowledgeBase();

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
  const hasExistingKB = existingKnowledgeBase !== null;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">
          {isEditing ? "Edit your knowledge base" : hasExistingKB ? "Your knowledge base" : "Create your knowledge base"}
        </h3>
        <p className="text-gray-600">
          {hasExistingKB 
            ? "During onboarding, you can create one knowledge base. After completing onboarding, you'll be able to create more knowledge bases based on your subscription plan."
            : "Upload documents and files that your chatbot will use to answer questions. Files will be stored securely in GCP bucket."
          }
        </p>
      </div>

      {/* Onboarding Limitation Notice */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-4">
          <div className="flex items-start space-x-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Onboarding Knowledge Base</h4>
              <p className="text-sm text-blue-700 mt-1">
                During onboarding, you can create and manage one knowledge base. Once you complete the onboarding process, 
                you'll be able to create additional knowledge bases based on your subscription plan.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Existing Knowledge Base Display */}
      {hasExistingKB && !isEditing && (
        <Card className="border border-gray-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">{existingKnowledgeBase.title}</CardTitle>
                {existingKnowledgeBase.content && (
                  <CardDescription className="mt-1">{existingKnowledgeBase.content}</CardDescription>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEditKB(existingKnowledgeBase)}
                className="flex items-center space-x-1"
              >
                <Edit3 className="h-4 w-4" />
                <span>Edit</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
              <span>{existingKnowledgeBase.files.length} file{existingKnowledgeBase.files.length !== 1 ? 's' : ''}</span>
              <span>•</span>
              <span>
                {existingKnowledgeBase.files.reduce((total, file) => total + file.size, 0) > 0
                  ? formatFileSize(existingKnowledgeBase.files.reduce((total, file) => total + file.size, 0))
                  : '0 Bytes'
                }
              </span>
            </div>
            {existingKnowledgeBase.files.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {existingKnowledgeBase.files.slice(0, 3).map((file) => (
                  <div key={file.id} className="flex items-center space-x-1 bg-gray-100 px-2 py-1 rounded text-xs">
                    <FileText className="h-3 w-3" />
                    <span className="truncate max-w-[100px]">{file.name}</span>
                  </div>
                ))}
                {existingKnowledgeBase.files.length > 3 && (
                  <div className="bg-gray-100 px-2 py-1 rounded text-xs">
                    +{existingKnowledgeBase.files.length - 3} more
                  </div>
                )}
              </div>
            )}
            <div className="mt-4">
              <Button
                onClick={onComplete}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 flex items-center space-x-2"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Continue with this Knowledge Base</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Form */}
      {(!hasExistingKB || isEditing) && (
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
                    <Card key={`${file.name}-${index}`} className="p-3">
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

      {(!hasExistingKB || isEditing) && (
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

export default KnowledgeBaseStep;
