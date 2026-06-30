export const BADGE_LABELS = ["Sticker"];

const BADGE_STYLES: Record<string, { label: string; gradient: string }> = {
  gaming:  { label: "Gaming",  gradient: "from-[#833AB4] via-[#FD1D1D] to-[#FCB045]" },
  premium: { label: "Premium", gradient: "from-[#020024] via-[#090979] to-[#2C8799]" },
  ieftin:  { label: "Ieftin",  gradient: "from-red-600 to-red-500" },
  oled:    { label: "OLED",    gradient: "from-gray-900 to-gray-700" },
};

const POPULAR_LABELS = ["popular", "популярный"];
const SPEC_LABELS = ["display", "rezolutie", "serie-procesor", "memorie-ram", "capacitatea-hard-disk", "tip-stocare", "tip-placa-video"];

export function extractBadge(item: any): { badge?: string; badge_type?: "green"; badge_gradient?: string } {
  const specs = item.specs || item.attributes || [];
  if (!Array.isArray(specs)) return {};
  const sticker = specs.find((s: any) => s.code === "sticker" && s.valueLabel && s.valueLabel !== "No");
  if (!sticker) return {};
  const slug = sticker.filterLink?.value || "";
  const style = BADGE_STYLES[slug];
  if (!style) return {};
  return { badge: style.label, badge_type: "green", badge_gradient: style.gradient };
}

export function hasAttribute(item: any, label: string): boolean {
  const specs = item.specs || [];
  if (!Array.isArray(specs)) return false;
  const searchLabels = POPULAR_LABELS.includes(label) ? POPULAR_LABELS : [label];
  return specs.some((s: any) => searchLabels.includes(s.label) && s.valueLabel);
}

export function extractSpecs(item: any): string[] {
  const raw = item.specs || item.shortSpecs || item.attributes || [];
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((s: any) => SPEC_LABELS.includes(s.code) && s.valueLabel && s.valueLabel !== "No")
    .sort((a, b) => SPEC_LABELS.indexOf(a.code) - SPEC_LABELS.indexOf(b.code))
    .map((s: any) => s.valueLabel);
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
    images: item.images?.length > 0 
      ? item.images.map((img: any) => img.url).filter(Boolean)
      : (item.imageUrl || item.previewImageUrl ? [item.imageUrl || item.previewImageUrl] : []),
    // unit_id real din CRM (ex: produs 1377 → unit 1882). ponytail: fallback product.id doar daca CRM nu intoarce unit.
    unit_id: item.units?.[0]?.id ?? item.offerSummary?.priceTiers?.[0]?.representativeUnitId ?? item.id,
    // stockCount vine pe cardul de storefront; units_on_warehouse pe detail.
    stock: item.stockCount ?? item.units_on_warehouse ?? undefined,
    specs: extractSpecs(item),
    ...badge,
  };
}

export function extractProducts(data: any): any[] {
  const items = data?.items || data || [];
  return Array.isArray(items) ? items.map(mapProductCard) : [];
}
