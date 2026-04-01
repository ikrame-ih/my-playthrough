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
          "radial-gradient(ellipse 90% 60% at 50% -15%, rgba(45, 212, 191, 0.09), transparent 55%)",
        "card-shine":
          "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 50%)",
      },
    },
  },
  plugins: [],
};
