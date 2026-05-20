/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#020817",
          900: "#030712",
          700: "#334155",
          500: "#64748b",
          300: "#cbd5e1",
          100: "#e5e7eb"
        },
        accent: "#3B82F6",
        accentSecondary: "#8B5CF6"
      },
      boxShadow: {
        overlay: "0 18px 80px rgba(2, 8, 23, 0.55)"
      }
    }
  },
  plugins: []
};
