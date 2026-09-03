import { getConditionAssetUrls } from "./statConditionAssets";
import { STAT_TRACKER_ICONS } from "./statTrackerIcons";

const PRELOAD_CONCURRENCY = 4;
let preloadPromise: Promise<void> | null = null;

function toAbsoluteAssetUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  if (typeof window === "undefined") return url;

  try {
    return new URL(url, window.location.href).href;
  } catch {
    return url;
  }
}

function getStatPngAssetUrls(): string[] {
  const conditionUrls = getConditionAssetUrls();
  const trackerUrls = STAT_TRACKER_ICONS.flatMap((icon) =>
    icon.src ? [toAbsoluteAssetUrl(icon.src)] : [],
  );

  // Conditions are intentionally first because their context menu is image-heavy.
  return [...new Set([...conditionUrls, ...trackerUrls])];
}

function preloadImage(url: string): Promise<void> {
  if (typeof Image === "undefined") return Promise.resolve();

  return new Promise((resolve) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve();
    image.onerror = () => resolve();
    image.src = url;
  });
}

async function preloadWithLimit(urls: string[]): Promise<void> {
  let nextIndex = 0;

  const worker = async () => {
    while (nextIndex < urls.length) {
      const index = nextIndex;
      nextIndex += 1;
      const url = urls[index];
      if (url) await preloadImage(url);
    }
  };

  await Promise.all(
    Array.from(
      { length: Math.min(PRELOAD_CONCURRENCY, urls.length) },
      () => worker(),
    ),
  );
}

/**
 * Warm the browser image cache from Owlbear's permanent background iframe.
 * This never blocks context-menu registration or room startup and runs once per
 * background document. Later popovers/embeds reuse the same HTTP cache entries.
 */
export function preloadStatPngAssets(): Promise<void> {
  if (!preloadPromise) {
    preloadPromise = preloadWithLimit(getStatPngAssetUrls()).catch(() => undefined);
  }
  return preloadPromise;
}
