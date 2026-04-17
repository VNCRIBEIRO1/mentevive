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
        primary: { DEFAULT: "#5B9BD5", dark: "#4680B4", light: "#8BC1EB" },
        accent: { DEFAULT: "#6ECFF6", light: "#9BDEF8" },
        teal: { DEFAULT: "#5EADA5", dark: "#43918A", light: "#7ECAC2" },
        sage: { DEFAULT: "#1F2331", dark: "#181C28" },
        bg: { DEFAULT: "#111520", white: "#1A1E2B", soft: "#161A25", warm: "#1D2130" },
        txt: { DEFAULT: "#E1E5ED", light: "#9DA4B3", muted: "#6C7384" },
        surface: "#1A1E2B",
        border: "#2B3042",
        card: "#1D2130",
        foreground: "#E1E5ED",
        background: "#111520",
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
        "warm-sm": "0 1px 3px 0 rgba(0,0,0,0.2), 0 1px 2px -1px rgba(91,155,213,0.08)",
        "warm-md": "0 4px 12px -2px rgba(0,0,0,0.25), 0 2px 6px -2px rgba(91,155,213,0.10)",
        "warm-lg": "0 10px 25px -5px rgba(0,0,0,0.3), 0 4px 10px -5px rgba(91,155,213,0.10)",
        "warm-xl": "0 20px 40px -10px rgba(0,0,0,0.35), 0 8px 16px -8px rgba(91,155,213,0.12)",
        "warm-2xl": "0 25px 50px -12px rgba(0,0,0,0.4)",
        "warm-glow": "0 0 20px -5px rgba(91,155,213,0.25)",
        "teal-glow": "0 0 20px -5px rgba(94,173,165,0.3)",
        "glass-inner": "inset 0 0 25px -5px rgba(91,155,213,0.08)",
      },
      keyframes: {
        "liquid-float": {
          "0%, 100%": { transform: "translateY(0) scale(1) rotate(0deg)" },
          "33%": { transform: "translateY(-8px) scale(1.02) rotate(1deg)" },
          "66%": { transform: "translateY(4px) scale(0.98) rotate(-1deg)" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 15px -5px rgba(91,155,213,0.2)" },
          "50%": { boxShadow: "0 0 25px -5px rgba(91,155,213,0.4)" },
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
