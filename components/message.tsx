"use client";

import type { ChatRequestOptions, Message } from "ai";
import cx from "classnames";
import { AnimatePresence, motion } from "framer-motion";
import { memo, useState } from "react";

import type { Vote } from "@/lib/db/schema";
import { ToolDisplay } from "./message-tool";
import { PencilEditIcon, SparklesIcon } from "./icons";
import { Markdown } from "./markdown";
import { MessageActions } from "./message-actions";
import { PreviewAttachment } from "./preview-attachment";

import equal from "fast-deep-equal";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { MessageEditor } from "./message-editor";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import { Loader2Icon } from "lucide-react";

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

  // Group sequential tool invocations
  const groupedParts =
    message.parts?.reduce((acc: any[], part, index) => {
      if (part.type === "tool-invocation") {
        if (acc.length && Array.isArray(acc[acc.length - 1])) {
          acc[acc.length - 1].push(part);
        } else {
          acc.push([part]);
        }
      } else {
        acc.push(part);
      }
      return acc;
    }, []) || [];

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
                <motion.div
                  animate={
                    isLoading
                      ? {
                          opacity: [1, 0.4, 1],
                        }
                      : {}
                  }
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <SparklesIcon size={14} />
                </motion.div>
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
            {message.role === "assistant" && message.reasoning && (
              <Accordion
                type="single"
                defaultValue="reasoning"
                collapsible
                className="opacity-80 p-2"
              >
                <AccordionItem
                  value="reasoning"
                  className="bg-muted/20 p-2 rounded-md"
                >
                  <AccordionTrigger className="flex items-center gap-2 p-2">
                    {isLoading && !message.content ? (
                      <div className="animate-pulse flex items-center gap-2">
                        Reasoning{" "}
                        <Loader2Icon className="animate-spin" size={14} />
                      </div>
                    ) : (
                      "Reasoning"
                    )}
                  </AccordionTrigger>
                  <AccordionContent className="bg-muted/20 rounded-lg border p-4">
                    <motion.div
                      animate={{
                        opacity: [1, 0.7, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <Markdown>{message.reasoning}</Markdown>
                    </motion.div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}
            {mode === "view" && (
              <div className="flex flex-col gap-2">
                {groupedParts.map((part, index) => {
                  if (Array.isArray(part)) {
                    return (
                      <ToolDisplay
                        key={`tool-${index}`}
                        toolInvocation={part}
                        isReadonly={isReadonly}
                        expandedTools={expandedTools}
                        setExpandedTools={setExpandedTools}
                      />
                    );
                  }

                  if (part.type === "text") {
                    return (
                      <div
                        key={`text-${index}`}
                        className="flex flex-row gap-2 items-start"
                      >
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
                          <Markdown>{part.text}</Markdown>
                        </div>
                      </div>
                    );
                  }
                })}
              </div>
            )}

            {mode === "edit" && (
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
    if (!equal(prevProps.message.parts, nextProps.message.parts)) return false;
    if (prevProps.message.reasoning !== nextProps.message.reasoning)
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
            Thinking...
          </div>
        </div>
      </div>
    </motion.div>
  );
};
