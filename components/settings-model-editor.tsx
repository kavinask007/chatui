"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Image,
  Loader2,
  MoreVertical,
  Plus,
  Search,
  Wrench,
  X,
  Edit,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Provider {
  id: string;
  name: string;
  baseUrl: string;
  description: string | null;
  createdAt: Date;
  configuration: {
    credentials: Record<string, any>;
  };
}

interface Model {
  id: string;
  name: string;
  providerId: string;
  modelId: string;
  description: string | null;
  createdAt: Date;
  groups: string[];
  supportsTools: boolean;
  supportsImages: boolean;
}

interface Group {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
}

export function ModelEditor() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [modelToEdit, setModelToEdit] = useState<Model | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [providerId, setProviderId] = useState("");
  const [modelId, setModelId] = useState("");
  const [description, setDescription] = useState("");
  const [supportsTools, setSupportsTools] = useState(false);
  const [supportsImages, setSupportsImages] = useState(false);

  useEffect(() => {
    Promise.all([fetchProviders(), fetchModels(), fetchGroups()]).finally(() =>
      setLoading(false)
    );
  }, []);

  const fetchProviders = async () => {
    try {
      const response = await fetch("/api/settings/model", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "listProviders" }),
      });
      const data = await response.json();
      setProviders(data.providers);
    } catch (error) {
      toast.error("Failed to fetch providers");
    }
  };

  const fetchModels = async () => {
    try {
      const response = await fetch("/api/settings/model", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "listModels" }),
      });
      const data = await response.json();
      setModels(data.models);
    } catch (error) {
      toast.error("Failed to fetch models");
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "listGroups" }),
      });
      const data = await response.json();
      setGroups(data.groups);
    } catch (error) {
      toast.error("Failed to fetch groups");
    }
  };

  const resetForm = () => {
    setName("");
    setProviderId("");
    setModelId("");
    setDescription("");
    setSupportsTools(false);
    setSupportsImages(false);
  };

  const handleCreateModel = async () => {
    try {
      setIsCreating(true);

      const response = await fetch("/api/settings/model", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createModel",
          name,
          providerId,
          modelId,
          description,
          supportsTools,
          supportsImages,
        }),
      });

      if (!response.ok) throw new Error("Failed to create model");

      toast.success("Model created successfully");
      resetForm();
      setIsDialogOpen(false);
      await fetchModels();
    } catch (error) {
      toast.error("Failed to create model");
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditModel = async () => {
    if (!modelToEdit) return;

    try {
      setIsEditing(true);

      const response = await fetch("/api/settings/model", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateModel",
          id: modelToEdit.id,
          name,
          modelId,
          description,
          supportsTools,
          supportsImages,
        }),
      });

      if (!response.ok) throw new Error("Failed to update model");

      toast.success("Model updated successfully");
      setIsEditDialogOpen(false);
      setModelToEdit(null);
      await fetchModels();
    } catch (error) {
      toast.error("Failed to update model");
    } finally {
      setIsEditing(false);
    }
  };

  const openEditDialog = (model: Model) => {
    setModelToEdit(model);
    setName(model.name);
    setModelId(model.modelId);
    setDescription(model.description || "");
    setSupportsTools(model.supportsTools);
    setSupportsImages(model.supportsImages);
    setIsEditDialogOpen(true);
  };

  const handleDeleteModel = async (modelId: string) => {
    try {
      const response = await fetch("/api/settings/model", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "removeModel",
          modelId,
        }),
      });

      if (!response.ok) throw new Error("Failed to delete model");

      toast.success("Model deleted successfully");
      await fetchModels();
    } catch (error) {
      toast.error("Failed to delete model");
    }
  };

  const handleAddModelToGroup = async (modelId: string, groupId: string) => {
    try {
      const response = await fetch("/api/settings/model", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "assignModelToGroup",
          modelId,
          groupId,
        }),
      });

      if (!response.ok) throw new Error("Failed to add model to group");

      toast.success("Model added to group successfully");
      await fetchModels();
    } catch (error) {
      toast.error("Failed to add model to group");
    }
  };

  const handleRemoveModelFromGroup = async (
    modelId: string,
    groupId: string
  ) => {
    try {
      const response = await fetch("/api/settings/model", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "removeModelFromGroup",
          modelId,
          groupId,
        }),
      });

      if (!response.ok) throw new Error("Failed to remove model from group");

      // Update models state to remove the group
      setModels((prevModels) =>
        prevModels.map((model) => {
          if (model.id === modelId) {
            return {
              ...model,
              groups: model.groups.filter((g) => g !== groupId),
            };
          }
          return model;
        })
      );

      toast.success("Model removed from group successfully");
    } catch (error) {
      toast.error("Failed to remove model from group");
    }
  };

  const filteredModels = models?.filter(
    (model) =>
      model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.modelId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <Loader2 className="h-4 w-4 animate-spin" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Models</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Model
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Model</DialogTitle>
              <DialogDescription>
                Add a new model configuration
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Model name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="provider">Provider</Label>
                <Select value={providerId} onValueChange={setProviderId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {providers.map((provider) => (
                      <SelectItem key={provider.id} value={provider.id}>
                        {provider.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="modelId">Model ID</Label>
                <Input
                  id="modelId"
                  value={modelId}
                  onChange={(e) => setModelId(e.target.value)}
                  placeholder="Model identifier"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Model description"
                />
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="supportsTools"
                    checked={supportsTools}
                    onChange={(e) => setSupportsTools(e.target.checked)}
                    className="mr-2"
                  />
                  <Label htmlFor="supportsTools">Supports Tools</Label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="supportsImages"
                    checked={supportsImages}
                    onChange={(e) => setSupportsImages(e.target.checked)}
                    className="mr-2"
                  />
                  <Label htmlFor="supportsImages">Supports Images</Label>
                </div>
              </div>

              <Button
                className="w-full"
                onClick={handleCreateModel}
                disabled={isCreating}
              >
                {isCreating && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Model
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search models..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="space-y-4">
        {filteredModels.map((model) => (
          <Card key={model.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <CardTitle>{model.name}</CardTitle>
                {model.supportsTools && <Wrench className="h-4 w-4" />}
                {model.supportsImages && <Image className="h-4 w-4" />}
                <CardDescription>{model.description}</CardDescription>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => openEditDialog(model)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit details
                  </DropdownMenuItem>
                  <Select
                    onValueChange={(groupId) =>
                      handleAddModelToGroup(model.id, groupId)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Add to group" />
                    </SelectTrigger>
                    <SelectContent>
                      {groups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <DropdownMenuItem
                    className="text-red-600"
                    onClick={() => handleDeleteModel(model.id)}
                  >
                    Delete model
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-2">
                <p>Provider ID: {model.providerId}</p>
                <p>Model ID: {model.modelId}</p>
                <p>Created: {new Date(model.createdAt).toLocaleDateString()}</p>
                <div>
                  <p className="font-medium">Groups:</p>
                  {model.groups.length > 0 ? (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {model.groups.map((groupId) => {
                        const group = groups.find((g) => g.id === groupId);
                        return (
                          <div
                            key={groupId}
                            className="bg-secondary px-2 py-1 rounded-md text-xs flex items-center gap-1"
                          >
                            <span>{group ? group.name : groupId}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                              onClick={() =>
                                handleRemoveModelFromGroup(model.id, groupId)
                              }
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-xs mt-1">
                      No groups assigned
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Model</DialogTitle>
            <DialogDescription>Update model details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Model name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-modelId">Model ID</Label>
              <Input
                id="edit-modelId"
                value={modelId}
                onChange={(e) => setModelId(e.target.value)}
                placeholder="Model identifier"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Model description"
              />
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="edit-supportsTools"
                  checked={supportsTools}
                  onChange={(e) => setSupportsTools(e.target.checked)}
                  className="mr-2"
                />
                <Label htmlFor="edit-supportsTools">Supports Tools</Label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="edit-supportsImages"
                  checked={supportsImages}
                  onChange={(e) => setSupportsImages(e.target.checked)}
                  className="mr-2"
                />
                <Label htmlFor="edit-supportsImages">Supports Images</Label>
              </div>
            </div>

            <Button
              className="w-full"
              onClick={handleEditModel}
              disabled={isEditing}
            >
              {isEditing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Model
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
