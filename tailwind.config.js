/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './app/**/*.{js,jsx}',
    './src/**/*.{js,jsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "flash-green": {
          "0%, 100%": { backgroundColor: "transparent" },
          "50%": { backgroundColor: "rgba(74, 222, 128, 0.2)" },
        },
        "flash-red": {
            "0%, 100%": { backgroundColor: "transparent" },
            "50%": { backgroundColor: "rgba(239, 68, 68, 0.2)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "flash-green": "flash-green 0.5s ease-out",
        "flash-red": "flash-red 0.5s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}