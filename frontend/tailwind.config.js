/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#660033",
          50:  "#fdf2f6",
          100: "#fce7f0",
          200: "#fbc9dd",
          300: "#f899bf",
          400: "#f3579a",
          500: "#e82b76",
          600: "#cc1159",
          700: "#a80d49",
          800: "#880d3e",
          900: "#660033",
          950: "#420020",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          muted: "#F9FAFB",
          border: "#E5E7EB",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"],
      },
      boxShadow: {
        card: "0 1px 4px 0 rgba(0,0,0,0.08), 0 0 1px 0 rgba(0,0,0,0.04)",
        "card-hover": "0 4px 16px 0 rgba(0,0,0,0.12), 0 0 1px 0 rgba(0,0,0,0.06)",
      },
      borderRadius: {
        card: "12px",
      },
    },
  },
  plugins: [],
};
