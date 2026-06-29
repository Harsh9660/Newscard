/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        nc: {
          bg: "#0d1117",
          panel: "#12122a",
          card: "#1e1e2e",
          border: "#3a3a5c",
          accent: "#e94560",
          text: "#e6edf3",
          muted: "#a0a0b0",
        },
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
};
