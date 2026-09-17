import ProductCard from "@/components/shared/ProductCard";
import { searchProducts } from "@/lib/data/storefront";

export default async function SearchPage({ searchParams }: { searchParams: { q?: string; cat?: string; color?: string; size?: string } }) {
  const query = searchParams.q || "";
  const catParam = searchParams.cat || "";
  const colorParam = searchParams.color || "";
  const sizeParam = searchParams.size || "";

  const categories = catParam ? catParam.split(',').filter(Boolean) : [];
  const colors = colorParam ? colorParam.split(',').filter(Boolean) : [];
  const sizes = sizeParam ? sizeParam.split(',').filter(Boolean) : [];

  const searchResults = await searchProducts({ query, categories, colors, sizes });

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-12 md:py-20">
        <h1 className="text-3xl font-medium tracking-wide text-black mb-2 text-center">
          Search Results
        </h1>
        {query ? (
          <p className="text-center text-gray-500 mb-12 uppercase tracking-widest text-sm">
            Showing {searchResults.length} results for "{query}"
          </p>
        ) : (
          <p className="text-center text-gray-500 mb-12 uppercase tracking-widest text-sm">
            {searchResults.length} Products Found
          </p>
        )}

        {searchResults.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
            {searchResults.map((prod: any) => (
              <ProductCard key={prod.id} {...prod} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-gray-50 border border-dashed border-gray-200 mt-8 rounded-lg">
            <h2 className="text-xl font-bold text-gray-900 uppercase tracking-widest mb-4">
              No exact matches found.
            </h2>
            <p className="text-gray-500 font-medium max-w-md mx-auto">
              We couldn't find exactly what you're looking for with these specific filters. Try adjusting your search query or removing some filters.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
