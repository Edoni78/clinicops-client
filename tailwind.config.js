/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        clinic: {
          50: "#f4f8fb",
          100: "#e8f0f6",
          200: "#d1e1ed",
          300: "#a8c4d9",
          400: "#81a2c5",
          500: "#6b94b3",
          600: "#567a94",
          700: "#456276",
          800: "#3a5162",
          900: "#334453",
        },
      },
      boxShadow: {
    card: "0 1px 2px 0 rgb(15 23 42 / 0.04), 0 1px 3px 0 rgb(15 23 42 / 0.06)",
    "card-md": "0 4px 12px -2px rgb(15 23 42 / 0.08), 0 2px 4px -2px rgb(15 23 42 / 0.04)",
    "card-lg": "0 12px 32px -8px rgb(15 23 42 / 0.12), 0 4px 8px -4px rgb(15 23 42 / 0.04)",
    sidebar: "4px 0 24px -4px rgb(15 23 42 / 0.08)",
    topbar: "0 1px 0 0 rgb(15 23 42 / 0.06), 0 4px 16px -4px rgb(15 23 42 / 0.06)",
  },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.25rem",
      },
    },
  },
  plugins: [],
};
