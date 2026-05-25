import { ProductSection } from "@/components/product-section";

export default function Home() {
  return (
    <div className="py-6">
      <ProductSection title="Produse populare" type="popular" />
      <ProductSection title="Promoții" type="promotions" />
      <ProductSection title="Noutăți" type="new" />
    </div>
  );
}
