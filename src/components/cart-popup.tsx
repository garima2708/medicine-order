"use client";

import { useEffect, useRef, useState } from "react";
import { addToCartAction, decreaseCartItemAction } from "@/app/actions";

type CartItem = {
  medicineId: number;
  medicineName: string;
  price: number;
  quantity: number;
};

type CartPopupProps = {
  totalItems: number;
  totalPriceFormatted: string;
  items: CartItem[];
};

export default function CartPopup({
  totalItems,
  totalPriceFormatted,
  items,
}: CartPopupProps) {
  const currency = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "USD",
  });

  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!containerRef.current) {
        return;
      }

      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <circle cx="9" cy="20" r="1.5" />
          <circle cx="18" cy="20" r="1.5" />
          <path d="M3 4h2l2.2 10.5a1 1 0 0 0 1 .8h9.8a1 1 0 0 0 1-.8L21 7H7" />
        </svg>
        <span>
          Cart ({totalItems}) • {totalPriceFormatted}
        </span>
      </button>

      {open ? (
        <div className="absolute right-0 z-20 mt-2 w-80 rounded-lg border border-slate-200 bg-white p-4 text-slate-900 shadow-lg">
          <h3 className="text-sm font-semibold">Cart Items</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {items.length === 0 ? (
              <li className="text-slate-500">Your cart is empty.</li>
            ) : (
              items.map((item) => (
                <li
                  key={item.medicineId}
                  className="rounded-md border border-slate-200 px-3 py-2"
                >
                  <p className="font-medium">{item.medicineName}</p>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <p className="text-slate-600">
                      Qty: {item.quantity} | Price: {currency.format(item.price)}
                    </p>
                    <div className="flex items-center gap-1">
                      <form action={decreaseCartItemAction}>
                        <input
                          type="hidden"
                          name="medicineId"
                          value={item.medicineId}
                        />
                        <button
                          type="submit"
                          className="h-7 w-7 rounded-md border border-slate-300 text-sm font-semibold hover:bg-slate-100"
                          aria-label={`Decrease ${item.medicineName} quantity`}
                        >
                          -
                        </button>
                      </form>
                      <form action={addToCartAction}>
                        <input
                          type="hidden"
                          name="medicineId"
                          value={item.medicineId}
                        />
                        <button
                          type="submit"
                          className="h-7 w-7 rounded-md border border-slate-300 text-sm font-semibold hover:bg-slate-100"
                          aria-label={`Increase ${item.medicineName} quantity`}
                        >
                          +
                        </button>
                      </form>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
