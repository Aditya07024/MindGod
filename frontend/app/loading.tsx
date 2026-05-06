import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="container space-y-6 py-12">
      <Skeleton className="h-16 w-64" />
      <div className="grid gap-6 md:grid-cols-3">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    </main>
  );
}
