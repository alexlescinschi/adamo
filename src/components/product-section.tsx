import { ProductCard } from "./product-card";

interface Product {
  id: number | string;
  name: string;
  slug: string;
  price: number;
  old_price?: number;
  image_url?: string | null;
  unit_id: number | string;
}

interface ProductSectionProps {
  title: string;
  products: Product[];
}

export function ProductSection({ title, products }: ProductSectionProps) {
  if (products.length === 0) return null;

  return (
    <section className="py-8">
      <h2 className="mb-4 text-xl font-bold">{title}</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
