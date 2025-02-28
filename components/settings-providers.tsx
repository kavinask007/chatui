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
import { Loader2, MoreVertical, Plus, Search } from "lucide-react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface Provider {
  id: string;
  name: string;
  description: string | null;
  configuration: Record<string, any>;
  createdAt: Date;
}

interface ProviderType {
  name: string;
  settings: Record<string, boolean>;
}

export function ProvidersEditor() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [providerTypes, setProviderTypes] = useState<ProviderType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [providerToDelete, setProviderToDelete] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [configuration, setConfiguration] = useState<Record<string, string>>(
    {}
  );

  useEffect(() => {
    Promise.all([fetchProviders(), fetchProviderTypes()]).finally(() =>
      setLoading(false)
    );
  }, []);

  const fetchProviders = async () => {
    try {
      const response = await fetch("/api/settings/providers", {
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

  const fetchProviderTypes = async () => {
    try {
      const response = await fetch("/api/settings/providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "getProviderTypes" }),
      });
      const data = await response.json();
      setProviderTypes(data.providers);
    } catch (error) {
      toast.error("Failed to fetch provider types");
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setConfiguration({});
  };

  const handleCreateProvider = async () => {
    try {
      setIsCreating(true);

      const response = await fetch("/api/settings/providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createProvider",
          name,
          description,
          configuration,
        }),
      });

      if (!response.ok) throw new Error("Failed to create provider");

      toast.success("Provider created successfully");
      resetForm();
      setIsDialogOpen(false);
      await fetchProviders();
    } catch (error) {
      toast.error("Failed to create provider");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteProvider = async (providerId: string) => {
    try {
      const response = await fetch("/api/settings/providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "deleteProvider",
          id: providerId,
        }),
      });

      if (!response.ok) throw new Error("Failed to delete provider");

      toast.success("Provider deleted successfully");
      setProviderToDelete(null);
      await fetchProviders();
    } catch (error) {
      toast.error("Failed to delete provider");
    }
  };

  const handleUpdateProvider = async (provider: Provider) => {
    try {
      const response = await fetch("/api/settings/providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateProvider",
          id: provider.id,
          description: provider.description,
          configuration: provider.configuration,
        }),
      });

      if (!response.ok) throw new Error("Failed to update provider");

      toast.success("Provider updated successfully");
      await fetchProviders();
    } catch (error) {
      toast.error("Failed to update provider");
    }
  };

  const handleProviderTypeChange = (selectedType: string) => {
    setName(selectedType);
    const providerType = providerTypes.find((p) => p.name === selectedType);
    if (providerType?.settings) {
      const initialConfig = Object.keys(providerType.settings).reduce(
        (acc, key) => ({ ...acc, [key]: "" }),
        {}
      );
      setConfiguration(initialConfig);
    }
  };

  const filteredProviders = providers?.filter(
    (provider) =>
      provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      provider.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <Loader2 className="h-4 w-4 animate-spin" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Providers</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Provider
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Provider</DialogTitle>
              <DialogDescription>
                Add a new provider configuration
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-[70vh] p-2">
              <div className="space-y-4 pr-4 p-2">
                <div className="space-y-2">
                  <Label htmlFor="type">Provider Type</Label>
                  <Select value={name} onValueChange={handleProviderTypeChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select provider type" />
                    </SelectTrigger>
                    <SelectContent>
                      {providerTypes.map((type) => (
                        <SelectItem key={type.name} value={type.name}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provider description"
                  />
                </div>

                {name &&
                  providerTypes.find((p) => p.name === name)?.settings && (
                    <div className="space-y-4">
                      <Label>Configuration</Label>
                      {Object.entries(
                        providerTypes.find((p) => p.name === name)!.settings
                      ).map(([key, required]) => (
                        <div key={key} className="space-y-2">
                          <Label htmlFor={key}>
                            {key}
                            {required && " *"}
                          </Label>
                          <Input
                            id={key}
                            type="password"
                            value={configuration[key] || ""}
                            onChange={(e) =>
                              setConfiguration((prev) => ({
                                ...prev,
                                [key]: e.target.value,
                              }))
                            }
                            placeholder={`Enter ${key}`}
                            required={required}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                <Button
                  className="w-full"
                  onClick={handleCreateProvider}
                  disabled={isCreating}
                >
                  {isCreating && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Provider
                </Button>
              </div>
              <ScrollBar />
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search providers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <ScrollArea className="h-[calc(100vh-20rem)]">
        <div className="space-y-4 pr-4">
          {filteredProviders.map((provider) => (
            <Card key={provider.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle>{provider.name}</CardTitle>
                  <CardDescription>{provider.description}</CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => handleUpdateProvider(provider)}
                    >
                      Edit configuration
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => setProviderToDelete(provider.id)}
                    >
                      Delete provider
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-2">
                  <p>
                    Created: {new Date(provider.createdAt).toLocaleDateString()}
                  </p>
                  {provider.configuration && (
                    <div>
                      <p className="font-medium">Configuration:</p>
                      {Object.keys(provider.configuration).map((key) => (
                        <p key={key}>{key}: ****</p>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <ScrollBar />
      </ScrollArea>

      <AlertDialog
        open={!!providerToDelete}
        onOpenChange={() => setProviderToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure? </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the provider and
              <strong> all associated models</strong>. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() =>
                providerToDelete && handleDeleteProvider(providerToDelete)
              }
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
