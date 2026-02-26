import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary palette
        "cloud-white": "#FAFBFF",
        "sky-blue": "#7CB9E8",
        "deep-sky": "#4A90D9",
        twilight: "#2C3E6B",
        "golden-hour": "#F5A623",
        "sunrise-coral": "#FF7E6B",

        // Dark dreamy palette
        "night-sky": "#0a0e1a",
        "deep-night": "#111b33",
        "midnight": "#1a2a4a",
        "stardust": "#c5d5f0",

        // Neutrals
        "soft-gray": "#F0F2F5",
        "warm-gray": "#9BA3AF",
        charcoal: "#2D3748",

        // Semantic
        success: "#68D391",
        warning: "#F6AD55",
        error: "#FC8181",
      },
      fontFamily: {
        heading: ['"Bungee Shade"', "sans-serif"],
        body: ['"IBM Plex Mono"', "monospace"],
      },
      borderRadius: {
        card: "16px",
        button: "12px",
        input: "10px",
      },
      boxShadow: {
        card: "0 2px 12px rgba(44, 62, 107, 0.08)",
        "card-hover": "0 4px 20px rgba(44, 62, 107, 0.12)",
        button: "0 2px 8px rgba(74, 144, 217, 0.25)",
        glow: "0 0 30px rgba(74, 144, 217, 0.2)",
        "glow-lg": "0 0 60px rgba(74, 144, 217, 0.3)",
      },
      spacing: {
        18: "4.5rem",
        88: "22rem",
        128: "32rem",
      },
    },
  },
  plugins: [],
};

export default config;
