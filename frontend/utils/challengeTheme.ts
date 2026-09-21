import type { CSSProperties } from "react";

interface ChallengeTheme {
  accent: string;
  deep: string;
  soft: string;
  border: string;
  rgb: string;
}

type ChallengeThemeStyle = CSSProperties & {
  "--category-accent": string;
  "--category-deep": string;
  "--category-soft": string;
  "--category-border": string;
  "--category-rgb": string;
};

const THEMES: Record<string, ChallengeTheme> = {
  water: {
    accent: "#1687df",
    deep: "#0d5f9f",
    soft: "rgba(22, 135, 223, 0.105)",
    border: "rgba(22, 135, 223, 0.28)",
    rgb: "22 135 223",
  },
  health: {
    accent: "#e9414c",
    deep: "#a72736",
    soft: "rgba(233, 65, 76, 0.09)",
    border: "rgba(233, 65, 76, 0.25)",
    rgb: "233 65 76",
  },
  energy: {
    accent: "#6ea646",
    deep: "#466f2f",
    soft: "rgba(110, 166, 70, 0.105)",
    border: "rgba(110, 166, 70, 0.29)",
    rgb: "110 166 70",
  },
  cyber: {
    accent: "#9851cd",
    deep: "#663394",
    soft: "rgba(152, 81, 205, 0.09)",
    border: "rgba(152, 81, 205, 0.25)",
    rgb: "152 81 205",
  },
  aerospace: {
    accent: "#ee6838",
    deep: "#aa3f20",
    soft: "rgba(238, 104, 56, 0.095)",
    border: "rgba(238, 104, 56, 0.27)",
    rgb: "238 104 56",
  },
  default: {
    accent: "#087f9c",
    deep: "#075f75",
    soft: "rgba(8, 127, 156, 0.09)",
    border: "rgba(8, 127, 156, 0.25)",
    rgb: "8 127 156",
  },
};

const CHALLENGE_LOGOS: Record<string, string> = {
  water: "/challenge-icons/water-sustainability.png",
  health: "/challenge-icons/health-nutrition.png",
  energy: "/challenge-icons/energy-environment.png",
  cyber: "/challenge-icons/cyber-security.png",
  aerospace: "/challenge-icons/aerospace-aviation.png",
};

function getChallengeKey(category = ""): keyof typeof THEMES {
  const value = category.toLocaleLowerCase();
  if (value.includes("water")) return "water";
  if (value.includes("health") || value.includes("nutrition")) return "health";
  if (value.includes("energy") || value.includes("environment")) return "energy";
  if (value.includes("cyber") || value.includes("security")) return "cyber";
  if (value.includes("aerospace") || value.includes("aviation")) return "aerospace";
  return "default";
}

export function getChallengeTheme(category = ""): ChallengeTheme {
  return THEMES[getChallengeKey(category)];
}

export function getChallengeLogo(category = ""): string | null {
  return CHALLENGE_LOGOS[getChallengeKey(category)] || null;
}

export function getChallengeThemeStyle(category = ""): ChallengeThemeStyle {
  const theme = getChallengeTheme(category);
  return {
    "--category-accent": theme.accent,
    "--category-deep": theme.deep,
    "--category-soft": theme.soft,
    "--category-border": theme.border,
    "--category-rgb": theme.rgb,
  };
}
