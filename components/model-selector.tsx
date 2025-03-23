"use client";

import {
  startTransition,
  useMemo,
  useOptimistic,
  useState,
  useRef,
  useEffect,
} from "react";

import { saveModelId } from "@/app/(chat)/actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

import { CheckCircleFillIcon, ChevronDownIcon } from "./icons";

export function ModelSelector({
  availablemodels,
  selectedModelId,
  className,
}: {
  availablemodels: any;
  selectedModelId: string;
} & React.ComponentProps<typeof Button>) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [optimisticModelId, setOptimisticModelId] =
    useOptimistic(selectedModelId);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedModel = useMemo(
    () => availablemodels?.find((model: any) => model.id === optimisticModelId),
    [optimisticModelId]
  );

  const filteredModels = useMemo(() => {
    if (!searchQuery) return availablemodels;
    return availablemodels?.filter(
      (model: any) =>
        model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        model.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [availablemodels, searchQuery]);

  useEffect(() => {
    setHighlightedIndex(0); // Reset highlight when search changes
  }, [searchQuery]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === "m") {
        e.preventDefault();
        setOpen((prev) => !prev);
        if (!open) {
          setTimeout(() => {
            searchInputRef.current?.focus();
          }, 0);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  // Focus input when dropdown opens
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 0);
    } else {
      setSearchQuery("");
      setHighlightedIndex(0);
    }
  }, [open]);

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (filteredModels?.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredModels.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === "Enter") {
        const selectedModel = filteredModels[highlightedIndex];
        setOpen(false);
        startTransition(() => {
          setOptimisticModelId(selectedModel.id);
          saveModelId(selectedModel.id);
        });
      }
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        asChild
        className={cn(
          "w-fit data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
          className
        )}
      >
        <Button variant="outline" className="md:px-2 md:h-[34px]">
          {selectedModel?.name || "No models"}
          <ChevronDownIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[300px]">
        <div className="relative p-2" onClick={(e) => e.stopPropagation()}>
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            placeholder="Search models..."
            value={searchQuery}
            onChange={(e) => {
              e.stopPropagation();
              setSearchQuery(e.target.value);
            }}
            className="pl-8"
            onKeyDown={handleSearchKeyDown}
          />
        </div>
        {filteredModels?.length > 0 ? (
          filteredModels.map((model: any, index: number) => (
            <DropdownMenuItem
              key={model.id}
              onSelect={() => {
                setOpen(false);
                startTransition(() => {
                  setOptimisticModelId(model.id);
                  saveModelId(model.id);
                });
              }}
              className={cn(
                "gap-4 group/item flex flex-row justify-between items-center",
                index === highlightedIndex && "bg-accent"
              )}
              data-active={model.id === optimisticModelId}
            >
              <div className="flex flex-col gap-1 items-start">
                {model.name}
                {model.description && (
                  <div className="text-xs text-muted-foreground">
                    {model.description}
                  </div>
                )}
              </div>
              <div className="text-foreground dark:text-foreground opacity-0 group-data-[active=true]/item:opacity-100">
                <CheckCircleFillIcon />
              </div>
            </DropdownMenuItem>
          ))
        ) : (
          <div className="p-4 text-center text-zinc-500">
            {availablemodels?.length
              ? "No matching models found"
              : "No models available. Please contact admin."}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
