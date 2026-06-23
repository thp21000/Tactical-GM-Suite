import type { Theme as ObrTheme } from "@owlbear-rodeo/sdk";
import { deriveBorder, deriveGlassSurface, deriveMutedText, withAlpha } from "./colorUtils";

export type TgmThemeSource = "fallback" | "owlbear";

export type TgmTheme = {
  source: TgmThemeSource;
  mode?: ObrTheme["mode"];
  accent?: string;
  variables: Record<string, string>;
};

export const fallbackTgmTheme: TgmTheme = {
  source: "fallback",
  mode: "DARK",
  accent: "#c084fc",
  variables: {
    "--tgm-bg": "rgba(15, 17, 23, 0.54)",
    "--tgm-bg-soft": "rgba(20, 24, 33, 0.42)",
    "--tgm-surface": "rgba(24, 28, 38, 0.58)",
    "--tgm-surface-strong": "rgba(31, 36, 49, 0.76)",
    "--tgm-surface-glass": "rgba(24, 28, 38, 0.38)",
    "--tgm-border": "rgba(255, 255, 255, 0.14)",
    "--tgm-border-strong": "rgba(255, 255, 255, 0.22)",
    "--tgm-text": "#f3f4f6",
    "--tgm-text-muted": "#a5adba",
    "--tgm-accent": "#c084fc",
    "--tgm-danger": "#f87171",
    "--tgm-warning": "#f59e0b",
    "--tgm-success": "#86efac",
    "--tgm-sidebar-collapsed": "48px",
    "--tgm-sidebar-expanded": "132px",
    "--tgm-radius-sm": "8px",
    "--tgm-radius-md": "12px",
    "--tgm-radius-lg": "16px",
    "--tgm-blur-glass": "18px",
    "--tgm-font-xs": "11px",
    "--tgm-font-sm": "12px",
    "--tgm-font-md": "13px",
  },
};

export function createTgmThemeFromObrTheme(theme: ObrTheme): TgmTheme {
  const defaultBackground = theme.background.default;
  const paperBackground = theme.background.paper;
  const primary = theme.primary.main;
  const isLight = theme.mode === "LIGHT";

  return {
    source: "owlbear",
    mode: theme.mode,
    accent: primary,
    variables: {
      ...fallbackTgmTheme.variables,
      "--tgm-bg": deriveGlassSurface(defaultBackground, isLight ? 0.62 : 0.54),
      "--tgm-bg-soft": deriveGlassSurface(defaultBackground, isLight ? 0.46 : 0.42),
      "--tgm-surface": deriveGlassSurface(paperBackground, isLight ? 0.68 : 0.58),
      "--tgm-surface-strong": deriveGlassSurface(paperBackground, isLight ? 0.82 : 0.76),
      "--tgm-surface-glass": deriveGlassSurface(paperBackground, isLight ? 0.52 : 0.38),
      "--tgm-border": deriveBorder(theme.mode),
      "--tgm-border-strong": deriveBorder(theme.mode, true),
      "--tgm-text": theme.text.primary,
      "--tgm-text-muted": deriveMutedText(theme.text.secondary, fallbackTgmTheme.variables["--tgm-text-muted"]),
      "--tgm-accent": primary,
      "--tgm-danger": theme.secondary.dark || fallbackTgmTheme.variables["--tgm-danger"],
      "--tgm-warning": theme.secondary.main || fallbackTgmTheme.variables["--tgm-warning"],
      "--tgm-success": withAlpha(primary, 0.88),
    },
  };
}

export function applyThemeVariables(theme: TgmTheme, target: HTMLElement = document.documentElement) {
  Object.entries(theme.variables).forEach(([key, value]) => {
    target.style.setProperty(key, value);
  });
}
