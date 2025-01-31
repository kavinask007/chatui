"use client";

import { useCallback, useState } from "react";
import { CodeIcon, LoaderIcon, PlayIcon, PythonIcon } from "./icons";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { CopyIcon } from "@/components/icons";
import { useCopyToClipboard } from "usehooks-ts";
interface CodeBlockProps {
  node: any;
  inline: boolean;
  className: string;
  children: any;
}

export function CodeBlock({
  node,
  inline,
  className,
  children,
  ...props
}: CodeBlockProps) {
  const [output, setOutput] = useState<string | null>(null);
  const [pyodide, setPyodide] = useState<any>(null);
  const [_, copyToClipboard] = useCopyToClipboard();
  const match = /language-(\w+)/.exec(className || "");
  const isPython = match && match[1] === "python";
  const codeContent = String(children).replace(/\n$/, "");
  const [tab, setTab] = useState<"code" | "run">("code");
  if (!inline && className) {
    return (
      <div className="not-prose flex flex-col relative">
        <Button
          className="absolute top-0 right-0 m-1 py-1 px-2 h-fit text-muted-foreground"
          variant={"outline"}
          onClick={async () => {
            await copyToClipboard(codeContent as string);
            toast.success("Copied to clipboard!");
          }}
        >
          <CopyIcon /> {/* Use a check icon to indicate copy to clipboard */}
        </Button>

        {tab === "code" && (
          <pre
            {...props}
            className={`text-sm w-full overflow-x-auto dark:bg-zinc-900 p-4 border border-zinc-200 dark:border-zinc-700 rounded-xl dark:text-zinc-50 text-zinc-900`}
          >
            <code className="whitespace-pre-wrap break-words">{children}</code>
          </pre>
        )}

        {tab === "run" && output && (
          <div className="text-sm w-full overflow-x-auto bg-zinc-800 dark:bg-zinc-900 p-4 border border-zinc-200 dark:border-zinc-700 border-t-0 rounded-b-xl text-zinc-50">
            <code>{output}</code>
          </div>
        )}
      </div>
    );
  } else {
    return (
      <code
        className={`${className} text-sm bg-zinc-300 dark:bg-zinc-700 py-0.5 px-1 rounded-md cursor-pointer`}
        {...props}
        onClick={async () => {
          await copyToClipboard(codeContent as string);
          toast.success("Copied to clipboard!");
        }}
      >
        {children}
      </code>
    );
  }
}
