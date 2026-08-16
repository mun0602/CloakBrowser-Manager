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
          0: "#08090c",
          1: "#0e1015",
          2: "#14171f",
          3: "#1c202a",
          4: "#242937",
        },
        border: {
          DEFAULT: "rgba(255, 255, 255, 0.08)",
          hover: "rgba(255, 255, 255, 0.16)",
          active: "rgba(244, 63, 94, 0.4)",
        },
        accent: {
          DEFAULT: "#f43f5e",
          hover: "#fb7185",
          glow: "rgba(244, 63, 94, 0.25)",
        },
        brand: {
          rose: "#fe2c55",
          cyan: "#25f4ee",
        }
      },
      boxShadow: {
        'bezel': 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.12), 0 8px 32px 0 rgba(0, 0, 0, 0.45)',
        'bezel-sm': 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.08), 0 2px 8px 0 rgba(0, 0, 0, 0.3)',
        'glow-rose': '0 0 24px -4px rgba(254, 44, 85, 0.35)',
        'glow-cyan': '0 0 24px -4px rgba(37, 244, 238, 0.35)',
      },
    },
  },
  plugins: [],
} satisfies Config;
