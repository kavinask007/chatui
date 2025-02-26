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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, Trash2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface User {
  id: string;
  name: string | null;
  email: string | null;
  isAdmin: boolean;
  image: string | null;
  groups: string[];
  role?: string;
}

interface Group {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
}

interface Model {
  id: string;
  name: string;
  providerId: string;
  modelId: string;
  description: string | null;
  createdAt: Date;
  groups: string[];
}

interface Tool {
  id: string;
  name: string;
  description: string | null;
  configuration: any;
  createdAt: Date;
  groups: string[];
}

export function GroupsEditor() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groupUsers, setGroupUsers] = useState<User[]>([]);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await Promise.all([fetchUsers(), fetchGroups(), fetchModels(), fetchTools()]);
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      fetchGroupUsers(selectedGroup.id);
    }
  }, [selectedGroup]);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "listUsers" }),
      });
      const data = await response.json();
      setUsers(data.users);
    } catch (error) {
      toast.error("Failed to fetch users");
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        body: JSON.stringify({ action: "listGroups" }),
      });
      const data = await response.json();
      setGroups(data.groups);
    } catch (error) {
      toast.error("Failed to fetch groups");
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

  const fetchGroupUsers = async (groupId: string) => {
    try {
      const response = await fetch(`/api/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "listGroupUsers",
          groupId 
        }),
      });
      const data = await response.json();
      setGroupUsers(data.users);
    } catch (error) {
      toast.error("Failed to fetch group users");
    }
  };

  const handleCreateGroup = async () => {
    try {
      setIsCreatingGroup(true);
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createGroup",
          name: groupName,
          description: groupDescription,
        }),
      });

      if (!response.ok) throw new Error("Failed to create group");
      toast.success("Group created successfully");
      setGroupName("");
      setGroupDescription("");
      await fetchGroups();
    } catch (error) {
      toast.error("Failed to create group");
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const handleDeleteGroup = async (group: Group) => {
    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "removeGroup",
          groupId: group.id,
        }),
      });

      if (!response.ok) throw new Error("Failed to delete group");
      toast.success("Group deleted successfully");
      await fetchGroups();
      setGroupToDelete(null);
    } catch (error) {
      toast.error("Failed to delete group");
    }
  };

  const handleRemoveUserFromGroup = async (userId: string, groupId: string) => {
    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "removeUserFromGroup",
          userId,
          groupId,
        }),
      });

      if (!response.ok) throw new Error("Failed to remove user from group");
      toast.success("User removed from group");
      await Promise.all([fetchUsers(), fetchGroups()]);
      if (selectedGroup) {
        fetchGroupUsers(selectedGroup.id);
      }
    } catch (error) {
      toast.error("Failed to remove user from group");
    }
  };

  const handleAddUserToGroup = async (userId: string, groupId: string) => {
    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "addUserToGroup",
          userId,
          groupId,
        }),
      });

      if (!response.ok) throw new Error("Failed to add user to group");
      toast.success("User added to group");
      await Promise.all([fetchUsers(), fetchGroups()]);
      if (selectedGroup) {
        fetchGroupUsers(selectedGroup.id);
      }
    } catch (error) {
      toast.error("Failed to add user to group");
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
      toast.success("Model added to group");
      await fetchModels();
    } catch (error) {
      toast.error("Failed to add model to group");
    }
  };

  const handleRemoveModelFromGroup = async (modelId: string, groupId: string) => {
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
      toast.success("Model removed from group");
      await fetchModels();
    } catch (error) {
      toast.error("Failed to remove model from group");
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
      toast.success("Tool added to group");
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
      
      // Update tools state to remove only the specific tool from the group
      setTools(prevTools => prevTools.map(tool => {
        if (tool.id === toolId) {
          return {
            ...tool,
            groups: tool.groups.filter(g => g !== groupId)
          };
        }
        return tool;
      }));
      
      toast.success("Tool removed from group");
    } catch (error) {
      toast.error("Failed to remove tool from group");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!selectedGroup ? (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Groups</h1>
              <p className="text-muted-foreground">
                Manage user groups and permissions
              </p>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button>Create New Group</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Group</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="groupName">Group Name</Label>
                    <Input
                      id="groupName"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      placeholder="Group name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="groupDescription">Description</Label>
                    <Textarea
                      id="groupDescription"
                      value={groupDescription}
                      onChange={(e) => setGroupDescription(e.target.value)}
                      placeholder="Group description"
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleCreateGroup}
                    disabled={isCreatingGroup}
                  >
                    {isCreatingGroup && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Create Group
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <Separator />
          <ScrollArea className="h-[600px]">
            <div className="grid gap-6 pr-4">
              {groups.map((group) => (
                <Card key={group.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div 
                        className="cursor-pointer hover:text-primary transition-colors"
                        onClick={() => setSelectedGroup(group)}
                      >
                        <CardTitle>{group.name}</CardTitle>
                        <CardDescription>{group.description}</CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setGroupToDelete(group);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        Created {new Date(group.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {users.filter((u) => u.groups.includes(group.id)).length}{" "}
                        members
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>

          <Dialog open={!!groupToDelete} onOpenChange={() => setGroupToDelete(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Group</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete the group {groupToDelete?.name}? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setGroupToDelete(null)}>
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => groupToDelete && handleDeleteGroup(groupToDelete)}
                >
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Button 
                variant="ghost" 
                onClick={() => setSelectedGroup(null)}
                className="mb-4"
              >
                ← Back to Groups
              </Button>
              <h1 className="text-3xl font-bold tracking-tight">{selectedGroup.name}</h1>
              <p className="text-muted-foreground">{selectedGroup.description}</p>
            </div>
          </div>
          <Separator />
          <Tabs defaultValue="users">
            <TabsList>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="models">Models</TabsTrigger>
              <TabsTrigger value="tools">Tools</TabsTrigger>
            </TabsList>
            <TabsContent value="users" className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Users</h2>
                <Select onValueChange={(userId) => handleAddUserToGroup(userId, selectedGroup.id)}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Add user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users
                      .filter(u => !u.groups.includes(selectedGroup.id))
                      .map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name || user.email}
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.role || "Member"}</TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() =>
                            handleRemoveUserFromGroup(user.id, selectedGroup.id)
                          }
                        >
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
            <TabsContent value="models" className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Models</h2>
                <Select onValueChange={(modelId) => handleAddModelToGroup(modelId, selectedGroup.id)}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Add model" />
                  </SelectTrigger>
                  <SelectContent>
                    {models
                      .filter(m => !m.groups.includes(selectedGroup.id))
                      .map(model => (
                        <SelectItem key={model.id} value={model.id}>
                          {model.name}
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-4">
                {models
                  .filter(m => m.groups.includes(selectedGroup.id))
                  .map(model => (
                    <Card key={model.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle>{model.name}</CardTitle>
                            <CardDescription>{model.description}</CardDescription>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRemoveModelFromGroup(model.id, selectedGroup.id)}
                          >
                            Remove
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          Provider ID: {model.providerId}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Model ID: {model.modelId}
                        </p>
                      </CardContent>
                    </Card>
                  ))
                }
              </div>
            </TabsContent>
            <TabsContent value="tools" className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Tools</h2>
                <Select onValueChange={(toolId) => handleAddToolToGroup(toolId, selectedGroup.id)}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Add tool" />
                  </SelectTrigger>
                  <SelectContent>
                    {tools
                      .filter(t => !t.groups.includes(selectedGroup.id))
                      .map(tool => (
                        <SelectItem key={tool.id} value={tool.id}>
                          {tool.name}
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-4">
                {tools
                  .filter(t => t.groups.includes(selectedGroup.id))
                  .map(tool => (
                    <Card key={tool.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle>{tool.name}</CardTitle>
                            <CardDescription>{tool.description}</CardDescription>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRemoveToolFromGroup(tool.id, selectedGroup.id)}
                          >
                            Remove
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          Created: {new Date(tool.createdAt).toLocaleDateString()}
                        </p>
                      </CardContent>
                    </Card>
                  ))
                }
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}