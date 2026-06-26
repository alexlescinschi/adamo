export const BADGE_LABELS = ["Sticker"];
const POPULAR_LABELS = ["popular", "популярный"];

function extractBadge(item: any): { badge?: string; badge_type?: "green" } {
  const specs = item.specs || item.attributes || [];
  if (Array.isArray(specs)) {
    const rec = specs.find((s: any) => BADGE_LABELS.includes(s.label) && s.valueLabel);
    if (rec) return { badge: rec.valueLabel as string, badge_type: "green" };
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
    .filter((s: any) => s.label && s.valueLabel && !BADGE_LABELS.includes(s.label))
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
    // unit_id real din CRM (ex: produs 1377 → unit 1882). ponytail: fallback product.id doar daca CRM nu intoarce unit.
    unit_id: item.units?.[0]?.id ?? item.offerSummary?.priceTiers?.[0]?.representativeUnitId ?? item.id,
    specs: extractSpecs(item),
    ...badge,
  };
}

export function extractProducts(data: any): any[] {
  const items = data?.items || data || [];
  return Array.isArray(items) ? items.map(mapProductCard) : [];
}
