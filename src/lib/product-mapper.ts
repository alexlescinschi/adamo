const BADGE_LABELS = ["Recomandat", "Рекомендуем", "Recommended"];
const POPULAR_LABELS = ["popular", "популярный"];

function extractBadge(item: any): { badge?: string; badge_type?: "green" } {
  const specs = item.specs || item.attributes || [];
  if (Array.isArray(specs)) {
    const rec = specs.find((s: any) => BADGE_LABELS.includes(s.label) && s.valueLabel);
    if (rec) return { badge: rec.label as string, badge_type: "green" };
  }
  if (typeof item.cardSpecs === "string") {
    const parts = item.cardSpecs.split("|").map((s: string) => s.trim());
    if (parts.some((p: string) => BADGE_LABELS.includes(p))) {
      return { badge: "Recomandat", badge_type: "green" };
    }
  }
  return {};
}

export function hasAttribute(item: any, label: string): boolean {
  const specs = item.specs || [];
  if (!Array.isArray(specs)) return false;
  const searchLabels = POPULAR_LABELS.includes(label) ? POPULAR_LABELS : [label];
  return specs.some((s: any) => searchLabels.includes(s.label) && s.valueLabel);
}

export function extractSpecs(item: any): string[] {
  if (item.cardSpecs) {
    return String(item.cardSpecs).split("|").map((s: string) => s.trim()).filter(Boolean).slice(0, 5);
  }
  const raw = item.specs || item.shortSpecs || item.attributes || [];
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((s: any) => s.label && s.valueLabel && s.label !== "Recomandat")
    .slice(0, 5)
    .map((s: any) => `${s.label}: ${s.valueLabel}`);
}

export function mapProductCard(item: any) {
  const badge = extractBadge(item);
  return {
    id: item.id,
    name: item.storefrontName || item.name,
    slug: item.slug,
    price: item.offerSummary?.minPrice || item.minPrice || item.price || 0,
    old_price: item.discount?.compareAtPrice || item.discount?.originalPrice || item.oldPrice || item.old_price || undefined,
    image_url: item.imageUrl || item.previewImageUrl || null,
    unit_id: item.id,
    specs: extractSpecs(item),
    ...badge,
  };
}

export function extractProducts(data: any): any[] {
  const items = data?.items || data || [];
  return Array.isArray(items) ? items.map(mapProductCard) : [];
}
