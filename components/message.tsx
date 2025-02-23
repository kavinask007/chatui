"use client";

import type { ChatRequestOptions, Message } from "ai";
import cx from "classnames";
import { AnimatePresence, motion } from "framer-motion";
import { memo, useEffect, useMemo, useState } from "react";

import type { Vote } from "@/lib/db/schema";

import { DocumentToolCall, DocumentToolResult } from "./document";
import { PencilEditIcon, SparklesIcon } from "./icons";
import { Markdown } from "./markdown";
import { MessageActions } from "./message-actions";
import { PreviewAttachment } from "./preview-attachment";
import { Weather } from "./weather";
import equal from "fast-deep-equal";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { MessageEditor } from "./message-editor";
import { DocumentPreview } from "./document-preview";

const ToolDisplay = ({
  toolInvocation,
  isReadonly,
  expandedTools,
  setExpandedTools,
}: {
  toolInvocation: any;
  isReadonly: boolean;
  expandedTools: Record<string, boolean>;
  setExpandedTools: (value: Record<string, boolean>) => void;
}) => {
  const { toolName, toolCallId, state, args } = toolInvocation;

  if (state === "result") {
    const { result } = toolInvocation;

    if (toolName === "getWeather") {
      return <Weather key={toolCallId} weatherAtLocation={result} />;
    } else if (toolName === "createDocument") {
      return (
        <DocumentPreview
          key={toolCallId}
          isReadonly={isReadonly}
          result={result}
        />
      );
    } else if (toolName === "updateDocument") {
      return (
        <DocumentToolResult
          key={toolCallId}
          type="update"
          result={result}
          isReadonly={isReadonly}
        />
      );
    } else if (toolName === "requestSuggestions") {
      return (
        <DocumentToolResult
          key={toolCallId}
          type="request-suggestions"
          result={result}
          isReadonly={isReadonly}
        />
      );
    } else {
      // Generic tool result handling
      let displayResult = result;
      try {
        // Handle nested JSON strings
        if (typeof result === 'object' && result.content) {
          const content = result.content[0];
          if (content.type === 'text') {
            displayResult = JSON.parse(content.text);
          }
        }
      } catch (e) {
        // If parsing fails, fall back to original result
        console.error('Failed to parse tool result:', e);
        displayResult = result;
      }

      return (
        <motion.div
          key={toolCallId}
          className="border rounded-lg p-4 cursor-pointer hover:bg-muted"
          onClick={() => {
            const newExpandedTools: Record<string, boolean> = {
              ...expandedTools,
              [toolCallId]: !expandedTools[toolCallId]
            };
            setExpandedTools(newExpandedTools);
          }}
          animate={{
            backgroundColor: expandedTools[toolCallId]
              ? "var(--muted)"
              : "transparent",
          }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-green-600"
          >
            <SparklesIcon size={14} />
            <span>Tool invocation succeeded: {toolName}</span>
          </motion.div>

          {expandedTools[toolCallId] && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              className="mt-2"
            >
              <Markdown>{`\`\`\`json\n${JSON.stringify(displayResult, null, 2)}\n\`\`\``}</Markdown>
            </motion.div>
          )}
        </motion.div>
      );
    }
  }

  if (toolName === "getWeather") {
    return <Weather key={toolCallId} />;
  } else if (toolName === "createDocument") {
    return (
      <DocumentPreview key={toolCallId} isReadonly={isReadonly} args={args} />
    );
  } else if (toolName === "updateDocument") {
    return (
      <DocumentToolCall
        key={toolCallId}
        type="update"
        args={args}
        isReadonly={isReadonly}
      />
    );
  } else if (toolName === "requestSuggestions") {
    return (
      <DocumentToolCall
        key={toolCallId}
        type="request-suggestions"
        args={args}
        isReadonly={isReadonly}
      />
    );
  } else {
    // Generic tool calling state
    return (
      <motion.div
        key={toolCallId}
        className="border rounded-lg p-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-2 text-blue-600">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <SparklesIcon size={14} />
          </motion.div>
          <span>Invoking tool: {toolName}</span>
        </div>
      </motion.div>
    );
  }
};

const PurePreviewMessage = ({
  chatId,
  message,
  vote,
  isLoading,
  setMessages,
  reload,
  isReadonly,
}: {
  chatId: string;
  message: Message;
  vote: Vote | undefined;
  isLoading: boolean;
  setMessages: (
    messages: Message[] | ((messages: Message[]) => Message[])
  ) => void;
  reload: (
    chatRequestOptions?: ChatRequestOptions
  ) => Promise<string | null | undefined>;
  isReadonly: boolean;
}) => {
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>(
    {}
  );

  return (
    <AnimatePresence>
      <motion.div
        className="w-full mx-auto max-w-3xl px-4 group/message"
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        data-role={message.role}
      >
        <div
          className={cn(
            "flex gap-4 w-full group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl",
            {
              "w-full": mode === "edit",
              "group-data-[role=user]/message:w-fit": mode !== "edit",
            }
          )}
        >
          {message.role === "assistant" && (
            <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border bg-background">
              <div className="translate-y-px">
                <SparklesIcon size={14} />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2 w-full">
            {message.experimental_attachments && (
              <div className="flex flex-row justify-end gap-2">
                {message.experimental_attachments.map((attachment) => (
                  <PreviewAttachment
                    key={attachment.url}
                    attachment={attachment}
                  />
                ))}
              </div>
            )}

            {message.content && mode === "view" && (
              <div className="flex flex-row gap-2 items-start">
                {message.role === "user" && !isReadonly && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        className="px-2 h-fit rounded-full text-muted-foreground opacity-0 group-hover/message:opacity-100"
                        onClick={() => {
                          setMode("edit");
                        }}
                      >
                        <PencilEditIcon />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Edit message</TooltipContent>
                  </Tooltip>
                )}

                <div
                  className={cn("flex flex-col gap-4", {
                    "bg-primary text-primary-foreground px-3 py-2 rounded-xl":
                      message.role === "user",
                  })}
                >
                  <Markdown>{message.content as string}</Markdown>
                </div>
              </div>
            )}

            {message.content && mode === "edit" && (
              <div className="flex flex-row gap-2 items-start">
                <div className="size-8" />

                <MessageEditor
                  key={message.id}
                  message={message}
                  setMode={setMode}
                  setMessages={setMessages}
                  reload={reload}
                />
              </div>
            )}

            {message.toolInvocations && message.toolInvocations.length > 0 && (
              <div className="flex flex-col gap-4">
                {message.toolInvocations.map((toolInvocation) => (
                  <ToolDisplay
                    key={toolInvocation.toolCallId}
                    toolInvocation={toolInvocation}
                    isReadonly={isReadonly}
                    expandedTools={expandedTools}
                    setExpandedTools={setExpandedTools}
                  />
                ))}
              </div>
            )}

            {!isReadonly && (
              <MessageActions
                key={`action-${message.id}`}
                chatId={chatId}
                message={message}
                vote={vote}
                isLoading={isLoading}
              />
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export const PreviewMessage = memo(
  PurePreviewMessage,
  (prevProps, nextProps) => {
    if (prevProps.isLoading !== nextProps.isLoading) return false;
    if (prevProps.message.content !== nextProps.message.content) return false;
    if (
      !equal(
        prevProps.message.toolInvocations,
        nextProps.message.toolInvocations
      )
    )
      return false;
    if (!equal(prevProps.vote, nextProps.vote)) return false;

    return true;
  }
);

export const ThinkingMessage = () => {
  const role = "assistant";

  return (
    <motion.div
      className="w-full mx-auto max-w-3xl px-4 group/message "
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1, transition: { delay: 1 } }}
      data-role={role}
    >
      <div
        className={cx(
          "flex gap-4 group-data-[role=user]/message:px-3 w-full group-data-[role=user]/message:w-fit group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl group-data-[role=user]/message:py-2 rounded-xl",
          {
            "group-data-[role=user]/message:bg-muted": true,
          }
        )}
      >
        <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border">
          <SparklesIcon size={14} />
        </div>

        <div className="flex flex-col gap-2 w-full">
          <div className="flex flex-col gap-4 text-muted-foreground">
            Thinking... (Not really)
          </div>
        </div>
      </div>
    </motion.div>
  );
};
