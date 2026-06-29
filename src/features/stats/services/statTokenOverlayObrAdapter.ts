import type { StatTrackedToken } from "../statTypes";
import { createTokenOverlayPlan } from "./statTokenOverlayPlan";
import { renderOverlayPlanToSvg } from "./statTokenOverlaySvg";
import { createTokenSyncPayload } from "./statTokenSync";

export const STAT_OVERLAY_METADATA_KEY = "tactical-gm-suite/stats-overlay";
export const STAT_OVERLAY_KIND = "stats-token-overlay";

export type StatOverlayObrMetadata = {
  kind: typeof STAT_OVERLAY_KIND;
  tokenId: string;
  sourceItemId: string;
  overlayId: string;
  updatedAt: string;
};

export type StatOverlayObrPreparedImage = {
  overlayId: string;
  sourceItemId: string;
  tokenId: string;
  tokenName: string;
  svgDataUrl: string;
  width: number;
  height: number;
  itemCount: number;
  metadata: StatOverlayObrMetadata;
};

export type StatOverlayObrPrepareStatus =
  | "ready"
  | "not-linked"
  | "empty"
  | "invalid";

export type StatOverlayObrPrepareResult = {
  status: StatOverlayObrPrepareStatus;
  reason?: string;
  preparedImage?: StatOverlayObrPreparedImage;
};

export type StatOverlayObrPreparationReport = {
  readyCount: number;
  notLinkedCount: number;
  emptyCount: number;
  invalidCount: number;
  preparedImageCount: number;
  summary: string;
  results: StatOverlayObrPrepareResult[];
};

function createMetadata(
  token: StatTrackedToken,
  sourceItemId: string,
  overlayId: string,
): StatOverlayObrMetadata {
  return {
    kind: STAT_OVERLAY_KIND,
    tokenId: token.id,
    sourceItemId,
    overlayId,
    updatedAt: token.updatedAt,
  };
}

export function prepareOverlayImageForObr(
  token: StatTrackedToken,
): StatOverlayObrPrepareResult {
  const payload = createTokenSyncPayload(token);

  if (payload.status === "not-linked") {
    return { status: "not-linked", reason: "Token non lié à un item Owlbear." };
  }

  if (payload.status === "empty") {
    return { status: "empty", reason: "Aucun item prévu pour affichage token." };
  }

  const plan = createTokenOverlayPlan(payload);
  if (!plan) {
    return { status: "invalid", reason: "Plan overlay impossible à générer." };
  }

  const rendered = renderOverlayPlanToSvg(plan);
  if (!rendered.dataUrl || rendered.width <= 0 || rendered.height <= 0) {
    return { status: "invalid", reason: "SVG local invalide." };
  }

  return {
    status: "ready",
    preparedImage: {
      overlayId: plan.overlayId,
      sourceItemId: plan.sourceItemId,
      tokenId: plan.tokenId,
      tokenName: plan.tokenName,
      svgDataUrl: rendered.dataUrl,
      width: rendered.width,
      height: rendered.height,
      itemCount: rendered.itemCount,
      metadata: createMetadata(token, plan.sourceItemId, plan.overlayId),
    },
  };
}

export function prepareOverlayImagesForObr(
  tokens: StatTrackedToken[],
): StatOverlayObrPrepareResult[] {
  return tokens.map(prepareOverlayImageForObr);
}

export function getOverlayObrPrepareSummary(
  result: StatOverlayObrPrepareResult,
): string {
  if (result.status === "ready") return "OBR prêt · image SVG préparée";
  if (result.status === "not-linked") return "Non lié Owlbear";
  if (result.status === "empty") return "Aucun item à afficher";
  return "Invalide";
}

export function createObrOverlayPreparationReport(
  tokens: StatTrackedToken[],
): StatOverlayObrPreparationReport {
  const results = prepareOverlayImagesForObr(tokens);
  const readyCount = results.filter((result) => result.status === "ready").length;
  const notLinkedCount = results.filter(
    (result) => result.status === "not-linked",
  ).length;
  const emptyCount = results.filter((result) => result.status === "empty").length;
  const invalidCount = results.filter((result) => result.status === "invalid").length;
  const preparedImageCount = results.filter((result) => result.preparedImage).length;

  return {
    readyCount,
    notLinkedCount,
    emptyCount,
    invalidCount,
    preparedImageCount,
    results,
    summary: `${readyCount} prêt${readyCount > 1 ? "s" : ""} · ${preparedImageCount} image${preparedImageCount > 1 ? "s" : ""} préparée${preparedImageCount > 1 ? "s" : ""}`,
  };
}
