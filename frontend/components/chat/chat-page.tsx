"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/card";
import { MessageCircleMore, Mic, Send } from "lucide-react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api";

export function ChatPage() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Namaste. I'm here with you. No pressure to be fine."
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = inputValue;
    setInputValue("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }, { role: "assistant", content: "" }]);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage })
      });

      if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let assistantMessage = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.chunk) {
                  assistantMessage += data.chunk;
                  setMessages(prev => [
                    ...prev.slice(0, -1),
                    { role: "assistant", content: assistantMessage }
                  ]);
                }
              } catch (e) {
                // Skip parse errors
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      <div className="border-b border-surface-stroke/30 bg-background/80 px-6 py-4 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <MessageCircleMore className="h-6 w-6 text-primary" />
          <div>
            <h1 className="font-heading text-2xl text-primary">Manas AI</h1>
            <p className="text-xs text-foreground/60">Always here for you</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 p-6">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-2xl rounded-[28px] ${
                msg.role === "user"
                  ? "rounded-tr-md bg-primary p-5 text-white"
                  : "rounded-tl-md border border-primary/20 bg-primary/10 p-5 text-foreground"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="rounded-[28px] rounded-tl-md border border-primary/20 bg-primary/10 p-5">
              <div className="flex gap-2">
                <div className="h-2 w-2 rounded-full bg-primary animate-bounce" />
                <div className="h-2 w-2 rounded-full bg-primary animate-bounce delay-100" />
                <div className="h-2 w-2 rounded-full bg-primary animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-surface-stroke/30 bg-background/80 p-6 backdrop-blur-xl">
        <GlassCard>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Tell Manas what is on your mind..."
              className="h-14 flex-1 rounded-full bg-surface-low px-5 outline-none"
            />
            <Button
              size="icon"
              variant="ghost"
              className="rounded-full"
            >
              <Mic className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              onClick={handleSendMessage}
              disabled={isLoading || !inputValue.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
