// Normalization for CRM category lists used in navigation.
// A CRM category exposes (depending on context): id, slug (or
// storefrontPathSlug), name (or translation.name). We support both variants,
// matching how the rest of the codebase reads category fields.

export interface CatalogCategory {
  id: number;
  slug: string;
  name: string;
}

export function extractCategories(data: unknown): CatalogCategory[] {
  const raw: any[] = Array.isArray(data) ? data : (data as any)?.items || [];
  return raw
    .map((c: any): CatalogCategory => ({
      id: c.id,
      slug: c.storefrontPathSlug || c.slug,
      name: c.name || c.translation?.name || c.slug,
    }))
    .filter((c: CatalogCategory) => c.slug);
}
