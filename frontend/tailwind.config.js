/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', "system-ui", "sans-serif"],
      },
      colors: {
        /** Enterprise UI: dark shell + indigo brand (tune here to retheme) */
        campus: {
          shell: "#09090b",
          "shell-elevated": "#18181b",
          line: "#27272a",
          brand: "#4f46e5",
          "brand-hover": "#4338ca",
          "brand-pressed": "#3730a3",
          "brand-soft": "#eef2ff",
          "brand-muted": "#c7d2fe",
        },
      },
    },
  },
  plugins: [],
};
