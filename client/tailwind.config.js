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
        sans: ["Inter", "DM Sans", "system-ui", "Segoe UI", "sans-serif"],
      },
      boxShadow: {
        figma:
          "0 4px 24px -4px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255,255,255,0.04)",
        "figma-lg":
          "0 12px 40px -8px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255,255,255,0.05)",
      },
      backgroundImage: {
        "app-radial":
          "radial-gradient(ellipse 100% 72% at 50% -18%, rgba(45, 212, 191, 0.13), transparent 52%), radial-gradient(ellipse 65% 48% at 100% 0%, rgba(34, 211, 238, 0.08), transparent 45%), radial-gradient(ellipse 50% 42% at 0% 92%, rgba(45, 212, 191, 0.06), transparent 48%), linear-gradient(180deg, rgba(45, 212, 191, 0.035) 0%, transparent 26%, transparent 74%, rgba(34, 211, 238, 0.028) 100%)",
        "card-shine":
          "linear-gradient(135deg, rgba(255,255,255,0.07) 0%, transparent 52%)",
      },
    },
  },
  plugins: [],
};
