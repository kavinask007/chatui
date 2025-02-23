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
import { Loader2, MoreVertical, Plus } from "lucide-react";
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
  DialogFooter,
} from "@/components/ui/dialog";

interface Tool {
  id: string;
  name: string;
  description: string | null;
  configuration: Record<string, any>;
  createdAt: Date;
  groups: string[];
}

interface Group {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
}

export function ToolEditor() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [configuration, setConfiguration] = useState<Record<string, any>>({});
  const [configText, setConfigText] = useState("{}"); // New state for configuration text

  useEffect(() => {
    Promise.all([fetchTools(), fetchGroups()]).finally(() =>
      setLoading(false)
    );
  }, []);

  const fetchTools = async () => {
    try {
      const response = await fetch("/api/settings/tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "listTools" }),
      });
      const data = await response.json();
      setTools(data.tools);
    } catch (error) {
      toast.error("Failed to fetch tools");
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

  const handleCreateTool = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Try to parse the configuration text before submitting
      let parsedConfig = {};
      try {
        parsedConfig = JSON.parse(configText);
      } catch (error) {
        toast.error("Invalid JSON configuration");
        return;
      }

      const response = await fetch("/api/settings/tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createTool",
          name,
          description,
          configuration: parsedConfig,
        }),
      });

      if (!response.ok) throw new Error("Failed to create tool");

      toast.success("Tool created successfully");
      setIsDialogOpen(false);
      setName("");
      setDescription("");
      setConfiguration({});
      setConfigText("{}");
      await fetchTools();
    } catch (error) {
      toast.error("Failed to create tool");
    }
  };

  const handleUpdateToolConfig = async (toolId: string, configuration: Record<string, any>) => {
    try {
      const response = await fetch("/api/settings/tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateToolConfig",
          toolId,
          configuration,
        }),
      });

      if (!response.ok) throw new Error("Failed to update tool configuration");

      toast.success("Tool configuration updated successfully");
      await fetchTools();
    } catch (error) {
      toast.error("Failed to update tool configuration");
    }
  };

  const handleAddToolToGroup = async (toolId: string, groupId: string) => {
    try {
      const response = await fetch("/api/settings/tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "assignToolToGroup",
          toolId,
          groupId,
        }),
      });

      if (!response.ok) throw new Error("Failed to add tool to group");

      toast.success("Tool added to group successfully");
      await fetchTools();
    } catch (error) {
      toast.error("Failed to add tool to group");
    }
  };

  const handleRemoveToolFromGroup = async (toolId: string, groupId: string) => {
    try {
      const response = await fetch("/api/settings/tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "removeToolFromGroup",
          toolId,
          groupId,
        }),
      });

      if (!response.ok) throw new Error("Failed to remove tool from group");

      toast.success("Tool removed from group successfully");
      await fetchTools();
    } catch (error) {
      toast.error("Failed to remove tool from group");
    }
  };

  if (loading) {
    return <Loader2 className="h-4 w-4 animate-spin" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Tools</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Tool
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreateTool}>
              <DialogHeader>
                <DialogTitle>Create Tool</DialogTitle>
                <DialogDescription>
                  Add a new tool configuration
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter tool name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter tool description"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="configuration">Configuration (JSON)</Label>
                  <Textarea
                    id="configuration"
                    value={configText}
                    onChange={(e) => setConfigText(e.target.value)}
                    placeholder="Enter JSON configuration"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Create Tool</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {tools?.map((tool) => (
          <Card key={tool.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>{tool.name}</CardTitle>
                <CardDescription>{tool.description}</CardDescription>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <Select onValueChange={(groupId) => handleAddToolToGroup(tool.id, groupId)}>
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
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-2">
                <p>Created: {new Date(tool.createdAt).toLocaleDateString()}</p>
                <div>
                  <p className="font-medium">Groups:</p>
                  {tool.groups.length > 0 ? (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {tool.groups.map((groupId) => {
                        const group = groups.find(g => g.id === groupId);
                        return (
                          <span
                            key={groupId}
                            className="bg-secondary px-2 py-1 rounded-md text-xs flex items-center gap-2"
                          >
                            {group?.name}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0"
                              onClick={() => handleRemoveToolFromGroup(tool.id, groupId)}
                            >
                              ×
                            </Button>
                          </span>
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
    </div>
  );
}
