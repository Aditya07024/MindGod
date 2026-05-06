export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-[24px] bg-primary/10 ${className}`} />;
}
