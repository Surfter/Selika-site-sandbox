/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#EEF2FF",
        mute: "#98A2B8",
        dim: "#6B7590",
        sky: "#8EC5FF",
        azure: "#4D8DFF",
        violet: "#8B7CFF",
        orchid: "#B07CFF",
        night: "#05060A",
      },
      fontFamily: {
        display: ['"Outfit"', "system-ui", "sans-serif"],
        body: ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      borderRadius: { "3xl": "1.75rem", "4xl": "2.25rem" },
    },
  },
  plugins: [],
};
