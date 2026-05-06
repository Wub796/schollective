"use client";

import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/Button";
import { sendMessage } from "@/app/messages/[id]/actions";
import { Send, Lock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

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
          // Avoid duplicate messages if already in local state (from server action optimistically if we had that)
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
  }, [requestId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || sending || status !== 'active') return;

    setSending(true);
    const content = inputValue;
    setInputValue("");

    try {
      await sendMessage(requestId, content);
      // Note: Real-time listener will add the message to the UI
    } catch (error) {
      console.error("Failed to send message:", error);
      setInputValue(content); // Restore input on error
    } finally {
      setSending(false);
    }
  };

  const isDisabled = status !== 'active';

  return (
    <div className="flex flex-col h-[calc(100vh-200px)]">
      {/* Messages Feed */}
      <div 
        ref={scrollRef}
        className="flex-grow overflow-y-auto px-6 py-8 space-y-6 scroll-smooth"
      >
        {messages.map((msg) => {
          const isOwn = msg.sender_id === currentUserId;
          return (
            <div 
              key={msg.id} 
              className={cn(
                "flex flex-col max-w-[80%] md:max-w-[70%]",
                isOwn ? "ml-auto items-end" : "mr-auto items-start"
              )}
            >
              <div className={cn(
                "px-5 py-3.5 rounded-2xl text-[0.95rem] leading-relaxed shadow-sm",
                isOwn 
                  ? "bg-[rgba(212,146,42,0.1)] text-[var(--ivory)] border border-[rgba(212,146,42,0.2)] rounded-br-none" 
                  : "bg-[rgba(26,58,92,0.5)] text-[var(--ivory)] border border-[rgba(155,175,192,0.1)] rounded-bl-none"
              )}>
                {msg.content}
              </div>
              <span className="text-[0.65rem] text-[var(--text-muted)] mt-1.5 px-1 font-medium">
                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          );
        })}
      </div>

      {/* Input Module */}
      <div className="p-6 bg-[rgba(11,22,40,0.5)] border-t border-[rgba(155,175,192,0.1)] backdrop-blur-md">
        {isDisabled ? (
          <div className="bg-[rgba(17,34,64,0.5)] border border-dashed border-[rgba(155,175,192,0.2)] rounded-2xl p-4 flex items-center justify-center gap-3 text-[var(--text-muted)] italic text-sm animate-in fade-in duration-500">
            <Lock size={16} />
            {status === 'pending' 
              ? "Messaging will unlock once the professor accepts the request." 
              : "This thread is closed and no longer accepting messages."}
          </div>
        ) : (
          <form onSubmit={handleSend} className="flex gap-4 items-end">
            <div className="flex-grow relative group">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Write a message..."
                rows={1}
                className="w-full bg-[rgba(26,58,92,0.4)] border border-[rgba(155,175,192,0.15)] rounded-2xl px-5 py-3.5 text-sm text-[var(--ivory)] outline-none focus:border-[var(--amber)] focus:bg-[rgba(26,58,92,0.6)] transition-all resize-none overflow-hidden"
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = "auto";
                  target.style.height = `${target.scrollHeight}px`;
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
              className="h-[52px] w-[52px] rounded-2xl p-0 flex-shrink-0"
            >
              <Send size={20} />
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
