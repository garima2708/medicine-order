import { addToCartAction } from "./actions";
import { getCartSummary, getMedicines } from "@/lib/db";
import CartPopup from "@/components/cart-popup";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "USD",
});

export default function Home() {
  const medicines = getMedicines();
  const cart = getCartSummary();

  return (
    <div className="min-h-screen bg-slate-100 py-10 font-sans text-slate-900">
      <header className="mx-auto mb-6 flex w-full max-w-6xl items-center justify-between px-4">
        <div>
          <h1 className="text-2xl font-bold">Medicine Order Website</h1>
          <p className="mt-1 text-sm text-slate-600">
            Browse medicines and add them to your cart.
          </p>
        </div>
        <CartPopup
          totalItems={cart.totalItems}
          totalPriceFormatted={currency.format(cart.totalPrice)}
          items={cart.items}
        />
      </header>

      <main className="mx-auto w-full max-w-6xl px-4">
        <section className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">Medicine Catalog</h2>
          <p className="mt-2 text-sm text-slate-600">
            Available products: {medicines.length}
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {medicines.map((medicine) => (
              <article
                key={medicine.id}
                className="rounded-lg border border-slate-200 bg-slate-50 p-4"
              >
                <h2 className="font-semibold">{medicine.name}</h2>
                <p className="mt-1 text-sm text-slate-600">
                  {medicine.description}
                </p>
                <p className="mt-3 text-sm font-medium">
                  {currency.format(medicine.price)}
                </p>
                <form action={addToCartAction} className="mt-3">
                  <input
                    type="hidden"
                    name="medicineId"
                    value={medicine.id}
                  />
                  <button
                    type="submit"
                    className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
                  >
                    Add to cart
                  </button>
                </form>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
