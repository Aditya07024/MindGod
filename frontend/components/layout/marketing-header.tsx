import Link from "next/link";
import { marketingNav } from "@/lib/data/mock";
import { Button } from "@/components/ui/button";

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-surface-stroke/30 bg-background/80 backdrop-blur-xl">
      <div className="container flex items-center justify-between py-4">
        <Link href="/" className="font-heading text-2xl font-semibold text-primary">
          MindGod
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {marketingNav.map((item) => (
            <Link key={item.href} href={item.href} className="text-sm text-foreground/70 hover:text-primary">
              {item.label}
            </Link>
          ))}
        </nav>
        <Link href="/onboarding">
          <Button variant="coral" className="hidden md:inline-flex">
            Talk to Manas
          </Button>
        </Link>
      </div>
    </header>
  );
}
