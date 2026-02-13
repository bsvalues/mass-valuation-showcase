import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Edit, Trash2, FileText, ToggleLeft, ToggleRight } from "lucide-react";

type AppealCategory = "residential" | "commercial" | "land" | "industrial" | "agricultural";

interface Template {
  id: number;
  name: string;
  description: string | null;
  category: AppealCategory;
  defaultAppealReason: string | null;
  suggestedDocuments: string | null;
  estimatedProcessingDays: number | null;
  isActive: number;
  createdAt: Date;
}

export default function AppealTemplates() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<AppealCategory | "">("");
  
  // Form state
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCategory, setFormCategory] = useState<AppealCategory>("residential");
  const [formReason, setFormReason] = useState("");
  const [formDocs, setFormDocs] = useState("");
  const [formDays, setFormDays] = useState("");
  
  const { data: templates = [], refetch } = trpc.templates.list.useQuery({ 
    includeInactive: true,
    category: categoryFilter || undefined,
  });
  
  const createTemplate = trpc.templates.create.useMutation({
    onSuccess: () => {
      toast.success("Template created successfully");
      resetForm();
      setCreateDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to create template: ${error.message}`);
    },
  });
  
  const updateTemplate = trpc.templates.update.useMutation({
    onSuccess: () => {
      toast.success("Template updated successfully");
      resetForm();
      setEditDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to update template: ${error.message}`);
    },
  });
  
  const toggleActive = trpc.templates.toggleActive.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to toggle status: ${error.message}`);
    },
  });
  
  const deleteTemplate = trpc.templates.delete.useMutation({
    onSuccess: () => {
      toast.success("Template deleted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to delete template: ${error.message}`);
    },
  });
  
  const resetForm = () => {
    setFormName("");
    setFormDescription("");
    setFormCategory("residential");
    setFormReason("");
    setFormDocs("");
    setFormDays("");
    setSelectedTemplate(null);
  };
  
  const handleCreate = () => {
    if (!formName.trim()) {
      toast.error("Template name is required");
      return;
    }
    
    // Parse suggested documents as JSON array
    let docsJson = null;
    if (formDocs.trim()) {
      try {
        const lines = formDocs.split("\n").filter(l => l.trim());
        docsJson = JSON.stringify(lines);
      } catch (e) {
        toast.error("Invalid document format");
        return;
      }
    }
    
    createTemplate.mutate({
      name: formName.trim(),
      description: formDescription.trim() || undefined,
      category: formCategory,
      defaultAppealReason: formReason.trim() || undefined,
      suggestedDocuments: docsJson || undefined,
      estimatedProcessingDays: formDays ? parseInt(formDays) : undefined,
    });
  };
  
  const handleEdit = (template: Template) => {
    setSelectedTemplate(template);
    setFormName(template.name);
    setFormDescription(template.description || "");
    setFormCategory(template.category);
    setFormReason(template.defaultAppealReason || "");
    
    // Parse JSON docs back to lines
    if (template.suggestedDocuments) {
      try {
        const docs = JSON.parse(template.suggestedDocuments);
        setFormDocs(Array.isArray(docs) ? docs.join("\n") : "");
      } catch (e) {
        setFormDocs("");
      }
    } else {
      setFormDocs("");
    }
    
    setFormDays(template.estimatedProcessingDays?.toString() || "");
    setEditDialogOpen(true);
  };
  
  const handleUpdate = () => {
    if (!selectedTemplate) return;
    
    if (!formName.trim()) {
      toast.error("Template name is required");
      return;
    }
    
    let docsJson = null;
    if (formDocs.trim()) {
      try {
        const lines = formDocs.split("\n").filter(l => l.trim());
        docsJson = JSON.stringify(lines);
      } catch (e) {
        toast.error("Invalid document format");
        return;
      }
    }
    
    updateTemplate.mutate({
      id: selectedTemplate.id,
      name: formName.trim(),
      description: formDescription.trim() || undefined,
      category: formCategory,
      defaultAppealReason: formReason.trim() || undefined,
      suggestedDocuments: docsJson || undefined,
      estimatedProcessingDays: formDays ? parseInt(formDays) : undefined,
    });
  };
  
  const categoryConfig: Record<AppealCategory, { label: string; color: string }> = {
    residential: { label: "Residential", color: "bg-blue-100 text-blue-800" },
    commercial: { label: "Commercial", color: "bg-purple-100 text-purple-800" },
    land: { label: "Land", color: "bg-green-100 text-green-800" },
    industrial: { label: "Industrial", color: "bg-orange-100 text-orange-800" },
    agricultural: { label: "Agricultural", color: "bg-yellow-100 text-yellow-800" },
  };
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Appeal Templates</h1>
            <p className="text-muted-foreground mt-1">
              Manage pre-defined templates for common appeal creation scenarios
            </p>
          </div>
          <Button onClick={() => {
            resetForm();
            setCreateDialogOpen(true);
          }}>
            <Plus className="w-4 h-4 mr-2" />
            New Template
          </Button>
        </div>
        
        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Label>Category Filter:</Label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as AppealCategory | "")}
                className="px-3 py-2 border rounded-md text-sm bg-background"
              >
                <option value="">All Categories</option>
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
                <option value="land">Land</option>
                <option value="industrial">Industrial</option>
                <option value="agricultural">Agricultural</option>
              </select>
              <span className="text-sm text-muted-foreground">
                {templates.length} template{templates.length !== 1 ? 's' : ''}
              </span>
            </div>
          </CardContent>
        </Card>
        
        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <Card key={template.id} className={template.isActive ? "" : "opacity-60"}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={categoryConfig[template.category].color}>
                        {categoryConfig[template.category].label}
                      </Badge>
                      {template.isActive ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                          Inactive
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                {template.description && (
                  <CardDescription className="mt-2">{template.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {template.estimatedProcessingDays && (
                    <div className="flex items-center text-muted-foreground">
                      <FileText className="w-4 h-4 mr-2" />
                      Est. {template.estimatedProcessingDays} days
                    </div>
                  )}
                  {template.defaultAppealReason && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {template.defaultAppealReason}
                    </p>
                  )}
                </div>
                
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(template)}
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      toggleActive.mutate({
                        id: template.id,
                        isActive: template.isActive ? 0 : 1,
                      });
                    }}
                  >
                    {template.isActive ? (
                      <><ToggleLeft className="w-3 h-3 mr-1" />Deactivate</>
                    ) : (
                      <><ToggleRight className="w-3 h-3 mr-1" />Activate</>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (confirm(`Delete template "${template.name}"?`)) {
                        deleteTemplate.mutate({ id: template.id });
                      }
                    }}
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {templates.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No templates found. Create your first template to get started.</p>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Template</DialogTitle>
            <DialogDescription>
              Define a reusable template for common appeal scenarios
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">Template Name *</Label>
              <Input
                id="create-name"
                placeholder="e.g., Residential Overvaluation"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="create-description">Description</Label>
              <Textarea
                id="create-description"
                placeholder="Describe when to use this template..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={2}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="create-category">Category *</Label>
              <select
                id="create-category"
                className="w-full px-3 py-2 border rounded-md text-sm bg-background"
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value as AppealCategory)}
              >
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
                <option value="land">Land</option>
                <option value="industrial">Industrial</option>
                <option value="agricultural">Agricultural</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="create-reason">Default Appeal Reason</Label>
              <Textarea
                id="create-reason"
                placeholder="Pre-filled text that will appear in the appeal reason field..."
                value={formReason}
                onChange={(e) => setFormReason(e.target.value)}
                rows={4}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="create-docs">Suggested Documents (one per line)</Label>
              <Textarea
                id="create-docs"
                placeholder="Recent comparable sales data&#10;Independent appraisal report&#10;Photos of property condition"
                value={formDocs}
                onChange={(e) => setFormDocs(e.target.value)}
                rows={4}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="create-days">Estimated Processing Days</Label>
              <Input
                id="create-days"
                type="number"
                placeholder="e.g., 45"
                value={formDays}
                onChange={(e) => setFormDays(e.target.value)}
                min="1"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createTemplate.isPending}>
              {createTemplate.isPending ? "Creating..." : "Create Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
            <DialogDescription>
              Update template details and settings
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Template Name *</Label>
              <Input
                id="edit-name"
                placeholder="e.g., Residential Overvaluation"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                placeholder="Describe when to use this template..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={2}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-category">Category *</Label>
              <select
                id="edit-category"
                className="w-full px-3 py-2 border rounded-md text-sm bg-background"
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value as AppealCategory)}
              >
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
                <option value="land">Land</option>
                <option value="industrial">Industrial</option>
                <option value="agricultural">Agricultural</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-reason">Default Appeal Reason</Label>
              <Textarea
                id="edit-reason"
                placeholder="Pre-filled text that will appear in the appeal reason field..."
                value={formReason}
                onChange={(e) => setFormReason(e.target.value)}
                rows={4}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-docs">Suggested Documents (one per line)</Label>
              <Textarea
                id="edit-docs"
                placeholder="Recent comparable sales data&#10;Independent appraisal report&#10;Photos of property condition"
                value={formDocs}
                onChange={(e) => setFormDocs(e.target.value)}
                rows={4}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-days">Estimated Processing Days</Label>
              <Input
                id="edit-days"
                type="number"
                placeholder="e.g., 45"
                value={formDays}
                onChange={(e) => setFormDays(e.target.value)}
                min="1"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateTemplate.isPending}>
              {updateTemplate.isPending ? "Updating..." : "Update Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
