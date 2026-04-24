import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#f7f8fa",
          100: "#eef0f4",
          200: "#d8dde5",
          300: "#b4bcca",
          400: "#8591a5",
          500: "#5a677c",
          600: "#3e4a5e",
          700: "#2c3545",
          800: "#1c2230",
          900: "#0e121c",
          950: "#070910",
        },
        brand: {
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
        },
        amber: {
          500: "#f59e0b",
          600: "#d97706",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(14, 18, 28, 0.04), 0 4px 12px rgba(14, 18, 28, 0.04)",
        pop: "0 1px 2px rgba(14, 18, 28, 0.06), 0 8px 24px rgba(14, 18, 28, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
