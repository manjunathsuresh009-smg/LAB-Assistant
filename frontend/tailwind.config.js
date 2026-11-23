/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#070A12",
        surface: "#0A0F1A",
        panel: "#0F1522",
        panel2: "#141C2C",
        line: "#1D2737",
        gold: "#D9B36C",
        goldsoft: "#F1DAA8",
        electric: "#7AA7FF",
        electricsoft: "#A9C5FF",
        cream: "#F4F1E9",
        muted: "#8C95A8",
        success: "#5BD6A2",
        danger: "#F27C7C",
        warn: "#F2C063",
      },
      fontFamily: {
        sans: ["Manrope", "system-ui", "sans-serif"],
        display: ["Fraunces", "Georgia", "serif"],
      },
      boxShadow: {
        premium: "0 24px 70px -30px rgba(0, 0, 0, 0.85)",
        goldglow: "0 0 0 1px rgba(217, 179, 108, 0.35), 0 18px 60px -24px rgba(217, 179, 108, 0.35)",
        lift: "0 30px 80px -40px rgba(0, 0, 0, 0.95), 0 0 0 1px rgba(255, 255, 255, 0.06)",
      },
      backgroundImage: {
        "grid-fade":
          "linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)",
        "gold-sheen":
          "linear-gradient(120deg, #E8C98D 0%, #D9B36C 45%, #B98E45 100%)",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        shimmer: "shimmer 2.4s linear infinite",
      },
    },
  },
  plugins: [],
};
