"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, Send, Sparkles, Bot, User } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const SUGGESTIONS = [
  "How many products are missing GTINs?",
  "Show catalog compliance summary",
  "Which suppliers have the lowest quality?",
  "What's the ACP fill rate average?",
];

export function AIChatPanel({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm your CatalogForge AI assistant. Ask me anything about your catalog — compliance scores, validation issues, product data, or enrichment status.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  const handleSend = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg) return;
    setInput("");

    const userMsg: Message = { role: "user", content: msg, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg }),
      });
      const json = await res.json();
      const botMsg: Message = {
        role: "assistant",
        content: json.reply || "I couldn't process that. Try asking about products, compliance, or validation.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Something went wrong. Please try again.", timestamp: new Date() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-96 flex-shrink-0 border-l border-zinc-800/60 bg-[#0c0c0e] flex flex-col animate-slideInRight">
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-zinc-800/60">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-indigo-500/15 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <span className="text-sm font-medium text-zinc-200">AI Assistant</span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""} animate-fadeInUp`}
          >
            <div
              className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs ${
                msg.role === "assistant"
                  ? "bg-indigo-500/15 text-indigo-400"
                  : "bg-zinc-700 text-zinc-300"
              }`}
            >
              {msg.role === "assistant" ? <Bot className="w-3 h-3" /> : <User className="w-3 h-3" />}
            </div>
            <div
              className={`max-w-[85%] px-3 py-2 rounded-xl text-[13px] leading-relaxed ${
                msg.role === "assistant"
                  ? "bg-zinc-800/80 text-zinc-200 rounded-tl-sm"
                  : "bg-indigo-500/15 text-indigo-200 rounded-tr-sm"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-2.5 animate-fadeInUp">
            <div className="w-6 h-6 rounded-full bg-indigo-500/15 flex items-center justify-center">
              <Bot className="w-3 h-3 text-indigo-400" />
            </div>
            <div className="bg-zinc-800/80 px-3 py-2 rounded-xl rounded-tl-sm">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        {/* Suggestions (show only when no user messages yet) */}
        {messages.length <= 1 && (
          <div className="space-y-1.5 pt-2">
            <p className="text-[11px] text-zinc-500 font-medium">Try asking:</p>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => handleSend(s)}
                className="block w-full text-left px-3 py-2 rounded-lg bg-zinc-800/40 hover:bg-zinc-800/80 text-[12px] text-zinc-400 hover:text-zinc-200 transition-colors border border-zinc-800/60 hover:border-zinc-700"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-zinc-800/60">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask about your catalog..."
            className="flex-1 px-3 py-2 rounded-lg bg-zinc-800/80 border border-zinc-700/60 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 transition-all"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
