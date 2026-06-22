"use client";

import React, { useState, useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/Button";
import { sendMessage } from "@/app/(dashboard)/messages/[id]/actions";
import { Send, Lock } from "lucide-react";
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
            // Already have the real message
            if (prev.find((m) => m.id === newMessage.id)) return prev;
            // Remove any optimistic placeholder with same content+sender, then add real
            const withoutOptimistic = prev.filter(
              (m) =>
                !(
                  m.id.startsWith("optimistic-") &&
                  m.sender_id === newMessage.sender_id &&
                  m.content === newMessage.content
                )
            );
            return [...withoutOptimistic, newMessage];
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
    const content = inputValue.trim();
    setInputValue("");

    // Optimistically add the message immediately
    const optimisticMsg: Message = {
      id: `optimistic-${Date.now()}`,
      content,
      sender_id: currentUserId,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const result = await sendMessage(requestId, content);
      if (result?.error) {
        // Remove optimistic message and restore input on failure
        setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
        toast.error(result.error);
        setInputValue(content);
      }
      // On success: realtime will replace the optimistic msg with the real one
      // The dedup check (prev.find m.id === newMessage.id) won't match the temp id,
      // so the real message appends and we clean up the optimistic one
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
      toast.error("Failed to send message.");
      setInputValue(content);
    } finally {
      setSending(false);
    }
  };

  const isDisabled = status !== "active";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      {/* Messages feed */}
      <div
        ref={scrollRef}
        style={{
          flex: 1, overflowY: "auto", minHeight: 0,
          padding: "2rem 2rem 1.5rem",
          display: "flex", flexDirection: "column", gap: "1.25rem",
        }}
      >
        {messages.length === 0 ? (
          <div style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            gap: "0.75rem", opacity: 0.4, padding: "4rem 2rem",
          }}>
            <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "50%", border: "1px solid rgba(37, 99, 235, 0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Send size={14} color="rgba(37, 99, 235, 0.6)" />
            </div>
            <p style={{ fontSize: "0.78rem", color: "rgba(15, 23, 42, 0.5)", fontStyle: "italic", fontFamily: "var(--font-display)", textAlign: "center" }}>
              Begin the dialogue
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender_id === currentUserId;
            return (
              <div
                key={msg.id}
                style={{
                  display: "flex", flexDirection: "column",
                  maxWidth: "68%", alignSelf: isOwn ? "flex-end" : "flex-start",
                  alignItems: isOwn ? "flex-end" : "flex-start",
                }}
              >
                <div style={{
                  padding: "0.75rem 1.1rem",
                  borderRadius: isOwn ? "16px 16px 3px 16px" : "16px 16px 16px 3px",
                  fontSize: "0.875rem",
                  lineHeight: 1.65,
                  fontFamily: "var(--font-sans)",
                  ...(isOwn
                    ? {
                        background: "rgba(37, 99, 235, 0.85)",
                        color: "var(--bg-base)",
                        fontWeight: 500,
                      }
                    : {
                        background: "rgba(17, 17, 22, 0.85)",
                        color: "rgba(15, 23, 42, 0.9)",
                        border: "1px solid rgba(37, 99, 235, 0.1)",
                      }),
                }}>
                  {msg.content}
                </div>
                <span style={{
                  fontSize: "0.52rem", color: "rgba(15, 23, 42, 0.45)",
                  marginTop: "0.3rem", padding: "0 0.2rem",
                  fontWeight: 600, textTransform: "uppercase",
                  letterSpacing: "0.12em", fontFamily: "var(--font-sans, monospace)",
                }}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Input bar */}
      <div style={{
        padding: "0.875rem 1.5rem",
        background: "rgba(255, 255, 255, 0.95)",
        borderTop: "1px solid rgba(37, 99, 235, 0.07)",
        backdropFilter: "blur(24px)",
        flexShrink: 0,
      }}>
        {isDisabled ? (
          <div style={{
            display: "flex", alignItems: "center", gap: "0.75rem",
            padding: "0.875rem 1.25rem",
            border: "1px dashed rgba(37, 99, 235, 0.1)",
            borderRadius: "14px",
            background: "var(--bg-surface-2)",
          }}>
            <Lock size={13} style={{ color: "rgba(37, 99, 235, 0.3)", flexShrink: 0 }} />
            <span style={{
              fontSize: "0.76rem", color: "rgba(15, 23, 42, 0.35)",
              fontStyle: "italic", fontFamily: "var(--font-display)",
            }}>
              {status === "pending"
                ? "Messaging unlocks once the professor accepts the request."
                : "This thread has been closed."}
            </span>
          </div>
        ) : (
          <form
            onSubmit={handleSend}
            style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end", maxWidth: "860px", margin: "0 auto", width: "100%" }}
          >
            <div style={{ flex: 1, position: "relative" }}>
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Write a message…"
                rows={1}
                style={{
                  width: "100%",
                  background: "rgba(17, 17, 22, 0.7)",
                  border: "1px solid rgba(37, 99, 235, 0.12)",
                  borderRadius: "14px",
                  padding: "0.8rem 1.1rem",
                  fontSize: "0.875rem",
                  color: "var(--text-primary)",
                  outline: "none",
                  transition: "border-color 0.2s, background 0.2s",
                  resize: "none",
                  overflow: "hidden",
                  fontFamily: "var(--font-sans)",
                  lineHeight: 1.6,
                }}
                onFocus={e => {
                  e.currentTarget.style.borderColor = "rgba(37, 99, 235, 0.4)";
                  e.currentTarget.style.background = "rgba(17, 17, 22, 0.92)";
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = "rgba(37, 99, 235, 0.12)";
                  e.currentTarget.style.background = "rgba(17, 17, 22, 0.7)";
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = "auto";
                  target.style.height = `${Math.min(target.scrollHeight, 180)}px`;
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
              style={{
                width: "46px", height: "46px", borderRadius: "12px",
                padding: 0, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <Send size={16} />
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

