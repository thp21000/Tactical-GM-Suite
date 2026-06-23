import type { Theme as ObrTheme } from "@owlbear-rodeo/sdk";
import { deriveBorder, deriveMutedText, lighten, withAlpha } from "./colorUtils";

type ObrThemeWithOptionalDivider = ObrTheme & { divider?: string };

export type TgmThemeSource = "fallback" | "owlbear";

export type TgmTheme = {
  source: TgmThemeSource;
  mode?: ObrTheme["mode"];
  accent?: string;
  obr?: {
    backgroundDefault: string;
    backgroundPaper: string;
    primaryMain: string;
    secondaryMain: string;
    textPrimary: string;
    textSecondary: string;
    divider?: string;
  };
  variables: Record<string, string>;
};

export const fallbackTgmTheme: TgmTheme = {
  source: "fallback",
  mode: "DARK",
  accent: "#b995ff",
  obr: {
    backgroundDefault: "#202230",
    backgroundPaper: "#282a3a",
    primaryMain: "#b995ff",
    secondaryMain: "#f59e0b",
    textPrimary: "#f5f5f7",
    textSecondary: "#b8bac7",
  },
  variables: {
    "--tgm-obr-bg": "#202230",
    "--tgm-obr-surface": "#282a3a",
    "--tgm-obr-surface-hover": "#303245",
    "--tgm-obr-border": "rgba(255, 255, 255, 0.10)",
    "--tgm-obr-text": "#f5f5f7",
    "--tgm-obr-text-muted": "#b8bac7",
    "--tgm-obr-accent": "#b995ff",
    "--tgm-bg": "rgba(32, 34, 48, 0.92)",
    "--tgm-bg-soft": "rgba(38, 40, 56, 0.88)",
    "--tgm-surface": "rgba(42, 44, 62, 0.86)",
    "--tgm-surface-strong": "rgba(48, 50, 70, 0.92)",
    "--tgm-surface-glass": "rgba(42, 44, 62, 0.74)",
    "--tgm-app-panel": "rgba(36, 38, 52, 0.90)",
    "--tgm-app-panel-soft": "rgba(43, 45, 62, 0.82)",
    "--tgm-app-panel-border": "rgba(255, 255, 255, 0.12)",
    "--tgm-app-panel-shadow": "rgba(0, 0, 0, 0.34)",
    "--tgm-border": "rgba(255, 255, 255, 0.10)",
    "--tgm-border-strong": "rgba(255, 255, 255, 0.18)",
    "--tgm-text": "#f5f5f7",
    "--tgm-text-muted": "#b8bac7",
    "--tgm-accent": "#b995ff",
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
  const typedTheme = theme as ObrThemeWithOptionalDivider;
  const defaultBackground = theme.background.default;
  const paperBackground = theme.background.paper;
  const primary = theme.primary.main;
  const divider = typedTheme.divider;
  const hoverSurface = lighten(paperBackground, theme.mode === "LIGHT" ? 0.08 : 0.12);

  return {
    source: "owlbear",
    mode: theme.mode,
    accent: primary,
    obr: {
      backgroundDefault: defaultBackground,
      backgroundPaper: paperBackground,
      primaryMain: primary,
      secondaryMain: theme.secondary.main,
      textPrimary: theme.text.primary,
      textSecondary: theme.text.secondary,
      divider,
    },
    variables: {
      ...fallbackTgmTheme.variables,
      "--tgm-obr-bg": defaultBackground,
      "--tgm-obr-surface": paperBackground,
      "--tgm-obr-surface-hover": hoverSurface,
      "--tgm-obr-border": divider ?? deriveBorder(theme.mode),
      "--tgm-obr-text": theme.text.primary,
      "--tgm-obr-text-muted": theme.text.secondary,
      "--tgm-obr-accent": primary,
      "--tgm-bg": withAlpha(defaultBackground, 0.94),
      "--tgm-bg-soft": withAlpha(paperBackground, 0.86),
      "--tgm-surface": withAlpha(paperBackground, 0.88),
      "--tgm-surface-glass": withAlpha(paperBackground, 0.76),
      "--tgm-surface-strong": withAlpha(hoverSurface, 0.96),
      "--tgm-app-panel": withAlpha(paperBackground, 0.90),
      "--tgm-app-panel-soft": withAlpha(lighten(paperBackground, 0.06), 0.84),
      "--tgm-app-panel-border": divider ?? "rgba(255, 255, 255, 0.12)",
      "--tgm-app-panel-shadow": "rgba(0, 0, 0, 0.34)",
      "--tgm-border": divider ?? deriveBorder(theme.mode),
      "--tgm-border-strong": divider ? withAlpha(lighten(divider, 0.18), 0.72) : deriveBorder(theme.mode, true),
      "--tgm-text": theme.text.primary,
      "--tgm-text-muted": deriveMutedText(theme.text.secondary, fallbackTgmTheme.variables["--tgm-text-muted"]),
      "--tgm-accent": primary,
      "--tgm-danger": theme.secondary.dark || fallbackTgmTheme.variables["--tgm-danger"],
      "--tgm-warning": theme.secondary.main || fallbackTgmTheme.variables["--tgm-warning"],
      "--tgm-success": theme.primary.light || fallbackTgmTheme.variables["--tgm-success"],
    },
  };
}

export function applyThemeVariables(theme: TgmTheme, target: HTMLElement = document.documentElement) {
  Object.entries(theme.variables).forEach(([key, value]) => {
    target.style.setProperty(key, value);
  });
}
