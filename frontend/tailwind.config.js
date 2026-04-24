/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#660033",
          50: "#fff0f5",
          100: "#ffd6e7",
          200: "#ffadd0",
          300: "#ff80b5",
          400: "#f95c9c",
          500: "#e83a83",
          600: "#cc2266",
          700: "#a8144d",
          800: "#880d3a",
          900: "#660033",
          950: "#4d0026",
        },
        surface: {
          DEFAULT: "#ffffff",
          muted: "#f9fafb",
          border: "#e5e7eb",
        },
      },
      borderRadius: {
        card: "0.75rem",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0,0,0,0.08), 0 1px 2px -1px rgba(0,0,0,0.04)",
        "card-hover": "0 4px 12px 0 rgba(0,0,0,0.10), 0 2px 4px -2px rgba(0,0,0,0.06)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};