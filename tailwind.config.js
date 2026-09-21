/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Plus Jakarta Sans", "system-ui", "-apple-system", "sans-serif"],
      },
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
        card: "0 1px 2px 0 rgb(15 23 42 / 0.04)",
        "card-md": "0 1px 2px 0 rgb(15 23 42 / 0.05)",
        "card-lg": "0 4px 12px -2px rgb(15 23 42 / 0.08)",
        sidebar: "none",
        topbar: "none",
      },
      borderRadius: {
        lg: "0.375rem",
        xl: "0.375rem",
        "2xl": "0.375rem",
        "3xl": "0.5rem",
      },
    },
  },
  plugins: [],
};
