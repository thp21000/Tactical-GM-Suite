export type RgbColor = {
  r: number;
  g: number;
  b: number;
};

export function hexToRgb(hex: string): RgbColor | null {
  const normalized = hex.trim().replace(/^#/, "");
  const value = normalized.length === 3
    ? normalized.split("").map((part) => part + part).join("")
    : normalized;

  if (!/^[0-9a-fA-F]{6}$/.test(value)) {
    return null;
  }

  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  };
}

export function withAlpha(color: string, alpha: number): string {
  const rgb = hexToRgb(color);

  if (!rgb) {
    return color;
  }

  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

export function deriveGlassSurface(color: string, alpha = 0.52): string {
  return withAlpha(color, alpha);
}

export function deriveBorder(mode: "DARK" | "LIGHT" | undefined, strong = false): string {
  if (mode === "LIGHT") {
    return strong ? "rgba(15, 23, 42, 0.18)" : "rgba(15, 23, 42, 0.10)";
  }

  return strong ? "rgba(255, 255, 255, 0.20)" : "rgba(255, 255, 255, 0.12)";
}

export function deriveMutedText(textColor: string, fallback: string): string {
  return textColor || fallback;
}
