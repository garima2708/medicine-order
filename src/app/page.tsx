import { addToCartAction } from "./actions";
import { getCartSummary, getMedicines } from "@/lib/db";
import CartPopup from "@/components/cart-popup";
import EnvDebugButton from "@/components/env-debug-button";

function getEnvSnapshot() {
  return Object.fromEntries(
    Object.entries(process.env).sort(([a], [b]) => a.localeCompare(b)),
  );
}

/** Cart and catalog come from SQLite; avoid static prerender with a stale empty cart. */
export const dynamic = "force-dynamic";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "USD",
});

export default function Home() {
  const medicines = getMedicines();
  const cart = getCartSummary();
  const env = getEnvSnapshot();

  return (
    <div className="min-h-screen bg-slate-100 py-10 font-sans text-slate-900">
      <header className="mx-auto mb-6 w-full max-w-6xl px-4">
        <h1 className="text-2xl font-bold">Medicine Order Website</h1>
        <p className="mt-1 text-sm text-slate-600">
          Browse medicines and add them to your cart.
        </p>
        <EnvDebugButton env={env} />
      </header>

      <main className="mx-auto w-full max-w-6xl px-4">
        <section className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-bold">Medicine Catalog</h2>
              <p className="mt-2 text-sm text-slate-600">
                Available products: {medicines.length}
              </p>
            </div>
            <div className="shrink-0 sm:pt-0.5">
              <CartPopup
                totalItems={cart.totalItems}
                totalPriceFormatted={currency.format(cart.totalPrice)}
                items={cart.items}
              />
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
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
