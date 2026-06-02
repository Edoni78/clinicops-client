/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        clinic: {
          50: "rgb(var(--color-clinic-50) / <alpha-value>)",
          100: "rgb(var(--color-clinic-100) / <alpha-value>)",
          200: "rgb(var(--color-clinic-200) / <alpha-value>)",
          300: "rgb(var(--color-clinic-300) / <alpha-value>)",
          400: "rgb(var(--color-clinic-400) / <alpha-value>)",
          500: "rgb(var(--color-clinic-500) / <alpha-value>)",
          600: "rgb(var(--color-clinic-600) / <alpha-value>)",
          700: "rgb(var(--color-clinic-700) / <alpha-value>)",
          800: "rgb(var(--color-clinic-800) / <alpha-value>)",
          900: "rgb(var(--color-clinic-900) / <alpha-value>)",
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
