import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { Toaster } from "sonner";
import { setTokenGetter } from "@/lib/api";

import appCss from "../styles.css?url";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string;

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "MindSyncPro AI Mental Health Platform India" },
      { name: "description", content: "India's AI-powered mental health platform offering Manas AI companion, CBT tools, mood tracking, and RCI-verified therapists. Private, affordable, and free to start." },
      { property: "og:title", content: "MindSyncPro AI Mental Health Platform India" },
      { property: "og:description", content: "India's AI-powered mental health platform offering Manas AI companion, CBT tools, mood tracking, and RCI-verified therapists. Private, affordable, and free to start." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: `{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "MindSyncPro",
  "alternateName": "Mindsyncpro",
  "description": "India's AI-powered mental health platform combining Manas AI companion, CBT tools, mood tracking, and RCI-verified online therapist booking.",
  "url": "https://mindsyncpro.online",
  "applicationCategory": "HealthApplication",
  "operatingSystem": "Web, iOS, Android",
  "inLanguage": ["en-IN", "hi"],
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "INR",
    "description": "Free plan available. Paid plans from ₹499/month."
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "127",
    "bestRating": "5"
  },
  "provider": {
    "@type": "Organization",
    "name": "MindSyncPro",
    "url": "https://mindsyncpro.online",
    "email": "your-work@outlook.com",
    "sameAs": [
      "https://www.instagram.com/yourwork2025",
      "https://www.linkedin.com/company/107088242"
    ]
  }
}`
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: `{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Is MindSyncPro free to use?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. MindSyncPro offers a free plan with 7 daily AI messages and basic mood tracking. Paid plans start at ₹499/month."
      }
    },
    {
      "@type": "Question",
      "name": "How does Manas AI work for mental health?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Manas is an AI companion trained in CBT (Cognitive Behavioural Therapy). It has emotion-aware conversations, tracks your mood, suggests breathing exercises and thought records, and prepares a brief for your therapist."
      }
    },
    {
      "@type": "Question",
      "name": "Are therapists on MindSyncPro RCI verified?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. Every therapist is verified against RCI (Rehabilitation Council of India) records before listing. You can view credentials and book video sessions directly."
      }
    },
    {
      "@type": "Question",
      "name": "Is MindSyncPro safe and private?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. Phone numbers are hashed, all data is stored in India, and MindSyncPro is DPDPA 2023 compliant. We never sell your data."
      }
    },
    {
      "@type": "Question",
      "name": "Can colleges and companies use MindSyncPro?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. MindSyncPro offers organisation plans with anonymous aggregate wellness dashboards for colleges and corporates. No individual data is ever visible to admins."
      }
    }
  ]
}`
          }}
        />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function ClerkTokenWirer() {
  const { getToken } = useAuth();
  // Set synchronously during render so it's available immediately to children
  setTokenGetter(() => getToken());
  return null;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <ClerkTokenWirer />
      <QueryClientProvider client={queryClient}>
        <Outlet />
        <Toaster position="top-center" richColors closeButton />
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <div className="mt-6">
          <Link to="/" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">This page didn't load</h1>
        <div className="mt-6 flex gap-2 justify-center">
          <button onClick={() => { router.invalidate(); reset(); }}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Try again
          </button>
          <a href="/" className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted">Go home</a>
        </div>
      </div>
    </div>
  );
}
