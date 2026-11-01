import { loadFont as loadFraunces } from "@remotion/google-fonts/Fraunces";
import { loadFont as loadJetBrainsMono } from "@remotion/google-fonts/JetBrainsMono";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { Easing } from "remotion";

const fraunces = loadFraunces("normal", {
  weights: ["500", "600", "700"],
  subsets: ["latin"],
});

const jetbrainsMono = loadJetBrainsMono("normal", {
  weights: ["500", "700"],
  subsets: ["latin"],
});

const inter = loadInter("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export const FONTS = {
  display: fraunces.fontFamily,
  mono: jetbrainsMono.fontFamily,
  ui: inter.fontFamily,
  cvSerif: "Georgia, 'Times New Roman', serif",
} as const;

export const PALETTE = {
  paper: "#F6F3EC",
  paperWarm: "#EFE9DC",
  paperDeep: "#E5DEC9",
  ink: "#14213D",
  inkMuted: "#4A5568",
  accent: "#FF5A36",
  accentSoft: "#FFE4DC",
  machineBg: "#0F1626",
  machineSurface: "#162038",
  machineLine: "#253559",
  appAccent: "#1F4D3A",
  appAccentSoft: "#EEF4F1",
  appBg: "#F7F7F5",
  danger: "#D92D20",
  success: "#16A34A",
  white: "#FFFFFF",
} as const;

export const GITHUB_REPO_URL = "https://github.com/gastin11/ats-cv-builder";
export const GITHUB_REPO_SHORT = "github.com/gastin11/ats-cv-builder";

export const EASINGS = {
  outQuart: Easing.bezier(0.16, 1, 0.3, 1),
  outBack: Easing.bezier(0.34, 1.56, 0.64, 1),
  inQuad: Easing.bezier(0.55, 0.085, 0.68, 0.53),
  inOutCubic: Easing.bezier(0.65, 0, 0.35, 1),
};
