"use client";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main className="container flex min-h-screen flex-col items-start justify-center gap-6">
      <p className="text-sm uppercase tracking-[0.2em] text-coral">Something went wrong</p>
      <h1 className="font-heading text-5xl text-primary">The space didn&apos;t load calmly.</h1>
      <p className="max-w-xl text-foreground/70">{error.message}</p>
      <Button onClick={reset}>Try again</Button>
    </main>
  );
}
