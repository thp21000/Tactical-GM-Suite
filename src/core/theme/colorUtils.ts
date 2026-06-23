export type RgbColor = {
  r: number;
  g: number;
  b: number;
};

function clampChannel(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

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

function rgbToHex({ r, g, b }: RgbColor): string {
  return `#${[r, g, b].map((channel) => clampChannel(channel).toString(16).padStart(2, "0")).join("")}`;
}

export function mix(colorA: string, colorB: string, amount: number): string {
  const rgbA = hexToRgb(colorA);
  const rgbB = hexToRgb(colorB);

  if (!rgbA || !rgbB) {
    return colorA;
  }

  const ratio = Math.max(0, Math.min(1, amount));

  return rgbToHex({
    r: rgbA.r + (rgbB.r - rgbA.r) * ratio,
    g: rgbA.g + (rgbB.g - rgbA.g) * ratio,
    b: rgbA.b + (rgbB.b - rgbA.b) * ratio,
  });
}

export function lighten(color: string, amount: number): string {
  return mix(color, "#ffffff", amount);
}

export function darken(color: string, amount: number): string {
  return mix(color, "#000000", amount);
}

export function withAlpha(color: string, alpha: number): string {
  const rgb = hexToRgb(color);

  if (!rgb) {
    return color;
  }

  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

export function deriveGlassSurface(color: string, alpha = 0.76): string {
  return withAlpha(color, alpha);
}

export function deriveBorder(mode: "DARK" | "LIGHT" | undefined, strong = false): string {
  if (mode === "LIGHT") {
    return strong ? "rgba(15, 23, 42, 0.18)" : "rgba(15, 23, 42, 0.10)";
  }

  return strong ? "rgba(255, 255, 255, 0.18)" : "rgba(255, 255, 255, 0.10)";
}

export function deriveMutedText(textColor: string, fallback: string): string {
  return textColor || fallback;
}
