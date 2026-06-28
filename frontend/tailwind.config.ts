import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#2563EB", light: "#EFF6FF" },
        accent: { purple: "#7C3AED", yellow: "#FACC15" },
        surface: { DEFAULT: "#FFFFFF", muted: "#F8FAFC" },
        border: { DEFAULT: "#E5E7EB" },
        text: { primary: "#111827", secondary: "#6B7280" },
      },
      boxShadow: {
        card: "0 12px 30px rgba(15, 23, 42, 0.06)",
      },
      borderRadius: { xl: "20px", "2xl": "24px" },
    },
  },
  plugins: [],
};
export default config;
