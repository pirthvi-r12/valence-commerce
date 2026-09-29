import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        obsidian: "#07080B",
        ink: "#0D0F15",
        bone: "#F8F9FA",
        lime: "#D4FF00",
        signal: "#10B981",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        sans: ["var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        lift: "0 30px 80px rgba(0,0,0,0.45)",
      },
    },
  },
  plugins: [],
};

export default config;
