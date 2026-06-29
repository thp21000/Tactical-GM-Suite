import type {
  StatTokenOverlayPlan,
  StatTokenOverlayPlanItem,
} from "./statTokenOverlayPlan";
import { getTrackerIcon } from "./statTrackerIcons";

export type StatTokenOverlaySvgRenderOptions = {
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  accentColor?: string;
};

export type StatTokenOverlaySvgRenderResult = {
  svg: string;
  dataUrl: string;
  width: number;
  height: number;
  itemCount: number;
};

const DEFAULT_BACKGROUND_COLOR = "rgba(21, 24, 34, 0.88)";
const DEFAULT_TEXT_COLOR = "#f6f3ff";
const DEFAULT_BORDER_COLOR = "rgba(255, 255, 255, 0.26)";
const DEFAULT_ACCENT_COLOR = "#b995ff";
const EMPTY_OVERLAY_WIDTH = 120;
const EMPTY_OVERLAY_HEIGHT = 24;
const ICON_WIDTH = 18;

export function escapeSvgText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function getOverlaySvgSize(plan: StatTokenOverlayPlan): {
  width: number;
  height: number;
} {
  if (plan.items.length === 0) {
    return { width: EMPTY_OVERLAY_WIDTH, height: EMPTY_OVERLAY_HEIGHT };
  }

  const width = Math.max(
    ...plan.items.map((item) => item.x + item.width),
    plan.layout.itemWidth,
  );
  const height = Math.max(
    ...plan.items.map((item) => item.y + item.height),
    plan.layout.itemHeight,
  );

  return { width, height };
}

function renderBar(item: StatTokenOverlayPlanItem, options: Required<StatTokenOverlaySvgRenderOptions>): string {
  if (item.mode !== "bar") return "";

  const barX = item.x + 6;
  const barY = item.y + item.height - 6;
  const barWidth = Math.max(12, item.width - 12);
  const fillWidth = Math.max(8, Math.round(barWidth * 0.62));

  return `
    <rect x="${barX}" y="${barY}" width="${barWidth}" height="3" rx="1.5" fill="${escapeSvgText(options.borderColor)}" opacity="0.5" />
    <rect x="${barX}" y="${barY}" width="${fillWidth}" height="3" rx="1.5" fill="${escapeSvgText(options.accentColor)}" opacity="0.9" />`;
}

function renderItem(
  item: StatTokenOverlayPlanItem,
  plan: StatTokenOverlayPlan,
  options: Required<StatTokenOverlaySvgRenderOptions>,
): string {
  const icon = getTrackerIcon(item.iconId);
  const label = item.mode === "icon" ? "" : item.label;
  const textX = item.mode === "icon" ? item.x + item.width / 2 : item.x + ICON_WIDTH + 8;
  const textAnchor = item.mode === "icon" ? "middle" : "start";
  const labelMaxWidth = Math.max(0, item.width - ICON_WIDTH - 10);
  const fontSize = plan.style.fontSize;

  return `
  <g aria-label="${escapeSvgText(item.title || item.label)}">
    <rect x="${item.x}" y="${item.y}" width="${item.width}" height="${item.height}" rx="7" fill="${escapeSvgText(options.backgroundColor)}" stroke="${escapeSvgText(options.borderColor)}" stroke-width="1" opacity="${plan.style.opacity}" />
    <text x="${item.x + 7}" y="${item.y + Math.round(item.height / 2) + 4}" font-size="${fontSize}" fill="${escapeSvgText(options.textColor)}">${escapeSvgText(icon.symbol)}</text>
    ${label ? `<text x="${textX}" y="${item.y + Math.round(item.height / 2) + 4}" font-size="${fontSize}" fill="${escapeSvgText(options.textColor)}" text-anchor="${textAnchor}" textLength="${labelMaxWidth}" lengthAdjust="spacingAndGlyphs">${escapeSvgText(label)}</text>` : ""}
    ${renderBar(item, options)}
  </g>`;
}

function normalizeOptions(
  options: StatTokenOverlaySvgRenderOptions = {},
): Required<StatTokenOverlaySvgRenderOptions> {
  return {
    backgroundColor: options.backgroundColor ?? DEFAULT_BACKGROUND_COLOR,
    textColor: options.textColor ?? DEFAULT_TEXT_COLOR,
    borderColor: options.borderColor ?? DEFAULT_BORDER_COLOR,
    accentColor: options.accentColor ?? DEFAULT_ACCENT_COLOR,
  };
}

export function renderOverlayPlanToSvg(
  plan: StatTokenOverlayPlan,
  options?: StatTokenOverlaySvgRenderOptions,
): StatTokenOverlaySvgRenderResult {
  const normalizedOptions = normalizeOptions(options);
  const { width, height } = getOverlaySvgSize(plan);
  const body = plan.items.length > 0
    ? plan.items.map((item) => renderItem(item, plan, normalizedOptions)).join("\n")
    : `<rect x="0" y="0" width="${width}" height="${height}" rx="7" fill="${escapeSvgText(normalizedOptions.backgroundColor)}" stroke="${escapeSvgText(normalizedOptions.borderColor)}" stroke-width="1" opacity="${plan.style.opacity}" />
  <text x="${Math.round(width / 2)}" y="${Math.round(height / 2) + 4}" font-size="${plan.style.fontSize}" fill="${escapeSvgText(normalizedOptions.textColor)}" text-anchor="middle">Stats</text>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escapeSvgText(plan.tokenName)}" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <title>${escapeSvgText(plan.tokenName)}</title>
${body}
</svg>`;

  return {
    svg,
    dataUrl: renderOverlayPlanToDataUrl({ ...plan, items: plan.items }, normalizedOptions),
    width,
    height,
    itemCount: plan.items.length,
  };
}

export function renderOverlayPlanToDataUrl(
  plan: StatTokenOverlayPlan,
  options?: StatTokenOverlaySvgRenderOptions,
): string {
  const normalizedOptions = normalizeOptions(options);
  const { width, height } = getOverlaySvgSize(plan);
  const body = plan.items.length > 0
    ? plan.items.map((item) => renderItem(item, plan, normalizedOptions)).join("\n")
    : `<rect x="0" y="0" width="${width}" height="${height}" rx="7" fill="${escapeSvgText(normalizedOptions.backgroundColor)}" stroke="${escapeSvgText(normalizedOptions.borderColor)}" stroke-width="1" opacity="${plan.style.opacity}" />
  <text x="${Math.round(width / 2)}" y="${Math.round(height / 2) + 4}" font-size="${plan.style.fontSize}" fill="${escapeSvgText(normalizedOptions.textColor)}" text-anchor="middle">Stats</text>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escapeSvgText(plan.tokenName)}" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <title>${escapeSvgText(plan.tokenName)}</title>
${body}
</svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}
