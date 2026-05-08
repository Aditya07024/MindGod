import { createFileRoute } from "@tanstack/react-router";
import { SignIn } from "@clerk/clerk-react";

export const Route = createFileRoute("/sign-in")({ component: SignInPage });

function SignInPage() {
  return (
    <div className="min-h-screen bg-canvas-gradient flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-warm-gradient shadow-lg">
            <span className="font-black text-2xl text-white">M</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-primary-deep">MindGod</h1>
          <p className="text-muted-foreground text-sm">Apna Dil Kholo</p>
        </div>

        {/* Clerk SignIn — handles Google, Apple, email */}
        <SignIn
          routing="hash"
          fallbackRedirectUrl="/dashboard"
          signUpFallbackRedirectUrl="/onboarding"
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "rounded-3xl shadow-xl border border-border bg-card w-full",
              headerTitle: "font-display font-bold text-primary-deep",
              headerSubtitle: "text-muted-foreground",
              socialButtonsBlockButton:
                "rounded-xl border border-border bg-background hover:bg-muted transition font-medium",
              formButtonPrimary:
                "rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold",
              footerActionLink: "text-primary font-semibold",
              formFieldInput:
                "rounded-xl border-input bg-background focus:ring-2 focus:ring-primary",
            },
            variables: {
              colorPrimary: "#2C6B6A",
              colorBackground: "#FDFAF7",
              borderRadius: "0.75rem",
              fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
            },
          }}
        />
      </div>
    </div>
  );
}
