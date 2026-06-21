export function extractSpecs(item: any): string[] {
  if (item.cardSpecs) {
    return String(item.cardSpecs).split("|").map((s: string) => s.trim()).filter(Boolean).slice(0, 5);
  }
  const raw = item.specs || item.shortSpecs || item.attributes || [];
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((s: any) => s.label && s.valueLabel)
    .slice(0, 5)
    .map((s: any) => `${s.label}: ${s.valueLabel}`);
}

export function extractProducts(data: any): any[] {
  const items = data?.items || data || [];
  return Array.isArray(items) ? items.map((item: any) => ({
    id: item.id,
    name: item.storefrontName || item.name,
    slug: item.slug,
    price: item.offerSummary?.minPrice || item.minPrice || item.price || 0,
    old_price: item.discount?.compareAtPrice || item.discount?.originalPrice || item.oldPrice || item.old_price,
    image_url: item.imageUrl || item.previewImageUrl || null,
    unit_id: item.id,
    specs: extractSpecs(item),
  })) : [];
}
