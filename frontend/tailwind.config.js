/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ["Inter", "sans-serif"] },
      colors: {
        brand: { DEFAULT: "#2563eb", light: "#3b82f6", dark: "#1d4ed8" },
        teal: { DEFAULT: "#0891b2", light: "#06b6d4" },
        success: "#16a34a",
        warning: "#d97706",
        danger: "#dc2626",
        surface: "#f8fafc",
        muted: "#64748b",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        "card-hover": "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        glow: "0 0 0 3px rgb(37 99 235 / 0.15)",
      },
    },
  },
  plugins: [],
}
