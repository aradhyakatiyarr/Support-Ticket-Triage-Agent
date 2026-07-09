import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#FAFBF9",
        panel: "#FFFFFF",
        ink: "#14171A",
        muted: "#5B6169",
        faint: "#8A8F96",
        border: "#E2E5E1",
        brand: {
          DEFAULT: "#2C4BE2",
          dark: "#1B32A8",
          light: "#EEF1FD",
        },
        critical: { DEFAULT: "#D0264B", bg: "#FCEAEE" },
        high: { DEFAULT: "#C2540E", bg: "#FDF0E6" },
        medium: { DEFAULT: "#9C7500", bg: "#FBF3DC" },
        low: { DEFAULT: "#1F8A5F", bg: "#E9F6EF" },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        panel: "0 1px 2px rgba(20,23,26,0.04), 0 1px 12px rgba(20,23,26,0.03)",
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseDot: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.35" },
        },
      },
      animation: {
        rise: "rise 0.35s ease-out both",
        pulseDot: "pulseDot 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
