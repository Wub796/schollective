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
                style={{
                  padding: "0.875rem 1.25rem",
                  borderRadius: isOwn ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  fontSize: "0.875rem",
                  lineHeight: 1.6,
                  ...(isOwn
                    ? {
                        background: "#818cf8",
                        color: "#09090b",
                        fontWeight: 500,
                      }
                    : {
                        background: "rgba(17, 17, 19, 0.8)",
                        color: "rgba(168, 179, 207, 0.88)",
                        border: "1px solid rgba(129, 140, 248, 0.12)",
                      }),
                }}
              >
                {msg.content}
              </div>
              <span style={{ fontSize: "0.55rem", color: "rgba(82, 82, 91, 0.5)", marginTop: "0.375rem", padding: "0 0.25rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: "var(--font-mono, monospace)" }}>
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
      <div style={{ padding: "1rem 1.5rem", background: "rgba(9, 9, 11, 0.92)", borderTop: "1px solid rgba(129, 140, 248, 0.1)", backdropFilter: "blur(24px)" }}>
        {isDisabled ? (
          <div style={{ background: "rgba(17, 17, 19, 0.5)", border: "1px dashed rgba(129, 140, 248, 0.12)", borderRadius: "16px", padding: "1rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem", color: "rgba(82, 82, 91, 0.5)", fontStyle: "italic", fontSize: "0.875rem" }}>
            <Lock size={14} style={{ flexShrink: 0 }} />
            <span style={{ textAlign: "center", fontSize: "0.78rem", color: "rgba(82, 82, 91, 0.6)" }}>
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
                style={{
                  width: "100%",
                  background: "rgba(17, 17, 19, 0.7)",
                  border: "1px solid rgba(129, 140, 248, 0.15)",
                  borderRadius: "16px",
                  padding: "0.875rem 1.25rem",
                  fontSize: "0.875rem",
                  color: "rgba(250, 250, 249, 0.9)",
                  outline: "none",
                  transition: "border-color 0.2s, background 0.2s",
                  resize: "none",
                  overflow: "hidden",
                  fontFamily: "var(--font-sans)",
                }}
                onFocus={e => {
                  e.currentTarget.style.borderColor = "rgba(129, 140, 248, 0.45)";
                  e.currentTarget.style.background = "rgba(17, 17, 19, 0.9)";
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = "rgba(129, 140, 248, 0.15)";
                  e.currentTarget.style.background = "rgba(17, 17, 19, 0.7)";
                }}
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
