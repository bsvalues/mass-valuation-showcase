import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Eye, FileText } from "lucide-react";
import { toast } from "sonner";

const categoryLabels: Record<string, string> = {
  approved: "Approved",
  denied: "Denied",
  partially_approved: "Partially Approved",
  withdrawn: "Withdrawn",
};

const categoryColors: Record<string, string> = {
  approved: "bg-green-500/10 text-green-500 border-green-500/20",
  denied: "bg-red-500/10 text-red-500 border-red-500/20",
  partially_approved: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  withdrawn: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

export default function TemplateManagement() {
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);
  
  const { data: templates, isLoading, refetch } = (trpc as any).resolutionTemplates.list.useQuery({
    category: selectedCategory as any,
  });
  
  const createMutation = (trpc as any).resolutionTemplates.create.useMutation({
    onSuccess: () => {
      toast.success("Template created successfully");
      setIsCreateDialogOpen(false);
      refetch();
    },
    onError: (error: any) => {
      toast.error(`Failed to create template: ${error.message}`);
    },
  });
  
  const updateMutation = (trpc as any).resolutionTemplates.update.useMutation({
    onSuccess: () => {
      toast.success("Template updated successfully");
      setEditingTemplate(null);
      refetch();
    },
    onError: (error: any) => {
      toast.error(`Failed to update template: ${error.message}`);
    },
  });
  
  const deleteMutation = (trpc as any).resolutionTemplates.delete.useMutation({
    onSuccess: () => {
      toast.success("Template deleted successfully");
      refetch();
    },
    onError: (error: any) => {
      toast.error(`Failed to delete template: ${error.message}`);
    },
  });
  
  const handleCreate = (formData: FormData) => {
    const name = formData.get("name") as string;
    const category = formData.get("category") as any;
    const templateText = formData.get("templateText") as string;
    const variablesText = formData.get("variables") as string;
    
    const variables = variablesText
      ? variablesText.split(",").map(v => v.trim()).filter(Boolean)
      : [];
    
    createMutation.mutate({ name, category, templateText, variables });
  };
  
  const handleUpdate = (formData: FormData) => {
    const name = formData.get("name") as string;
    const category = formData.get("category") as any;
    const templateText = formData.get("templateText") as string;
    const variablesText = formData.get("variables") as string;
    
    const variables = variablesText
      ? variablesText.split(",").map(v => v.trim()).filter(Boolean)
      : [];
    
    updateMutation.mutate({
      id: editingTemplate.id,
      name,
      category,
      templateText,
      variables,
    });
  };
  
  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this template?")) {
      deleteMutation.mutate({ id });
    }
  };
  
  const renderPreview = (template: any) => {
    let preview = template.templateText;
    const variables = template.variables ? JSON.parse(template.variables) : [];
    
    // Replace variables with example values
    const exampleValues: Record<string, string> = {
      parcelId: "12-345-678",
      ownerName: "John Doe",
      currentValue: "$250,000",
      adjustedValue: "$225,000",
      hearingDate: "March 15, 2026",
      appealDate: "January 10, 2026",
    };
    
    variables.forEach((varName: string) => {
      const regex = new RegExp(`{{${varName}}}`, 'g');
      preview = preview.replace(regex, exampleValues[varName] || `[${varName}]`);
    });
    
    return preview;
  };
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Resolution Templates</h1>
            <p className="text-muted-foreground">
              Manage pre-written templates for common appeal outcomes
            </p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Resolution Template</DialogTitle>
                <DialogDescription>
                  Create a new template for standardized appeal resolutions
                </DialogDescription>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleCreate(new FormData(e.currentTarget));
                }}
                className="space-y-4"
              >
                <div>
                  <Label htmlFor="name">Template Name</Label>
                  <Input id="name" name="name" required placeholder="e.g., Standard Approval Letter" />
                </div>
                
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select name="category" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="denied">Denied</SelectItem>
                      <SelectItem value="partially_approved">Partially Approved</SelectItem>
                      <SelectItem value="withdrawn">Withdrawn</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="templateText">Template Text</Label>
                  <Textarea
                    id="templateText"
                    name="templateText"
                    required
                    rows={8}
                    placeholder="Dear {{ownerName}}, your appeal for parcel {{parcelId}} has been..."
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Use double curly braces for variables: {`{{parcelId}}, {{ownerName}}, {{currentValue}}, {{adjustedValue}}`}
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="variables">Variables (comma-separated)</Label>
                  <Input
                    id="variables"
                    name="variables"
                    placeholder="parcelId, ownerName, currentValue, adjustedValue"
                  />
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Creating..." : "Create Template"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button
                variant={selectedCategory === undefined ? "default" : "outline"}
                onClick={() => setSelectedCategory(undefined)}
              >
                All
              </Button>
              {Object.entries(categoryLabels).map(([key, label]) => (
                <Button
                  key={key}
                  variant={selectedCategory === key ? "default" : "outline"}
                  onClick={() => setSelectedCategory(key)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Templates List */}
        {isLoading ? (
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground">Loading templates...</p>
            </CardContent>
          </Card>
        ) : !templates || templates.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground">No templates found. Create your first template to get started.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((template: any) => (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        {template.name}
                      </CardTitle>
                      <Badge variant="outline" className={categoryColors[template.category]}>
                        {categoryLabels[template.category]}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setPreviewTemplate(template)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingTemplate(template)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(template.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {template.templateText}
                  </p>
                  {template.variables && JSON.parse(template.variables).length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {JSON.parse(template.variables).map((variable: string) => (
                        <Badge key={variable} variant="secondary" className="text-xs">
                          {`{{${variable}}}`}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        {/* Preview Dialog */}
        {previewTemplate && (
          <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Template Preview: {previewTemplate.name}</DialogTitle>
                <DialogDescription>
                  Variables replaced with example values
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm font-mono">
                    {renderPreview(previewTemplate)}
                  </pre>
                </div>
                <Button onClick={() => setPreviewTemplate(null)}>Close</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
        
        {/* Edit Dialog */}
        {editingTemplate && (
          <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit Template</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleUpdate(new FormData(e.currentTarget));
                }}
                className="space-y-4"
              >
                <div>
                  <Label htmlFor="edit-name">Template Name</Label>
                  <Input
                    id="edit-name"
                    name="name"
                    required
                    defaultValue={editingTemplate.name}
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-category">Category</Label>
                  <Select name="category" required defaultValue={editingTemplate.category}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="denied">Denied</SelectItem>
                      <SelectItem value="partially_approved">Partially Approved</SelectItem>
                      <SelectItem value="withdrawn">Withdrawn</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="edit-templateText">Template Text</Label>
                  <Textarea
                    id="edit-templateText"
                    name="templateText"
                    required
                    rows={8}
                    defaultValue={editingTemplate.templateText}
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-variables">Variables (comma-separated)</Label>
                  <Input
                    id="edit-variables"
                    name="variables"
                    defaultValue={
                      editingTemplate.variables
                        ? JSON.parse(editingTemplate.variables).join(", ")
                        : ""
                    }
                  />
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setEditingTemplate(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </DashboardLayout>
  );
}
