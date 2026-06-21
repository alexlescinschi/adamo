"use client";

import { Check } from "lucide-react";

interface CartCheckboxProps {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  label: string;
}

// Shared checkbox used in cart-drawer and cart page. Defined at module level
// (not inside another component) so it doesn't remount on every parent render.
export function CartCheckbox({ checked, indeterminate, onChange, label }: CartCheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      onClick={onChange}
      aria-label={label}
      aria-checked={indeterminate ? "mixed" : checked}
      className={`flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-[5px] border transition-colors ${
        checked || indeterminate ? "border-[#63ad36] bg-[#63ad36] text-white" : "border-[#c4c4c4] bg-white hover:border-[#63ad36]"
      }`}
    >
      {indeterminate ? <span className="h-[2px] w-[10px] rounded-full bg-white" /> : checked ? <Check className="h-3 w-3" /> : null}
    </button>
  );
}
