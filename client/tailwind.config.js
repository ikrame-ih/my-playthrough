/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          // Cyberpunk / high-tech surfaces
          bg: "#0B0E14",
          panel: "#11151E",
          input: "#0F141C",
          surface: "#1A1F2B",
          surface2: "#2A3142",
          // Neon accents
          accent: "#00F5FF", // cyan — primary action, focus, active
          tealBtn: "#00F5FF", // alias kept so existing .figma-btn-primary works
          blue: "#7000FF", // electric purple — secondary / links
          magenta: "#FF00E5", // hot magenta — score, alerts only
          line: "#1E2533", // hairline borders on dark
        },
      },
      fontFamily: {
        sans: [
          '"Plus Jakarta Sans"',
          "system-ui",
          "Segoe UI",
          "sans-serif",
        ],
        display: [
          '"Space Grotesk"',
          '"Plus Jakarta Sans"',
          "system-ui",
          "sans-serif",
        ],
        mono: [
          '"JetBrains Mono"',
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
      },
      boxShadow: {
        figma:
          "0 4px 24px -6px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255,255,255,0.05), inset 0 1px 0 0 rgba(255,255,255,0.04)",
        "figma-lg":
          "0 16px 48px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(0,245,255,0.10), inset 0 1px 0 0 rgba(255,255,255,0.05)",
        "glow-cyan":
          "0 0 28px -6px rgba(0, 245, 255, 0.45), 0 0 0 1px rgba(0,245,255,0.20)",
        "glow-magenta":
          "0 0 28px -6px rgba(255, 0, 229, 0.40), 0 0 0 1px rgba(255,0,229,0.18)",
        "glow-violet":
          "0 0 28px -6px rgba(112, 0, 255, 0.45), 0 0 0 1px rgba(112,0,255,0.20)",
        "glow-sm":
          "0 0 24px -8px rgba(0, 245, 255, 0.22), 0 0 0 1px rgba(0, 245, 255, 0.08)",
      },
      keyframes: {
        "page-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "line-glow": {
          "0%, 100%": { opacity: "0.35" },
          "50%": { opacity: "0.9" },
        },
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
      },
      animation: {
        "page-in": "page-in 0.4s cubic-bezier(0.22, 1, 0.36, 1) both",
        "line-glow": "line-glow 4s ease-in-out infinite",
        scan: "scan 6s linear infinite",
      },
      backgroundImage: {
        "app-radial":
          "radial-gradient(ellipse 90% 60% at 15% -10%, rgba(0, 245, 255, 0.10), transparent 55%), radial-gradient(ellipse 70% 55% at 95% 0%, rgba(255, 0, 229, 0.07), transparent 50%), radial-gradient(ellipse 60% 50% at 50% 110%, rgba(112, 0, 255, 0.10), transparent 55%), linear-gradient(180deg, rgba(0, 245, 255, 0.02) 0%, transparent 30%, transparent 70%, rgba(112, 0, 255, 0.03) 100%)",
        "card-shine":
          "linear-gradient(140deg, rgba(0,245,255,0.08) 0%, rgba(255,255,255,0.02) 38%, transparent 52%)",
        "side-fade":
          "linear-gradient(90deg, rgba(0, 245, 255, 0.06) 0%, transparent 38%)",
        "grid-faint":
          "linear-gradient(rgba(0,245,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,245,255,0.04) 1px, transparent 1px)",
        "hero-neon":
          "linear-gradient(135deg, rgba(0,245,255,0.18) 0%, rgba(112,0,255,0.22) 55%, rgba(255,0,229,0.18) 100%)",
      },
      backgroundSize: {
        "grid-32": "32px 32px",
      },
    },
  },
  plugins: [],
};
