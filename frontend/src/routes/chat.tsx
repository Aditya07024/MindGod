import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { Send, AlertTriangle } from 'lucide-react';
import { useStore, FREE_DAILY_LIMIT } from '@/lib/store';
import { useUser, useAuth } from '@clerk/clerk-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import API from '@/lib/api';
import { AppShell } from '@/components/AppShell';
import { ManasAvatar } from '@/components/ManasAvatar';
import { CrisisOverlay } from '@/components/CrisisButton';
import { detectCrisis } from '@/lib/crisis';
import { motion } from 'framer-motion';

export const Route = createFileRoute('/chat')({ component: Chat });

function Chat() {
  const { user: clerkUser } = useUser();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const firstName = clerkUser?.firstName ?? clerkUser?.username ?? 'friend';
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [crisis, setCrisis] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { data: userStats } = useQuery({
    queryKey: ['userStats'],
    queryFn: () => API.user.stats(),
    retry: false,
  });

  const { data: chatData, refetch } = useQuery({
    queryKey: ['chatHistory'],
    queryFn: () => API.chat.getMessages(),
    retry: false,
  });

  const dbMessages = chatData?.messages || [];
  const [localMessages, setLocalMessages] = useState<any[]>([]);

  useEffect(() => {
    setLocalMessages(dbMessages);
  }, [dbMessages]);

  const messages = localMessages;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, streaming]);

  const todayStr = new Date().toLocaleDateString('en-CA');
  const usedToday = messages.filter((m: any) => 
    m.role === 'user' && 
    new Date(m.timestamp || m.createdAt).toLocaleDateString('en-CA') === todayStr
  ).length || 0;
  const remaining = Math.max(0, FREE_DAILY_LIMIT - usedToday);
  const limitHit = remaining === 0;

  const send = async () => {
    const text = input.trim();
    if (!text || streaming) return;
    if (limitHit) return;

    if (detectCrisis(text)) setCrisis(true);

    const userMsg = { _id: crypto.randomUUID(), role: 'user', content: text, timestamp: Date.now() };
    setLocalMessages(prev => [...prev, userMsg]);
    setInput('');

    const placeholder = { _id: crypto.randomUUID(), role: 'assistant', content: '', timestamp: Date.now() };
    setLocalMessages(prev => [...prev, placeholder]);
    setStreaming(true);

    try {
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8080"}/api/chat`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: text }),
      });
      if (res.headers.get('X-Crisis') === '1') setCrisis(true);
      if (!res.ok || !res.body) {
        setLocalMessages(prev => prev.map((m, i) => i === prev.length - 1 ? { ...m, content: "I'm having trouble connecting right now. Please try again in a moment — and if you're in crisis, please tap the red button." } : m));
        return;
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = '';
      let acc = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let idx;
        while ((idx = buf.indexOf('\n')) !== -1) {
          const line = buf.slice(0, idx).trim();
          buf = buf.slice(idx + 1);
          if (!line.startsWith('data: ')) continue;
          const json = line.slice(6);
          if (json === '[DONE]') continue;
          try {
            const p = JSON.parse(json);
            const t = p?.chunk || p?.choices?.[0]?.delta?.content;
            if (t) {
              acc += t;
              setLocalMessages(prev => prev.map((m, i) => i === prev.length - 1 ? { ...m, content: acc } : m));
            }
          } catch {}
        }
      }
    } catch {
      setLocalMessages(prev => prev.map((m, i) => i === prev.length - 1 ? { ...m, content: "I'm having trouble right now. Please try again." } : m));
    } finally {
      setStreaming(false);
      refetch();
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
    }
  };

  return (
    <AppShell>
      <div className="-mx-4 -mt-6 flex h-[calc(100vh-9rem)] flex-col">
        <div className="flex items-center justify-between border-b border-border/50 bg-card/60 px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-3">
            <ManasAvatar size={36} />
            <div>
              <div className="font-display font-semibold leading-tight">Manas</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span className="size-1.5 animate-soft-pulse rounded-full bg-emerald-500" />
                AI companion · always here
              </div>
            </div>
          </div>
          <div className={`rounded-full px-3 py-1 text-xs font-medium ${limitHit ? 'bg-crisis/10 text-crisis' : 'bg-primary-soft text-primary'}`}>
            {remaining} of {FREE_DAILY_LIMIT} messages remaining
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-6">
          {messages.length === 0 && (
            <div className="flex items-end gap-2">
              <ManasAvatar size={36} />
              <div className="max-w-[75%] rounded-3xl rounded-bl-md bg-card p-4 shadow-sm">
                <p className="text-foreground">
                  Hi {firstName || 'friend'}. I'm Manas. Whatever brought you here — let's just sit with it together. What's on your mind?
                </p>
              </div>
            </div>
          )}
          {messages.map((m) => (
            <motion.div
              key={m._id || m.id || Math.random()}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-end gap-2 ${m.role === 'user' ? 'justify-end' : ''}`}
            >
              {m.role === 'assistant' && <ManasAvatar size={36} />}
              <div
                className={`max-w-[75%] rounded-3xl p-4 shadow-sm ${
                  m.role === 'user'
                    ? 'rounded-br-md bg-primary text-primary-foreground'
                    : 'rounded-bl-md bg-card text-foreground'
                }`}
              >
                {m.content ? (
                  <p className="whitespace-pre-wrap">{m.content}</p>
                ) : (
                  <div className="flex gap-1.5 py-2">
                    <span className="typing-dot inline-block size-2 rounded-full bg-primary/60" />
                    <span className="typing-dot inline-block size-2 rounded-full bg-primary/60" />
                    <span className="typing-dot inline-block size-2 rounded-full bg-primary/60" />
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {limitHit && (
          <div className="mx-4 mb-3 rounded-2xl bg-accent/10 p-4 text-sm">
            <div className="flex items-center gap-2 font-semibold text-accent-foreground">
              <AlertTriangle className="size-4" />
              You've used today's free messages
            </div>
            <p className="mt-1 text-muted-foreground">
              Come back tomorrow, or upgrade to Mann Shanti (₹199/mo) for 100 messages a day.
            </p>
          </div>
        )}

        <form
          onSubmit={(e) => { e.preventDefault(); send(); }}
          className="flex items-center gap-2 border-t border-border/50 bg-card/60 px-3 py-3 backdrop-blur"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={streaming || limitHit}
            placeholder={limitHit ? 'Daily limit reached' : 'Type what you feel…'}
            className="flex-1 rounded-full border-0 bg-secondary px-4 py-3 outline-none placeholder:text-muted-foreground disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || streaming || limitHit}
            className="grid size-11 place-items-center rounded-full bg-primary text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
          >
            <Send className="size-5" />
          </button>
        </form>
      </div>

      <CrisisOverlay open={crisis} onClose={() => setCrisis(false)} />
    </AppShell>
  );
}
