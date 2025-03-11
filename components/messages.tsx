import { ChatRequestOptions, Message } from "ai";
import { PreviewMessage, ThinkingMessage } from "./message";
import { useScrollToBottom } from "./use-scroll-to-bottom";
import { Overview } from "./overview";
import { memo, useRef, useEffect, useState } from "react";
import { Vote } from "@/lib/db/schema";
import equal from "fast-deep-equal";
import { Console } from "./console";
import { Button } from "./ui/button";
import { ArrowDownIcon } from "lucide-react";

interface MessagesProps {
  chatId: string;
  isLoading: boolean;
  votes: Array<Vote> | undefined;
  messages: Array<Message>;
  setMessages: (
    messages: Message[] | ((messages: Message[]) => Message[])
  ) => void;
  reload: (
    chatRequestOptions?: ChatRequestOptions
  ) => Promise<string | null | undefined>;
  isReadonly: boolean;
  isBlockVisible: boolean;
}

function PureMessages({
  chatId,
  isLoading,
  votes,
  messages,
  setMessages,
  reload,
  isReadonly,
}: MessagesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    const end = endRef.current;

    if (!isLoading) {
      setAutoScroll(true);
    }

    if (container && end && isLoading && autoScroll) {
      const observer = new MutationObserver(() => {
        end.scrollIntoView({ behavior: "smooth", block: "end" });
      });

      observer.observe(container, {
        childList: true,
        subtree: true,
        attributes: false,
        characterData: false,
      });
      return () => observer.disconnect();
    }
  }, [isLoading, autoScroll]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY < 0) { // Scrolling up
        setAutoScroll(false);
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      const startY = touch.pageY;

      const handleTouchMove = (e: TouchEvent) => {
        const touch = e.touches[0];
        if (touch.pageY > startY) { // Swiping up
          setAutoScroll(false);
        }
      };

      container.addEventListener('touchmove', handleTouchMove);
      container.addEventListener('touchend', () => {
        container.removeEventListener('touchmove', handleTouchMove);
      }, { once: true });
    };

    container.addEventListener('wheel', handleWheel);
    container.addEventListener('touchstart', handleTouchStart);

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('touchstart', handleTouchStart);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="flex flex-col min-w-0 gap-6 flex-1 overflow-y-scroll pt-2"
    >
      {messages.length === 0 && <Overview />}
      {messages.map((message, index) => (
        <>
          <PreviewMessage
            key={message.id}
            chatId={chatId}
            message={message}
            isLoading={isLoading && messages.length - 1 === index}
            vote={
              votes
                ? votes.find((vote) => vote.messageId === message.id)
                : undefined
            }
            setMessages={setMessages}
            reload={reload}
            isReadonly={isReadonly}
          />
        </>
      ))}

      {isLoading &&
        messages.length > 0 &&
        messages[messages.length - 1].role === "user" && <ThinkingMessage />}

      <div ref={endRef} className="shrink-0 min-w-[24px] min-h-[24px]" />
    </div>
  );
}

export const Messages = memo(PureMessages, (prevProps, nextProps) => {
  // console.log(prevProps,nextProps)
  return false;
  if (!prevProps) return false;
  // if (prevProps.isBlockVisible && nextProps.isBlockVisible) return true;
  // if (prevProps.isLoading !== nextProps.isLoading) return false;
  if (prevProps.isLoading && nextProps.isLoading) return false;
  if (!equal(prevProps.votes, nextProps.votes)) return false;
  return true;
});
