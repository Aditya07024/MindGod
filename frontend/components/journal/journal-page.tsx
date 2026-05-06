"use client";

import { useEffect, useState } from "react";
import { BookOpen, Brain, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/card";
import { apiFetch } from "@/lib/api/client";

type Entry = {
  _id: string;
  prompt: string;
  situation: string;
  thought: string;
  feeling: string;
  reframe: string;
  aiResponse?: string;
};

export function JournalPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    prompt: "What thought hit hardest today?",
    situation: "",
    thought: "",
    feeling: "",
    reframe: ""
  });

  useEffect(() => {
    apiFetch<{ entries: Entry[] }>("/journal")
      .then((data) => setEntries(data.entries))
      .catch(() => undefined);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { entry } = await apiFetch<{ entry: Entry }>("/journal", {
        method: "POST",
        body: JSON.stringify(formData)
      });

      setEntries([entry, ...entries]);
      setFormData({
        prompt: "What thought hit hardest today?",
        situation: "",
        thought: "",
        feeling: "",
        reframe: ""
      });
      setShowForm(false);
    } catch (error) {
      console.error("Error creating journal entry:", error);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-4xl text-primary">CBT Journal</h1>
          <p className="mt-2 text-foreground/70">Explore your thoughts and feelings</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <BookOpen className="h-4 w-4" />
          New Entry
        </Button>
      </div>

      {showForm && (
        <GlassCard>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-primary">Prompt</label>
              <input
                type="text"
                value={formData.prompt}
                onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                className="w-full rounded-lg bg-surface-low px-4 py-3 outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-primary">Situation</label>
              <textarea
                value={formData.situation}
                onChange={(e) => setFormData({ ...formData, situation: e.target.value })}
                placeholder="What happened?"
                className="h-24 w-full resize-none rounded-lg bg-surface-low px-4 py-3 outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-primary">Automatic Thought</label>
              <textarea
                value={formData.thought}
                onChange={(e) => setFormData({ ...formData, thought: e.target.value })}
                placeholder="What thought showed up immediately?"
                className="h-24 w-full resize-none rounded-lg bg-surface-low px-4 py-3 outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-primary">Feeling</label>
              <input
                type="text"
                value={formData.feeling}
                onChange={(e) => setFormData({ ...formData, feeling: e.target.value })}
                placeholder="e.g. anxious, ashamed, frustrated"
                className="w-full rounded-lg bg-surface-low px-4 py-3 outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-primary">Balanced Reframe</label>
              <textarea
                value={formData.reframe}
                onChange={(e) => setFormData({ ...formData, reframe: e.target.value })}
                placeholder="What is a kinder and more accurate way to see this?"
                className="h-24 w-full resize-none rounded-lg bg-surface-low px-4 py-3 outline-none"
              />
            </div>

            <div className="flex gap-3">
              <Button type="submit" className="flex-1">Save Entry</Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </form>
        </GlassCard>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {entries.map((entry) => (
          <GlassCard key={entry._id} className="cursor-pointer transition-shadow hover:shadow-glow">
            <div className="mb-3 flex items-start justify-between">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            <h3 className="mb-2 font-heading text-xl text-primary">{entry.prompt}</h3>
            <p className="mb-3 line-clamp-2 text-sm text-foreground/70">{entry.situation}</p>

            {entry.aiResponse ? (
              <div className="mt-4 border-t border-primary/20 pt-4">
                <div className="flex items-start gap-2">
                  <Lightbulb className="mt-1 h-4 w-4 flex-shrink-0 text-gold" />
                  <p className="text-xs text-foreground/75">{entry.aiResponse}</p>
                </div>
              </div>
            ) : null}
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
