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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ModelEditor } from "@/components/settings-model-editor";
import { ToolEditor } from "@/components/settings-tool";
import { GroupsEditor } from "@/components/settings-group-editor";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "next/navigation";

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

interface InvitedUser {
  email: string;
}

interface Model {
  id: string;
  name: string;
  provider: string;
  apiIdentifier: string;
  description: string | null;
  createdAt: Date;
  groups: string[];
}

export function SettingsComponent({ isAdmin }: { isAdmin: boolean }) {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [invitedUsers, setInvitedUsers] = useState<InvitedUser[]>([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [isInviting, setIsInviting] = useState(false);
  const [activeSection, setActiveSection] = useState("users");

  useEffect(() => {
    Promise.all([fetchUsers(), fetchGroups(), fetchInvitedUsers()]).finally(
      () => setLoading(false)
    );
  }, []);

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

  const fetchInvitedUsers = async () => {
    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "listInvitedUsers" }),
      });
      const data = await response.json();
      setInvitedUsers(data.invitedUsers);
    } catch (error) {
      toast.error("Failed to fetch invited users");
    }
  };

  const handleAddToInviteList = async () => {
    try {
      setIsInviting(true);
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "addToInviteList", email }),
      });

      if (!response.ok) throw new Error("Failed to add user to invite list");
      toast.success("User added to invite list");
      setEmail("");
      await fetchInvitedUsers();
    } catch (error) {
      toast.error("Failed to add user to invite list");
    } finally {
      setIsInviting(false);
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
          role: "member", // Default role
        }),
      });

      if (!response.ok) throw new Error("Failed to add user to group");
      toast.success("User added to group");

      // Update all data to reflect changes
      await Promise.all([fetchUsers(), fetchGroups()]);
    } catch (error) {
      toast.error("Failed to add user to group");
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-lg text-muted-foreground">
          You need admin privileges to access settings
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-[1200px] mx-auto px-4 py-8">
        <div className="flex gap-12">
          {/* Sidebar Navigation */}
          <div className="w-64 shrink-0">
            <nav className="space-y-2 sticky top-8">
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
                onClick={() => router.push("/")}
              >
                <ArrowLeft className="h-4 w-4" />
             Back to Home  
              </Button>
              
              <div className="space-y-1">
                <Button
                  variant={activeSection === "users" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveSection("users")}
                >
                  Users
                </Button>
                <Button
                  variant={activeSection === "groups" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveSection("groups")}
                >
                  Groups
                </Button>
                <Button
                  variant={activeSection === "models" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveSection("models")}
                >
                  Models
                </Button>
                <Button
                  variant={activeSection === "tools" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveSection("tools")}
                >
                  Tools
                </Button>
                <Button
                  variant={activeSection === "invites" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveSection("invites")}
                >
                  Invites
                </Button>
              </div>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {activeSection === "users" && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">
                    User Management
                  </h1>
                  <p className="text-muted-foreground">
                    View and manage system users
                  </p>
                </div>
                <Separator />
                <Card>
                  <CardContent className="p-6">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Groups</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">
                              {user.name}
                            </TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              {user.isAdmin ? "Admin" : "User"}
                            </TableCell>
                            <TableCell>
                              {user.groups.length > 0
                                ? user.groups
                                    .map(
                                      (groupId) =>
                                        groups.find((g) => g.id === groupId)
                                          ?.name
                                    )
                                    .join(", ")
                                : "None"}
                            </TableCell>
                            <TableCell>
                              {!user.isAdmin && (
                                <Select
                                  onValueChange={(groupId) =>
                                    handleAddUserToGroup(user.id, groupId)
                                  }
                                >
                                  <SelectTrigger className="w-40">
                                    <SelectValue placeholder="Add to group" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {groups.map((group) => (
                                      <SelectItem
                                        key={group.id}
                                        value={group.id}
                                      >
                                        {group.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeSection === "groups" && <GroupsEditor />}

            {activeSection === "models" && <ModelEditor />}

            {activeSection === "tools" && <ToolEditor />}

            {activeSection === "invites" && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Invites</h1>
                  <p className="text-muted-foreground">
                    Manage user invitations
                  </p>
                </div>
                <Separator />
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Invite Users</CardTitle>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button>New Invite</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add to Invite List</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="email">Email</Label>
                              <Input
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="user@example.com"
                              />
                            </div>
                            <Button
                              className="w-full"
                              onClick={handleAddToInviteList}
                              disabled={isInviting}
                            >
                              {isInviting && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              )}
                              Send Invite
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Email</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invitedUsers.map((user) => (
                          <TableRow key={user.email}>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              {users.some(u => u.email === user.email) ? "Joined" : "Pending"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
