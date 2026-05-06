import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1200px"
      }
    },
    extend: {
      colors: {
        background: "#FAFAF9",
        foreground: "#191C1B",
        primary: {
          DEFAULT: "#2E6E65",
          foreground: "#FFFFFF",
          soft: "#ADEEE2"
        },
        coral: "#F4845F",
        gold: "#F4C261",
        crisis: "#DC2626",
        surface: {
          DEFAULT: "#FFFFFFB3",
          low: "#F2F4F2",
          high: "#E7E9E7",
          stroke: "#BFC9C6"
        }
      },
      fontFamily: {
        heading: ["var(--font-sora)"],
        body: ["var(--font-plus-jakarta)"]
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem"
      },
      boxShadow: {
        glow: "0 24px 64px rgba(46, 110, 101, 0.12)",
        soft: "0 18px 48px rgba(46, 110, 101, 0.08)"
      },
      backgroundImage: {
        "hero-wash":
          "radial-gradient(circle at top right, rgba(244,194,97,0.22), transparent 35%), radial-gradient(circle at bottom left, rgba(46,110,101,0.16), transparent 35%)",
        "breathing-glow":
          "radial-gradient(circle at center, rgba(244,194,97,0.18), rgba(46,110,101,0.08) 72%)"
      },
      keyframes: {
        breathe: {
          "0%, 100%": { transform: "scale(1)", opacity: "0.45" },
          "50%": { transform: "scale(1.22)", opacity: "0.8" }
        }
      },
      animation: {
        breathe: "breathe 8s cubic-bezier(0.45, 0, 0.55, 1) infinite"
      }
    }
  },
  plugins: []
};

export default config;
