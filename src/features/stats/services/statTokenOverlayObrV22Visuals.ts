import { buildImage, type Item } from "@owlbear-rodeo/sdk";
import type { StatTrackedToken } from "../statTypes";
import type { StatOverlayObrMetadata } from "./statTokenOverlayObrAdapter";
import { STAT_OVERLAY_METADATA_KEY } from "./statTokenOverlayObrAdapter";
import type { StatTokenSyncItem } from "./statTokenSync";

export type V22Box = {
  minX: number;
  minY: number;
  width: number;
  height: number;
};

function elementMetadata(metadata: StatOverlayObrMetadata, element: string) {
  return { [STAT_OVERLAY_METADATA_KEY]: { ...metadata, element } };
}

export function grayscaleImageUrl(url: string, width: number, height: number): string {
  // Les SVG data: qui embarquent une image PNG distante sont bloqués par le
  // renderer Owlbear sur certains clients. Cela produisait les tuiles rouges
  // "Image" pour toutes les unités inactives. On réutilise donc directement
  // l'asset PNG : l'état inactif reste indiqué par le cadre atténué, sans
  // dépendance à une ressource externe imbriquée dans un SVG.
  void width;
  void height;
  return url;
}

function svgDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function safeAccentColor(color: string): string {
  return /^#[0-9a-f]{3,8}$/i.test(color) ? color : "#d85c72";
}

function trackSvgUrl(): string {
  return svgDataUrl(
    `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="24" viewBox="0 0 200 24"><defs><linearGradient id="track" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#151a20"/><stop offset="0.45" stop-color="#080a0d"/><stop offset="1" stop-color="#020304"/></linearGradient></defs><rect x="1" y="1" width="198" height="22" rx="11" fill="url(#track)" stroke="#746954" stroke-width="2"/><rect x="3" y="3" width="194" height="18" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.10" stroke-width="1"/><path d="M12 5H188" stroke="#ffffff" stroke-opacity="0.10" stroke-width="2" stroke-linecap="round"/></svg>`,
  );
}

function fillSvgUrl(color: string): string {
  const accent = safeAccentColor(color);
  return svgDataUrl(
    `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="24" viewBox="0 0 200 24"><defs><linearGradient id="fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity="0.40"/><stop offset="0.20" stop-color="${accent}"/><stop offset="0.72" stop-color="${accent}"/><stop offset="1" stop-color="#000000" stop-opacity="0.30"/></linearGradient></defs><rect x="1" y="1" width="198" height="22" rx="11" fill="${accent}" fill-opacity="0.25"/><rect x="2" y="2" width="196" height="20" rx="10" fill="url(#fill)" stroke="#ffffff" stroke-opacity="0.20" stroke-width="1.2"/><path d="M12 5.5H188" stroke="#ffffff" stroke-opacity="0.38" stroke-width="2" stroke-linecap="round"/></svg>`,
  );
}

function pillImage(
  token: StatTrackedToken,
  sourceItemId: string,
  metadata: StatOverlayObrMetadata,
  id: string,
  url: string,
  x: number,
  y: number,
  width: number,
  height: number,
  sceneDpi: number,
  zIndex: number,
): Item {
  const logicalWidth = 200;
  const logicalHeight = 24;
  return buildImage(
    { width: logicalWidth, height: logicalHeight, url, mime: "image/svg+xml" },
    { dpi: logicalWidth, offset: { x: logicalWidth / 2, y: logicalHeight / 2 } },
  )
    .id(id)
    .name(`Stats Dock — ${token.name}`)
    .position({ x: x + width / 2, y: y + height / 2 })
    .rotation(0)
    .scale({
      x: width / sceneDpi,
      y: (height * logicalWidth) / (logicalHeight * sceneDpi),
    })
    .layer("ATTACHMENT")
    .zIndex(zIndex)
    .attachedTo(sourceItemId)
    .locked(true)
    .disableHit(true)
    .disableAutoZIndex(true)
    .disableAttachmentBehavior(["COPY", "SCALE", "ROTATION"])
    .metadata(elementMetadata(metadata, id))
    .build();
}

export function roundedBarItems(
  token: StatTrackedToken,
  sourceItemId: string,
  metadata: StatOverlayObrMetadata,
  baseId: string,
  tracker: StatTokenSyncItem,
  target: V22Box,
  sceneDpi: number,
  scale: number,
): Item[] {
  const trackX = target.minX + 53 * scale;
  const trackY = target.minY + 34 * scale;
  const trackWidth = Math.max(30 * scale, target.width - 63 * scale);
  const trackHeight = 10 * scale;
  const result: Item[] = [
    pillImage(
      token,
      sourceItemId,
      metadata,
      `${baseId}-pill-track`,
      trackSvgUrl(),
      trackX,
      trackY,
      trackWidth,
      trackHeight,
      sceneDpi,
      -20,
    ),
  ];

  const max = Math.max(0, tracker.max ?? 0);
  const current = Math.max(0, tracker.current ?? 0);
  const ratio = max > 0 ? Math.min(1, current / max) : 0;
  if (ratio <= 0) return result;

  const inset = 1.5 * scale;
  const innerHeight = Math.max(2 * scale, trackHeight - inset * 2);
  const innerWidth = Math.max(2 * scale, trackWidth - inset * 2);
  const fillWidth = Math.min(innerWidth, Math.max(innerHeight, innerWidth * ratio));

  result.push(
    pillImage(
      token,
      sourceItemId,
      metadata,
      `${baseId}-pill-fill`,
      fillSvgUrl(tracker.accentColor),
      trackX + inset,
      trackY + inset,
      fillWidth,
      innerHeight,
      sceneDpi,
      -14,
    ),
  );
  return result;
}
