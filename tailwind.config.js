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
          DEFAULT: "#22C55E",
          100: "#E8FAEF",
          200: "#D0F5DF",
          300: "#B4EDC6",
          400: "#7FDD98",
          500: "#22C55E",
          600: "#16A34A",
          700: "#15803D",
          800: "#166534",
          900: "#14532D",
        },

        neutral: {
          50: "#FFFFFF",
          100: "#F9FAFB",
          200: "#F3F4F6",
          300: "#E5E7EB",
          400: "#D1D5DB",
          500: "#9CA3AF",
          600: "#6B7280",
          700: "#4B5563",
          800: "#374151",
          900: "#111827",
        },

        softPink: "#FBCFE8",
        pink: "#EC4899",

        softLilac: "#EDE9FE",
        lilac: "#A78BFA",

        softOrange: "#FFEDD5",
        orange: "#FB923C",

        softRed: "#FEE2E2",
        redAccent: "#EF4444",
      },
    },
  },
  plugins: [],
};