"use client";

import type {
  Attachment,
  ChatRequestOptions,
  CreateMessage,
  Message,
} from "ai";
import cx from "classnames";
import React from "react";
import {
  useRef,
  useEffect,
  useState,
  useCallback,
  type Dispatch,
  type SetStateAction,
  type ChangeEvent,
  memo,
} from "react";
import { toast } from "sonner";
import { useLocalStorage, useWindowSize } from "usehooks-ts";

import { sanitizeUIMessages } from "@/lib/utils";

import { ArrowUpIcon, PaperclipIcon, StopIcon } from "./icons";
import { CheckIcon, CrossCircledIcon } from "@radix-ui/react-icons";
import { WrenchIcon } from "lucide-react";
import { PreviewAttachment } from "./preview-attachment";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { SuggestedActions } from "./suggested-actions";
import equal from "fast-deep-equal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Separator } from "./ui/separator";
import { Skeleton } from "./ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "./ui/tooltip";

interface Tool {
  id: string;
  name: string;
  description: string | null;
}

interface ModelConfig {
  supportsTools: boolean;
  supportsImages: boolean;
}

interface CachedModel {
  id: string;
  config: ModelConfig;
}

interface CachedTools {
  tools: Tool[];
  timestamp: number;
}

// Cache duration in milliseconds (e.g., 1 hour)
const CACHE_DURATION = 60 * 60 * 1000;

// In-memory cache
const modelConfigCache = new Map<string, CachedModel>();
let toolsCache: CachedTools | null = null;

function PureMultimodalInput({
  chatId,
  input,
  setInput,
  isLoading,
  stop,
  attachments,
  setAttachments,
  messages,
  setMessages,
  append,
  handleSubmit,
  className,
  selectedModelId
}: {
  chatId: string;
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  stop: () => void;
  attachments: Array<Attachment>;
  setAttachments: Dispatch<SetStateAction<Array<Attachment>>>;
  messages: Array<Message>;
  setMessages: Dispatch<SetStateAction<Array<Message>>>;
  append: (
    message: Message | CreateMessage,
    chatRequestOptions?: ChatRequestOptions
  ) => Promise<string | null | undefined>;
  handleSubmit: (
    event?: {
      preventDefault?: () => void;
    },
    chatRequestOptions?: ChatRequestOptions
  ) => void;
  className?: string;
  selectedModelId: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { width } = useWindowSize();
  const [tools, setTools] = useState<Tool[]>([]);
  const [isToolsLoading, setIsToolsLoading] = useState(true);
  const [selectedTools, setSelectedTools] = useLocalStorage<string[]>(
    "selected-tools",
    []
  );
  const [isToolDialogOpen, setIsToolDialogOpen] = useState(false);
  const [modelConfig, setModelConfig] = useState<ModelConfig>({
    supportsTools: false,
    supportsImages: false
  });

  useEffect(() => {
    const fetchModelConfig = async () => {
      // Check cache first
      const cachedConfig = modelConfigCache.get(selectedModelId);
      if (cachedConfig) {
        setModelConfig(cachedConfig.config);
        return;
      }

      try {
        const response = await fetch("/api/settings/model", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            action: "getUserModels"
          }),
        });
        const data = await response.json();
        const model = data.models.find((m: any) => m.id === selectedModelId);
        if (model) {
          const config = {
            supportsTools: model.supportsTools,
            supportsImages: model.supportsImages
          };
          // Update cache
          modelConfigCache.set(selectedModelId, {
            id: selectedModelId,
            config
          });
          setModelConfig(config);
        }
      } catch (error) {
        console.error("Failed to fetch model config:", error);
      }
    };

    if (selectedModelId) {
      fetchModelConfig();
    }
  }, [selectedModelId]);

  useEffect(() => {
    const fetchTools = async () => {
      setIsToolsLoading(true);
      
      // Check cache first
      if (toolsCache && (Date.now() - toolsCache.timestamp) < CACHE_DURATION) {
        setTools(toolsCache.tools);
        setIsToolsLoading(false);
        
        // Update selected tools with cached data
        const availableToolIds = new Set(toolsCache.tools.map(t => t.id));
        setSelectedTools(prev => prev.filter(toolId => availableToolIds.has(toolId)));
        return;
      }

      try {
        const response = await fetch("/api/settings/tools", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "listUserTools" }),
        });
        const data = await response.json();
        
        // Update cache
        toolsCache = {
          tools: data.tools,
          timestamp: Date.now()
        };
        
        setTools(data.tools);

        // Get available tool IDs from server response
        const availableToolIds = new Set(data.tools.map((t: Tool) => t.id));

        // Filter selected tools from localStorage to only keep valid ones
        setSelectedTools((prev) => {
          const validSelectedTools = prev.filter((toolId) =>
            availableToolIds.has(toolId)
          );
          return validSelectedTools;
        });
      } catch (error) {
        console.error("Failed to fetch tools:", error);
      } finally {
        setIsToolsLoading(false);
      }
    };

    if (modelConfig.supportsTools) {
      fetchTools();
    }
  }, [modelConfig.supportsTools]); 

  useEffect(() => {
    if (textareaRef.current) {
      adjustHeight();
    }
  }, [input, isLoading]);

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${
        textareaRef.current.scrollHeight + 2
      }px`;
    }
  };

  const [localStorageInput, setLocalStorageInput] = useLocalStorage(
    "input",
    ""
  );

  useEffect(() => {
    if (textareaRef.current) {
      const domValue = textareaRef.current.value;
      // Prefer DOM value over localStorage to handle hydration
      const finalValue = domValue || localStorageInput || "";
      setInput(finalValue);
      adjustHeight();
    }
    // Only run once after hydration
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setLocalStorageInput(input);
  }, [input, setLocalStorageInput]);

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
    adjustHeight();
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadQueue, setUploadQueue] = useState<Array<string>>([]);

  const submitForm = useCallback(() => {
    if (input == "") {
      return;
    }
    window.history.replaceState({}, "", `/chat/${chatId}`);

    append(
      {
        role: "user",
        content: input,
      },
      {
        experimental_attachments: modelConfig.supportsImages ? attachments : [],
        body: { tools_selected: modelConfig.supportsTools ? selectedTools : [] },
      }
    );

    setInput("");
    setAttachments([]);
    setLocalStorageInput("");

    if (width && width > 768) {
      textareaRef.current?.focus();
    }
    adjustHeight();
  }, [
    input,
    attachments,
    append,
    setInput,
    setAttachments,
    setLocalStorageInput,
    width,
    chatId,
    selectedTools,
    modelConfig,
  ]);

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const { url, pathname, contentType } = data;

        return {
          url,
          name: pathname,
          contentType: contentType,
        };
      }
      const { error } = await response.json();
      toast.error(error);
    } catch (error) {
      toast.error("Failed to upload file, please try again!");
    }
  };

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);

      setUploadQueue(files.map((file) => file.name));

      try {
        const uploadPromises = files.map((file) => uploadFile(file));
        const uploadedAttachments = await Promise.all(uploadPromises);
        const successfullyUploadedAttachments = uploadedAttachments.filter(
          (attachment) => attachment !== undefined
        );

        setAttachments((currentAttachments) => [
          ...currentAttachments,
          ...successfullyUploadedAttachments,
        ]);
      } catch (error) {
        console.error("Error uploading files!", error);
      } finally {
        setUploadQueue([]);
      }
    },
    [setAttachments]
  );

  const handleToolToggle = (toolId: string) => {
    setSelectedTools((prev) => {
      if (prev.includes(toolId)) {
        return prev.filter((id) => id !== toolId);
      }
      return [...prev, toolId];
    });
  };

  const handleSelectAllTools = () => {
    setSelectedTools(tools.map(tool => tool.id));
  };

  const handleDeselectAllTools = () => {
    setSelectedTools([]);
  };

  return (
    <div className="relative w-full flex flex-col gap-4">
      {messages.length === 0 &&
        attachments.length === 0 &&
        uploadQueue.length === 0 && (
          <SuggestedActions
            append={append}
            chatId={chatId}
            selectedTools={selectedTools}
          />
        )}

      <input
        type="file"
        className="fixed -top-4 -left-4 size-0.5 opacity-0 pointer-events-none"
        ref={fileInputRef}
        multiple
        onChange={handleFileChange}
        tabIndex={-1}
      />

      {(attachments.length > 0 || uploadQueue.length > 0) && (
        <div className="flex flex-row gap-2 overflow-x-scroll items-end">
          {attachments.map((attachment) => (
            <PreviewAttachment key={attachment.url} attachment={attachment} />
          ))}

          {uploadQueue.map((filename) => (
            <PreviewAttachment
              key={filename}
              attachment={{
                url: "",
                name: filename,
                contentType: "",
              }}
              isUploading={true}
            />
          ))}
        </div>
      )}

      <Textarea
        ref={textareaRef}
        placeholder="Send a message.."
        value={input}
        onChange={handleInput}
        className={cx(
          "min-h-[24px] max-h-[calc(75dvh)] overflow-hidden resize-none rounded-2xl !text-base bg-muted pb-10 dark:border-zinc-700",
          className
        )}
        rows={2}
        autoFocus
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();

            if (isLoading) {
              toast.error("Please wait for the model to finish its response!");
            } else {
              submitForm();
            }
          }
        }}
      />

      <div className="absolute bottom-0 p-2 w-fit flex flex-row justify-start gap-2">
        {modelConfig.supportsImages && (
          <AttachmentsButton fileInputRef={fileInputRef} isLoading={isLoading} />
        )}

        {modelConfig.supportsTools && (
          <DropdownMenu
            open={isToolDialogOpen}
            onOpenChange={setIsToolDialogOpen}
          >
            <DropdownMenuTrigger asChild>
              <Button
                className={cx(
                  "rounded-full p-[7px] h-fit dark:border-zinc-700 hover:dark:bg-zinc-900 hover:bg-zinc-200",
                  selectedTools.length > 0 && "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
                variant="ghost"
                disabled={isLoading}
              >
                <WrenchIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-[280px] max-h-[300px] overflow-y-auto rounded-xl"
            >
              <div className="p-2 font-medium text-center border-b text-secondary-foreground flex justify-between items-center">
                <span>Tools</span>
                <div className="flex gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleSelectAllTools}
                        className="h-6 w-6"
                      >
                        <CheckIcon className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Select all tools</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleDeselectAllTools}
                        className="h-6 w-6"
                      >
                        <CrossCircledIcon className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Deselect all tools</TooltipContent>
                  </Tooltip>
                </div>
              </div>
              {isToolsLoading ? (
                <div className="flex flex-col gap-2 p-4">
                  <Skeleton className="h-[20px] w-full rounded-xl" />
                  <Skeleton className="h-[20px] w-full rounded-xl" />
                  <Skeleton className="h-[20px] w-full rounded-xl" />
                </div>
              ) : tools.length > 0 ? (
                <div className="grid grid-cols-1 gap-2 p-2">
                  {tools?.map((tool, index) => (
                    <React.Fragment key={tool.id}>
                      <div
                        className={cx(
                          "px-2 py-1 rounded-md cursor-pointer transition-colors flex flex-row items-center justify-between overflow-hidden",
                          Array.isArray(selectedTools) &&
                            selectedTools.includes(tool.id)
                            ? "bg-primary hover:bg-primary/70 text-primary-foreground"
                            : "hover:bg-primary/20 dark:hover:bg-zinc-800 text-secondary-foreground"
                        )}
                        onClick={() => handleToolToggle(tool.id)}
                      >
                        <div className="font-medium truncate">{tool.name}</div>
                        {Array.isArray(selectedTools) && selectedTools.includes(tool.id) && (
                          <CheckIcon className="h-4 w-4 flex-shrink-0" />
                        )}
                      </div>
                      {index < tools.length - 1 && <Separator className="my-1" />}
                    </React.Fragment>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-zinc-500">
                  No tools available. Please contact admin.
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="absolute bottom-0 right-0 p-2 w-fit flex flex-row justify-end">
        {isLoading ? (
          <StopButton stop={stop} setMessages={setMessages} />
        ) : (
          <SendButton
            input={input}
            submitForm={submitForm}
            uploadQueue={uploadQueue}
            selectedModelId={selectedModelId}
          />
        )}
      </div>
    </div>
  );
}

export const MultimodalInput = memo(
  PureMultimodalInput,
  (prevProps, nextProps) => {
    if (prevProps.input !== nextProps.input) return false;
    if (prevProps.isLoading !== nextProps.isLoading) return false;
    if (!equal(prevProps.attachments, nextProps.attachments)) return false;

    return true;
  }
);

function PureAttachmentsButton({
  fileInputRef,
  isLoading,
}: {
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
  isLoading: boolean;
}) {
  return (
    <Button
      className="rounded-full p-[7px] h-fit dark:border-zinc-700 hover:dark:bg-zinc-900 hover:bg-zinc-200"
      onClick={(event) => {
        event.preventDefault();
        fileInputRef.current?.click();
      }}
      disabled={isLoading}
      variant="ghost"
    >
      <PaperclipIcon size={14} />
    </Button>
  );
}

const AttachmentsButton = memo(PureAttachmentsButton);

function PureStopButton({
  stop,
  setMessages,
}: {
  stop: () => void;
  setMessages: Dispatch<SetStateAction<Array<Message>>>;
}) {
  return (
    <Button
      className="rounded-full p-1.5 h-fit border dark:border-zinc-600"
      onClick={(event) => {
        event.preventDefault();
        stop();
        setMessages((messages) => sanitizeUIMessages(messages));
      }}
    >
      <StopIcon size={14} />
    </Button>
  );
}

const StopButton = memo(PureStopButton);

function PureSendButton({
  submitForm,
  input,
  uploadQueue,
  selectedModelId
}: {
  submitForm: () => void;
  input: string;
  uploadQueue: Array<string>;
  selectedModelId: string;
}) {
  return (
    <Button
      className="rounded-full p-1.5 h-fit border dark:border-zinc-600"
      onClick={(event) => {
        event.preventDefault();
        submitForm();
      }}
      disabled={input.length === 0 || uploadQueue.length > 0}
    >
      <ArrowUpIcon size={14} />
    </Button>
  );
}

const SendButton = memo(PureSendButton, (prevProps, nextProps) => {
  if (prevProps.uploadQueue.length !== nextProps.uploadQueue.length)
    return false;
  if (prevProps.input !== nextProps.input) return false;
  if (prevProps.selectedModelId !== nextProps.selectedModelId) return false;
  return true;
});
