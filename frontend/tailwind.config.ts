import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#087F9C", light: "#E5F6F8" },
        accent: { purple: "#6957A5", yellow: "#D79A2B" },
        surface: { DEFAULT: "#F9FCFD", muted: "#EDF3F5" },
        border: { DEFAULT: "#CFDCE2" },
        text: { primary: "#10232E", secondary: "#607581" },
      },
      boxShadow: {
        card: "0 18px 46px rgba(17, 49, 62, 0.09)",
      },
      borderRadius: { xl: "8px", "2xl": "10px" },
    },
  },
  plugins: [],
};
export default config;
