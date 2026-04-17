import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#D4A574", dark: "#B8895C", light: "#E8C9A8" },
        accent: { DEFAULT: "#E8A0BF", light: "#F5C8DE" },
        teal: { DEFAULT: "#0f766e", dark: "#0a6158", light: "#14b8a6" },
        sage: { DEFAULT: "#e6f0eb", dark: "#c8ddd0" },
        bg: { DEFAULT: "#FFF5EE", white: "#FFFFFF", soft: "#FDE8D8", warm: "#F9EDE3" },
        txt: { DEFAULT: "#3D2B1F", light: "#6B5445", muted: "#7D6E62" },
        surface: "#FFFFFF",
        border: "#E8DDD5",
        card: "#FFFFFF",
        foreground: "#3D2B1F",
        background: "#FFF5EE",
      },
      fontFamily: {
        heading: ["var(--font-heading)", "Georgia", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        brand: "18px",
        "brand-sm": "10px",
        "brand-full": "50px",
      },
      boxShadow: {
        "warm-sm": "0 1px 3px 0 rgba(212,165,116,0.12), 0 1px 2px -1px rgba(212,165,116,0.08)",
        "warm-md": "0 4px 12px -2px rgba(212,165,116,0.16), 0 2px 6px -2px rgba(212,165,116,0.10)",
        "warm-lg": "0 10px 25px -5px rgba(212,165,116,0.18), 0 4px 10px -5px rgba(212,165,116,0.10)",
        "warm-xl": "0 20px 40px -10px rgba(212,165,116,0.22), 0 8px 16px -8px rgba(212,165,116,0.12)",
        "warm-2xl": "0 25px 50px -12px rgba(212,165,116,0.28)",
        "warm-glow": "0 0 20px -5px rgba(212,165,116,0.25)",
        "teal-glow": "0 0 20px -5px rgba(15,118,110,0.25)",
        "glass-inner": "inset 0 0 25px -5px rgba(212,165,116,0.08)",
      },
      keyframes: {
        "liquid-float": {
          "0%, 100%": { transform: "translateY(0) scale(1) rotate(0deg)" },
          "33%": { transform: "translateY(-8px) scale(1.02) rotate(1deg)" },
          "66%": { transform: "translateY(4px) scale(0.98) rotate(-1deg)" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 15px -5px rgba(212,165,116,0.2)" },
          "50%": { boxShadow: "0 0 25px -5px rgba(212,165,116,0.4)" },
        },
        "mesh-shift": {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        reveal: {
          from: { opacity: "0", transform: "translateY(25px)" },
          to: { opacity: "1", transform: "none" },
        },
      },
      animation: {
        "liquid-float": "liquid-float 8s ease-in-out infinite",
        "glow-pulse": "glow-pulse 3s ease-in-out infinite",
        "mesh-shift": "mesh-shift 15s ease infinite",
        shimmer: "shimmer 2s ease-in-out infinite",
        float: "float 4s ease-in-out infinite",
        "pulse-soft": "pulse-soft 3s ease-in-out infinite",
        reveal: "reveal 0.6s ease forwards",
      },
    },
  },
  plugins: [],
};
export default config;
