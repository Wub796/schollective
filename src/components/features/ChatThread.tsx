"use client";

import React, { useState, useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/Button";
import { sendMessage } from "@/app/messages/[id]/actions";
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
  status: 'pending' | 'active' | 'closed';
}

export function ChatThread({ requestId, initialMessages, currentUserId, status }: ChatThreadProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // 1. Auto-scroll to bottom
  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 2. Real-time Subscription
  useEffect(() => {
    const channel = supabase
      .channel(`chat:${requestId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `request_id=eq.${requestId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => {
            if (prev.find(m => m.id === newMessage.id)) return prev;
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
    if (!inputValue.trim() || sending || status !== 'active') return;

    setSending(true);
    const content = inputValue;
    setInputValue("");

    try {
      const result = await sendMessage(requestId, content);
      if (result?.error) {
        toast.error(result.error);
        setInputValue(content);
      }
    } catch (error) {
      toast.error("Failed to send message.");
      setInputValue(content);
    } finally {
      setSending(false);
    }
  };

  const isDisabled = status !== 'active';

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-80px)] md:max-h-[calc(100vh-100px)]">
      {/* Messages Feed */}
      <div 
        ref={scrollRef}
        className="flex-grow overflow-y-auto px-4 md:px-8 py-8 space-y-6 scroll-smooth"
      >
        {messages.map((msg) => {
          const isOwn = msg.sender_id === currentUserId;
          return (
            <div 
              key={msg.id} 
              className={cn(
                "flex flex-col max-w-[85%] md:max-w-[70%]",
                isOwn ? "ml-auto items-end" : "mr-auto items-start"
              )}
            >
              <div className={cn(
                "px-5 py-3.5 rounded-2xl text-[0.9rem] md:text-[0.95rem] leading-relaxed shadow-sm transition-all duration-300",
                isOwn 
                  ? "bg-[rgba(212,146,42,0.12)] text-[var(--ivory)] border border-[rgba(212,146,42,0.25)] rounded-br-none" 
                  : "bg-[rgba(26,58,92,0.6)] text-[var(--ivory)] border border-[rgba(155,175,192,0.15)] rounded-bl-none"
              )}>
                {msg.content}
              </div>
              <span className="text-[0.6rem] text-[var(--text-muted)] mt-2 px-1 font-medium uppercase tracking-wider">
                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          );
        })}
      </div>

      {/* Input Module */}
      <div className="p-4 md:p-6 bg-[rgba(11,22,40,0.7)] border-t border-[rgba(155,175,192,0.1)] backdrop-blur-xl">
        {isDisabled ? (
          <div className="bg-[rgba(17,34,64,0.5)] border border-dashed border-[rgba(155,175,192,0.2)] rounded-2xl p-4 flex items-center justify-center gap-3 text-[var(--text-muted)] italic text-sm animate-in fade-in duration-500">
            <Lock size={16} className="shrink-0" />
            <span className="text-center">
              {status === 'pending' 
                ? "Messaging will unlock once the professor accepts the request." 
                : "This thread is closed and no longer accepting messages."}
            </span>
          </div>
        ) : (
          <form onSubmit={handleSend} className="flex gap-3 md:gap-4 items-end max-w-4xl mx-auto w-full">
            <div className="flex-grow relative">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Write a message..."
                rows={1}
                className="w-full bg-[rgba(26,58,92,0.5)] border border-[rgba(155,175,192,0.2)] rounded-2xl px-5 py-3.5 text-sm text-[var(--ivory)] outline-none focus:border-[var(--amber)] focus:bg-[rgba(26,58,92,0.7)] transition-all resize-none overflow-hidden"
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = "auto";
                  target.style.height = `${Math.min(target.scrollHeight, 200)}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e);
                  }
                }}
              />
            </div>
            <Button 
              type="submit" 
              disabled={sending || !inputValue.trim()} 
              className="h-[52px] w-[52px] rounded-2xl p-0 flex-shrink-0 shadow-lg shadow-[var(--amber)]/10"
            >
              <Send size={20} />
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
