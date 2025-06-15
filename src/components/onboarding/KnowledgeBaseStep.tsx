
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, Trash2, CheckCircle, Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface KnowledgeBaseStepProps {
  onComplete: () => void;
  onSkip: () => void;
}

const KnowledgeBaseStep = ({ onComplete }: KnowledgeBaseStepProps) => {
  const [knowledgeBaseName, setKnowledgeBaseName] = useState("");
  const [description, setDescription] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

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

  const removeFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
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

    // Simulate file processing
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);

    setTimeout(() => {
      setIsProcessing(false);
      toast({
        title: "Knowledge base created!",
        description: `Successfully processed ${uploadedFiles.length} files.`,
      });
      onComplete();
    }, 2500);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Create your first knowledge base</h3>
        <p className="text-gray-600">
          Upload documents and files that your chatbot will use to answer questions.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
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
              />
              <Button variant="outline" asChild>
                <label htmlFor="file-upload" className="cursor-pointer">
                  Choose Files
                </label>
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-3">Uploaded Files ({uploadedFiles.length})</h4>
            {uploadedFiles.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="pt-6 text-center">
                  <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No files uploaded yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
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
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="text-red-600 hover:text-red-700"
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
                  <span className="font-medium">Processing files...</span>
                </div>
                <Progress value={uploadProgress} className="mb-2" />
                <p className="text-sm text-gray-600">
                  {uploadProgress < 100 ? "Analyzing and indexing content..." : "Almost done!"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end pt-4">
        <Button
          onClick={handleCreate}
          disabled={isProcessing}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 flex items-center space-x-2"
        >
          <Database className="h-4 w-4" />
          <span>{isProcessing ? "Processing..." : "Create Knowledge Base"}</span>
        </Button>
      </div>
    </div>
  );
};

export default KnowledgeBaseStep;
