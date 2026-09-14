import { buildShape, type Item } from "@owlbear-rodeo/sdk";
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
  // Owlbear ne charge pas de façon fiable les images distantes imbriquées dans
  // un data: SVG. On conserve donc l'URL PNG native ici ; le rendu inactif est
  // assuré par son cadre atténué tant qu'un pipeline PNG désaturé n'est pas prêt.
  void width;
  void height;
  return url;
}

function safeAccentColor(color: string): string {
  return /^#[0-9a-f]{3,8}$/i.test(color) ? color : "#d85c72";
}

function shapeItem(
  token: StatTrackedToken,
  sourceItemId: string,
  metadata: StatOverlayObrMetadata,
  id: string,
  shapeType: "RECTANGLE" | "CIRCLE",
  x: number,
  y: number,
  width: number,
  height: number,
  fillColor: string,
  fillOpacity: number,
  zIndex: number,
): Item {
  return buildShape()
    .id(id)
    .name(`Stats Dock — ${token.name}`)
    .width(Math.max(0.5, width))
    .height(Math.max(0.5, height))
    .shapeType(shapeType)
    .fillColor(fillColor)
    .fillOpacity(fillOpacity)
    .strokeColor(fillColor)
    .strokeOpacity(0)
    .strokeWidth(0)
    .position({ x: x + width / 2, y: y + height / 2 })
    .rotation(0)
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

function pillItems(
  token: StatTrackedToken,
  sourceItemId: string,
  metadata: StatOverlayObrMetadata,
  id: string,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
  opacity: number,
  zIndex: number,
): Item[] {
  const h = Math.max(0.5, height);
  const w = Math.max(h, width);
  const radius = h / 2;
  const centerWidth = Math.max(0.5, w - h);

  return [
    shapeItem(
      token,
      sourceItemId,
      metadata,
      `${id}-left`,
      "CIRCLE",
      x,
      y,
      h,
      h,
      color,
      opacity,
      zIndex,
    ),
    shapeItem(
      token,
      sourceItemId,
      metadata,
      `${id}-center`,
      "RECTANGLE",
      x + radius,
      y,
      centerWidth,
      h,
      color,
      opacity,
      zIndex,
    ),
    shapeItem(
      token,
      sourceItemId,
      metadata,
      `${id}-right`,
      "CIRCLE",
      x + w - h,
      y,
      h,
      h,
      color,
      opacity,
      zIndex,
    ),
  ];
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
  void sceneDpi;

  const trackX = target.minX + 53 * scale;
  const trackY = target.minY + 34 * scale;
  const trackWidth = Math.max(30 * scale, target.width - 63 * scale);
  const trackHeight = 10 * scale;

  const result: Item[] = [];
  result.push(
    ...pillItems(
      token,
      sourceItemId,
      metadata,
      `${baseId}-pill-track-outer`,
      trackX,
      trackY,
      trackWidth,
      trackHeight,
      "#6f6656",
      1,
      -22,
    ),
  );

  const trackInset = 1.25 * scale;
  const innerX = trackX + trackInset;
  const innerY = trackY + trackInset;
  const innerWidth = Math.max(4 * scale, trackWidth - trackInset * 2);
  const innerHeight = Math.max(3 * scale, trackHeight - trackInset * 2);
  result.push(
    ...pillItems(
      token,
      sourceItemId,
      metadata,
      `${baseId}-pill-track-inner`,
      innerX,
      innerY,
      innerWidth,
      innerHeight,
      "#090c10",
      1,
      -20,
    ),
  );

  const max = Math.max(0, tracker.max ?? 0);
  const current = Math.max(0, tracker.current ?? 0);
  const ratio = max > 0 ? Math.min(1, current / max) : 0;
  if (ratio <= 0) return result;

  const fillInset = 0.75 * scale;
  const fillX = innerX + fillInset;
  const fillY = innerY + fillInset;
  const fillHeight = Math.max(2 * scale, innerHeight - fillInset * 2);
  const fillAvailableWidth = Math.max(fillHeight, innerWidth - fillInset * 2);
  const fillWidth = Math.min(
    fillAvailableWidth,
    Math.max(fillHeight, fillAvailableWidth * ratio),
  );
  const accent = safeAccentColor(tracker.accentColor);

  result.push(
    ...pillItems(
      token,
      sourceItemId,
      metadata,
      `${baseId}-pill-fill`,
      fillX,
      fillY,
      fillWidth,
      fillHeight,
      accent,
      1,
      -16,
    ),
  );

  const shineInsetX = 1.5 * scale;
  const shineWidth = Math.max(0, fillWidth - shineInsetX * 2);
  const shineHeight = Math.max(0.75 * scale, 1.4 * scale);
  if (shineWidth >= shineHeight) {
    result.push(
      ...pillItems(
        token,
        sourceItemId,
        metadata,
        `${baseId}-pill-shine`,
        fillX + shineInsetX,
        fillY + 0.8 * scale,
        shineWidth,
        shineHeight,
        "#ffffff",
        0.28,
        -14,
      ),
    );
  }

  return result;
}
