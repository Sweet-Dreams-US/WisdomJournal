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
        // Primary palette — "paper by day, night at the rail"
        // cloud-white warmed from cold blue-white to morning paper; the
        // blue/gold ambient auras supply the sky, the surface supplies warmth.
        "cloud-white": "#FBFAF7",
        "sky-blue": "#7CB9E8",
        "deep-sky": "#4A90D9",
        twilight: "#2C3E6B",
        "golden-hour": "#F5A623",
        "sunrise-coral": "#FF7E6B",

        // Dark dreamy palette
        "night-sky": "#0a0e1a",
        "deep-night": "#111b33",
        midnight: "#1a2a4a",
        stardust: "#c5d5f0",

        // Warm accents (nostalgic warmth)
        "warm-amber": "#F8E8D0",
        "soft-lavender": "#E8E0F0",
        "dusty-rose": "#F0D8D8",

        // Neutrals — charcoal is now true ink-navy so every existing
        // text-charcoal/NN class shifts from anonymous gray to the brand's
        // ink voice in one move. Hierarchy comes from 3 opacity stops
        // (full, /65, /45), not six shades of whisper.
        "soft-gray": "#F1F0EC",
        "warm-gray": "#9BA3AF",
        charcoal: "#26314F",

        // Semantic
        success: "#68D391",
        warning: "#F6AD55",
        error: "#FC8181",
      },
      fontFamily: {
        heading: ["var(--font-heading)", "Georgia", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        card: "16px",
        button: "12px",
        input: "10px",
      },
      boxShadow: {
        card: "0 2px 12px rgba(44, 62, 107, 0.06)",
        "card-hover": "0 8px 32px rgba(44, 62, 107, 0.12)",
        "card-glow":
          "0 0 20px rgba(74, 144, 217, 0.08), 0 2px 12px rgba(44, 62, 107, 0.06)",
        button: "0 2px 8px rgba(74, 144, 217, 0.25)",
        glow: "0 0 30px rgba(74, 144, 217, 0.2)",
        "glow-lg": "0 0 60px rgba(74, 144, 217, 0.3)",
        "glow-warm": "0 0 30px rgba(245, 166, 35, 0.12)",
        "inner-glow": "inset 0 1px 0 rgba(255, 255, 255, 0.6)",
      },
      spacing: {
        18: "4.5rem",
        88: "22rem",
        128: "32rem",
      },
      animation: {
        "route-enter": "routeEnter 0.28s cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-in": "fadeIn 0.5s ease-out",
        "fade-in-up": "fadeInUp 0.5s ease-out",
        "fade-in-down": "fadeInDown 0.4s ease-out",
        "slide-in-left": "slideInLeft 0.3s ease-out",
        "slide-in-right": "slideInRight 0.3s ease-out",
        "scale-in": "scaleIn 0.3s ease-out",
        "glow-pulse": "glowPulse 3s ease-in-out infinite",
        "count-up": "countUp 0.6s ease-out",
        "shimmer-slow": "shimmerSlow 4s ease-in-out infinite",
        "breathe": "breathe 4s ease-in-out infinite",
        "orbit": "orbit 20s linear infinite",
        "stagger-in": "staggerIn 0.5s ease-out both",
        "gradient-shift": "gradientShift 8s ease-in-out infinite",
        "blur-in": "blurIn 0.6s ease-out",
        "bounce-subtle": "bounceSubtle 2s ease-in-out infinite",
      },
      keyframes: {
        // Route transition for (app) template.tsx — ends at "none" so the
        // wrapper never stays a containing block for fixed descendants.
        routeEnter: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "none" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeInDown: {
          "0%": { opacity: "0", transform: "translateY(-8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInLeft: {
          "0%": { opacity: "0", transform: "translateX(-8px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(8px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        glowPulse: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(74, 144, 217, 0.08)" },
          "50%": { boxShadow: "0 0 30px rgba(74, 144, 217, 0.15)" },
        },
        countUp: {
          "0%": { opacity: "0", transform: "translateY(8px) scale(0.9)" },
          "60%": { opacity: "1", transform: "translateY(-2px) scale(1.02)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        shimmerSlow: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        breathe: {
          "0%, 100%": { transform: "scale(1)", opacity: "0.7" },
          "50%": { transform: "scale(1.05)", opacity: "1" },
        },
        orbit: {
          "0%": { transform: "rotate(0deg) translateX(4px) rotate(0deg)" },
          "100%": { transform: "rotate(360deg) translateX(4px) rotate(-360deg)" },
        },
        staggerIn: {
          "0%": { opacity: "0", transform: "translateY(16px) scale(0.96)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        gradientShift: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        blurIn: {
          "0%": { opacity: "0", filter: "blur(8px)" },
          "100%": { opacity: "1", filter: "blur(0)" },
        },
        bounceSubtle: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-3px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
