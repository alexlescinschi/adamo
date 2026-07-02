"use client";

import { CartCheckoutContent } from "@/components/cart-checkout";

// ponytail: /cart randează aceeași componentă ca drawer-ul — zero duplicare.
export default function CartPage() {
  return (
    <div className="py-6 md:py-8">
      <div className="mx-auto max-w-2xl">
        <CartCheckoutContent />
      </div>
    </div>
  );
}
