export type KrDeepView = "battle" | "shop" | "collection" | "monetization" | "leaderboard" | "share" | "push";

const VIEWS: KrDeepView[] = ["battle", "shop", "collection", "monetization", "leaderboard", "share", "push"];

export function parseRunFlag(url: URL): boolean {
  const v = (url.searchParams.get("run") ?? "").toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

export function parseView(url: URL): KrDeepView | null {
  const raw = (url.searchParams.get("view") ?? "").toLowerCase();
  if (!raw) return null;
  return VIEWS.includes(raw as KrDeepView) ? (raw as KrDeepView) : null;
}

export function stripDeepLinkParams(url: URL, keys: string[]) {
  for (const k of keys) url.searchParams.delete(k);
  window.history.replaceState({}, "", url.toString());
}

export function scrollToSection(view: KrDeepView) {
  const el = document.getElementById(`kr-section-${view}`);
  el?.scrollIntoView({ behavior: "smooth", block: "start" });
}
