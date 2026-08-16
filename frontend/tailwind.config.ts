import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      colors: {
        surface: {
          0: "#07090e",
          1: "#0b1017",
          2: "#101722",
          3: "#16202e",
          4: "#1e2c3d",
        },
        border: {
          DEFAULT: "rgba(255, 255, 255, 0.08)",
          hover: "rgba(255, 255, 255, 0.16)",
          active: "rgba(56, 189, 248, 0.4)",
        },
        accent: {
          DEFAULT: "#0284c7",
          hover: "#38bdf8",
          glow: "rgba(56, 189, 248, 0.25)",
        },
        brand: {
          sky: "#38bdf8",
          cyan: "#0ea5e9",
          blue: "#60a5fa",
        }
      },
      boxShadow: {
        'bezel': 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.12), 0 8px 32px 0 rgba(0, 0, 0, 0.45)',
        'bezel-sm': 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.08), 0 2px 8px 0 rgba(0, 0, 0, 0.3)',
        'glow-sky': '0 0 24px -4px rgba(56, 189, 248, 0.4)',
        'glow-cyan': '0 0 24px -4px rgba(14, 165, 233, 0.35)',
      },
    },
  },
  plugins: [],
} satisfies Config;
