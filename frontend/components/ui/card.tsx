import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function GlassCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[28px] border border-surface-stroke/40 bg-white/70 p-6 shadow-soft backdrop-blur-xl",
        className
      )}
      {...props}
    />
  );
}
