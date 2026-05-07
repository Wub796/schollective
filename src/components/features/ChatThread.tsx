"use client";

import React, { useState, useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/Button";
import { sendMessage } from "@/app/(dashboard)/messages/[id]/actions";
import { Send, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
}

interface ChatThreadProps {
  requestId: string;
  initialMessages: Message[];
  currentUserId: string;
  status: "pending" | "active" | "closed";
}

export function ChatThread({
  requestId,
  initialMessages,
  currentUserId,
  status,
}: ChatThreadProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const channel = supabase
      .channel(`chat:${requestId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `request_id=eq.${requestId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => {
            if (prev.find((m) => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [requestId, supabase]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || sending || status !== "active") return;

    setSending(true);
    const content = inputValue;
    setInputValue("");

    try {
      const result = await sendMessage(requestId, content);
      if (result?.error) {
        toast.error(result.error);
        setInputValue(content);
      }
    } catch {
      toast.error("Failed to send message.");
      setInputValue(content);
    } finally {
      setSending(false);
    }
  };

  const isDisabled = status !== "active";

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-80px)] md:max-h-[calc(100vh-100px)]">
      {/* Messages Feed */}
      <div
        ref={scrollRef}
        className="flex-grow overflow-y-auto px-4 md:px-8 py-8 space-y-5 scroll-smooth"
      >
        {messages.map((msg) => {
          const isOwn = msg.sender_id === currentUserId;
          return (
            <div
              key={msg.id}
              className={cn(
                "flex flex-col max-w-[85%] md:max-w-[68%]",
                isOwn ? "ml-auto items-end" : "mr-auto items-start"
              )}
            >
              <div
                className={cn(
                  "px-5 py-3.5 rounded-2xl text-sm leading-relaxed",
                  isOwn
                    ? "bg-[#e8e8e6] text-[#0d0d0d] rounded-br-none"
                    : "bg-[#1a1a1a] text-[#d4d4d2] border border-[rgba(255,255,255,0.06)] rounded-bl-none"
                )}
              >
                {msg.content}
              </div>
              <span className="text-[0.58rem] text-[#3a3a3a] mt-1.5 px-1 font-medium uppercase tracking-wider">
                {new Date(msg.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <div className="p-4 md:p-6 bg-[rgba(13,13,13,0.9)] border-t border-[rgba(255,255,255,0.05)] backdrop-blur-xl">
        {isDisabled ? (
          <div className="bg-[rgba(255,255,255,0.02)] border border-dashed border-[rgba(255,255,255,0.07)] rounded-2xl p-4 flex items-center justify-center gap-3 text-[#4a4a4a] italic text-sm">
            <Lock size={14} className="shrink-0" />
            <span className="text-center text-xs">
              {status === "pending"
                ? "Messaging will unlock once the professor accepts the request."
                : "This thread is closed and no longer accepting messages."}
            </span>
          </div>
        ) : (
          <form
            onSubmit={handleSend}
            className="flex gap-3 items-end max-w-4xl mx-auto w-full"
          >
            <div className="flex-grow relative">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Write a message…"
                rows={1}
                className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.07)] rounded-2xl px-5 py-3.5 text-sm text-[#f2f2f0] outline-none focus:border-[rgba(232,232,230,0.4)] focus:bg-[rgba(255,255,255,0.05)] transition-all resize-none overflow-hidden placeholder:text-[#3a3a3a]"
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = "auto";
                  target.style.height = `${Math.min(target.scrollHeight, 200)}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e);
                  }
                }}
              />
            </div>
            <Button
              type="submit"
              disabled={sending || !inputValue.trim()}
              className="h-[52px] w-[52px] rounded-2xl p-0 flex-shrink-0"
            >
              <Send size={18} />
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
