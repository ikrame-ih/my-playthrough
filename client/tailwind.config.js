/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#0B1120",
          panel: "#161D2F",
          input: "#0F172A",
          surface: "#1e293b",
          surface2: "#334155",
          accent: "#2DD4BF",
          tealBtn: "#36D7B7",
          blue: "#007BFF",
        },
      },
      fontFamily: {
        sans: [
          '"Plus Jakarta Sans"',
          "system-ui",
          "Segoe UI",
          "sans-serif",
        ],
      },
      boxShadow: {
        figma:
          "0 4px 24px -4px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.055), inset 0 1px 0 0 rgba(255,255,255,0.04)",
        "figma-lg":
          "0 12px 40px -8px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 0 rgba(255,255,255,0.05)",
        "glow-sm":
          "0 0 24px -8px rgba(45, 212, 191, 0.22), 0 0 0 1px rgba(45, 212, 191, 0.08)",
      },
      keyframes: {
        /** Solo opacidad: si el último keyframe incluye transform, el relleno de la
         * animación deja transform en el ancestro y `position:fixed` de los modales
         * deja de ser respecto al viewport (hay que desplazar el scroll para verlos). */
        "page-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "line-glow": {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "0.9" },
        },
      },
      animation: {
        "page-in": "page-in 0.4s cubic-bezier(0.22, 1, 0.36, 1) both",
        "line-glow": "line-glow 4s ease-in-out infinite",
      },
      backgroundImage: {
        "app-radial":
          "radial-gradient(ellipse 100% 72% at 50% -18%, rgba(45, 212, 191, 0.11), transparent 52%), radial-gradient(ellipse 65% 48% at 100% 0%, rgba(34, 211, 238, 0.07), transparent 45%), radial-gradient(ellipse 50% 42% at 0% 92%, rgba(45, 212, 191, 0.05), transparent 48%), linear-gradient(180deg, rgba(45, 212, 191, 0.03) 0%, transparent 28%, transparent 72%, rgba(34, 211, 238, 0.025) 100%)",
        "card-shine":
          "linear-gradient(140deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.02) 42%, transparent 52%)",
        "side-fade":
          "linear-gradient(90deg, rgba(45, 212, 191, 0.07) 0%, transparent 38%)",
      },
    },
  },
  plugins: [],
};
