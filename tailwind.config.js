/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  future: { hoverOnlyWhenSupported: true },
  theme: {
    extend: {
      colors: {
        night: "#05060A",
        ink: "#EEF2FF",
        mute: "#A3ACC2",
        dim: "#6E7891",
        azure: "#4D8DFF",
        skyb: "#8EC5FF",
        iris: "#8B7CFF",
        orchid: "#B07CFF",
        /* the current product's colours, swapped on :root when Beauty or Dev is chosen */
        accent: "rgb(var(--accent) / <alpha-value>)",
        accent2: "rgb(var(--accent2) / <alpha-value>)",
      },
      fontFamily: {
        display: ['"Outfit Variable"', "system-ui", "sans-serif"],
        body: ['"Plus Jakarta Sans Variable"', "system-ui", "sans-serif"],
        serif: ['"Instrument Serif"', "Georgia", "serif"],
        mono: ['"Geist Mono"', "ui-monospace", "monospace"],
      },
      borderRadius: { "4xl": "2rem", "5xl": "2.5rem" },
      transitionTimingFunction: { "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)", "in-out-quart": "cubic-bezier(0.76, 0, 0.24, 1)" },
    },
  },
  plugins: [],
};
