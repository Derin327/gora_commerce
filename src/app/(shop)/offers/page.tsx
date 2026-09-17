import ProductCard from "@/components/shared/ProductCard";
import { getSpecialOffers } from "@/lib/data/storefront";

export const revalidate = 60;

export default async function OffersPage() {
  const displayProducts = await getSpecialOffers();

  return (
    <main className="min-h-screen bg-white">
      {/* Category Header */}
      <div className="bg-gray-50 py-16 text-center border-b border-gray-100">
        <h1 className="text-3xl md:text-4xl font-bold tracking-widest uppercase text-red-600">
          Special Offers
        </h1>
        <p className="mt-4 text-sm text-gray-500 max-w-lg mx-auto">
          Shop our exclusive deals, stock clearances, and featured discounts. Limited time only.
        </p>
      </div>

      {/* Products Grid */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-16">
        <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-4">
          <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
            {displayProducts.length} Special Offer{displayProducts.length !== 1 ? "s" : ""}
          </span>
        </div>

        {displayProducts.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8">
            {displayProducts.map(prod => (
              <ProductCard key={prod.id} {...prod} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24">
            <h2 className="text-xl font-medium text-gray-500 uppercase tracking-widest">
              No special offers available at the moment.
            </h2>
          </div>
        )}
      </div>
    </main>
  );
}
