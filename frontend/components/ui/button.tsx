import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 disabled:pointer-events-none disabled:opacity-60",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground shadow-soft hover:scale-[1.02]",
        coral: "bg-coral text-white shadow-soft hover:scale-[1.02]",
        ghost: "bg-white/70 text-primary hover:bg-white",
        crisis: "bg-crisis text-white hover:bg-crisis/90",
        outline: "border border-primary/20 bg-transparent text-primary hover:bg-primary/5"
      },
      size: {
        default: "",
        icon: "h-11 w-11 px-0 py-0",
        lg: "px-7 py-4 text-base"
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
