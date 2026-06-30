/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        nc: {
          bg: "#07090F",
          panel: "rgba(18, 24, 39, 0.6)",
          card: "rgba(18, 24, 39, 0.8)",
          border: "rgba(255, 255, 255, 0.1)",
          accent: "#6366F1",
          text: "#F8FAFC",
          muted: "#94A3B8",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        display: ["Outfit", "sans-serif"],
        mono: ["JetBrains Mono", "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
};
