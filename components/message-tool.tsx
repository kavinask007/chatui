"use client";

import { motion } from "framer-motion";
import { SparklesIcon } from "./icons";
import { Markdown } from "./markdown";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import { WrenchIcon } from "lucide-react";

interface ToolStep {
  args?: Record<string, any>;
  result?: string;
  state: "call" | "result";
  step: number;
  toolCallId: string;
  toolName: string;
}

interface ToolResult {
  content: Array<{
    type: string;
    text?: string;
    data?: string;
  }>;
  isError: boolean;
}

interface ToolGroup {
  call: ToolStep | null;
  result: ToolStep | null;
  step: number;
}

export const ToolDisplay = ({
  toolInvocation,
  isReadonly,
  expandedTools,
  setExpandedTools,
}: {
  toolInvocation: any[];
  isReadonly: boolean;
  expandedTools: Record<string, boolean>;
  setExpandedTools: (value: Record<string, boolean>) => void;
}) => {
  // Group tool calls by their toolId and match call and result steps
  const toolGroups = toolInvocation.reduce((acc, curr) => {
    const { toolCallId, state, step } = curr["toolInvocation"];
    if (!acc[toolCallId]) {
      acc[toolCallId] = { call: null, result: null, step };
    }
    if (state === "call") {
      acc[toolCallId].call = curr["toolInvocation"];
    } else if (state === "result") {
      acc[toolCallId].result = curr["toolInvocation"];
    }
    return acc;
  }, {} as Record<string, ToolGroup>);

  // Sort tool groups by step number
  const sortedToolGroups = Object.entries(toolGroups).sort(
    ([, a], [, b]) => (a as ToolGroup).step - (b as ToolGroup).step
  );

  return (
    <Accordion type="single" collapsible defaultValue="steps" className="w-full">
      <AccordionItem value="steps">
        <AccordionTrigger className="bg-muted/20 p-2 rounded-md">
          <div className="flex items-center gap-2">
            <WrenchIcon size={14} className="text-muted-foreground" />
            <span>Tools</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="bg-muted/20 p-4">
          <div className="flex flex-col gap-4">
            {sortedToolGroups.map(([toolCallId, steps]: [string, any], index) => (
              <div key={toolCallId} className="pl-4 border-l-2 border-muted">
                <div className="flex items-center gap-2 mb-2">
                  <WrenchIcon size={12} className="text-muted-foreground" />
                  <span>
                    Step {index + 1}: {steps.call?.toolName || steps.result?.toolName}
                  </span>
                  {steps.result?.args ?(
                        <div className="rounded-md">
                          <Markdown>
                            {JSON.stringify(steps.result.args, null, 2)}
                          </Markdown>
                        </div>
                      ):<p>{JSON.stringify(steps)}</p>}
                  <span className="text-xs text-gray-500">
                    (Tool ID: {toolCallId})
                  </span>
                </div>

                {steps.call && (
                  <div key="call" className="relative">
                    {/* Step marker */}
                    <div className="absolute left-[-21px] top-2 size-4 rounded-full bg-background border-2 border-muted" />

                    <div className="flex flex-col gap-2 pt-1">
                      <div className="flex items-center gap-2">
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
                        <span className="text-blue-600">
                          Invoking: {steps.call.toolName}
                        </span>
                      </div>

                    
                    </div>
                  </div>
                )}
                {steps.result && (
                  <div key="result" className="relative">
                    {/* Step marker */}
                    <div className="absolute left-[-21px] top-2 size-4 rounded-full bg-background border-2 border-muted" />

                    <div className="flex flex-col gap-2 pt-1">
                      <div className="flex items-center gap-2">
                        <span>Result</span>
                      </div>

                      {steps.result.result && (
                        <div className="pl-6 py-2 bg-muted/50 rounded-md">
                          {(() => {
                            try {
                              const result = JSON.parse(
                                steps.result.result
                              ) as ToolResult;
                              return (
                                <div className="flex flex-col gap-2">
                                  {result.content.map((item, i) => {
                                    if (item.type === "text") {
                                      return (
                                        <Markdown key={i}>
                                          {`${item.text}`}
                                        </Markdown>
                                      );
                                    } else if (item.type === "image" && item.data) {
                                      return (
                                        <img 
                                          key={i}
                                          src={`data:image/png;base64,${item.data}`}
                                          alt="Tool result image"
                                          className="max-w-full h-auto"
                                        />
                                      );
                                    }
                                    return null;
                                  })}
                                </div>
                              );
                            } catch (e) {
                              console.error("Failed to parse tool result:", e);
                              return <span>{steps.result.result}</span>;
                            }
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
