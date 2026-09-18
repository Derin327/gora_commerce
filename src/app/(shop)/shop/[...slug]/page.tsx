import ProductCard from "@/components/shared/ProductCard";
import { getProductsByCategory } from "@/lib/data/storefront";

const fallbackProducts = [
  {
    id: "p1",
    name: "Graffiti Wash Drop-Shoulder Shirt",
    category: "shirts",
    originalPrice: 1599,
    discountedPrice: 990,
    discountPercentage: 27,
    imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80",
    variants: [],
  },
  {
    id: "p2",
    name: "Classic Overdyed Checkered Shirt",
    category: "shirts",
    originalPrice: 2199,
    discountedPrice: 1499,
    discountPercentage: 31,
    imageUrl: "https://images.unsplash.com/photo-1603252109303-2751441dd157?w=600&q=80",
    variants: [],
  },
  {
    id: "p3",
    name: "The Zephyr Plus-Size Linen Pant",
    category: "bottoms",
    originalPrice: 1319,
    discountedPrice: 989,
    discountPercentage: 25,
    imageUrl: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&q=80",
    variants: [],
  },
  {
    id: "p4",
    name: "Vintage Momfit Jean",
    category: "bottoms",
    originalPrice: 1399,
    discountedPrice: 799,
    discountPercentage: 43,
    imageUrl: "https://images.unsplash.com/photo-1582552938357-32b906df40cb?w=600&q=80",
    variants: [],
  },
  {
    id: "p6",
    name: "Classic Heavyweight Hoodie",
    category: "hoodies",
    originalPrice: 1999,
    discountedPrice: 1299,
    discountPercentage: 35,
    imageUrl: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&q=80",
    variants: [],
  },
];

export const revalidate = 60;

export default async function CategoryPage({ params, searchParams }: { params: { slug: string[] }, searchParams: { subcategory?: string } }) {
  // slug[0] is the category, slug[1] is the subcategory (if URL is /shop/bottoms/jeans)
  const categorySlug = decodeURIComponent(params.slug[0]).toLowerCase();
  
  // Accept subcategory either from the URL path or from search params
  const subcategory = params.slug[1] 
    ? decodeURIComponent(params.slug[1]).toLowerCase() 
    : searchParams?.subcategory;
  
  const { category, products: dbProducts } = await getProductsByCategory(categorySlug, subcategory);
  
  const baseTitle = category?.name || categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1);
  
  // Format subcategory for title
  const formattedSubcategory = subcategory ? subcategory.charAt(0).toUpperCase() + subcategory.slice(1) : "";
  const categoryTitle = formattedSubcategory ? `${formattedSubcategory} ${baseTitle}` : baseTitle;
  
  const categoryDesc = category?.description || `Explore our collection of premium ${categoryTitle}. Every piece in this category is carefully curated for quality and style.`;

  // Fallback to mock if database has no products for this category yet
  // If subcategory is requested but no mock products match perfectly, we might just show an empty list instead of mocking it wrongly, but let's stick to the current fallback.
  let displayProducts: any[] = dbProducts;
  if (dbProducts.length === 0) {
    displayProducts = fallbackProducts.filter(p => p.category.toLowerCase() === categorySlug);
    // If a specific subcategory is selected, don't show general fallback products (which don't have subcategory data)
    if (subcategory) {
      displayProducts = [];
    }
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Category Header */}
      <div className="bg-gray-50 py-16 text-center border-b border-gray-100">
        <h1 className="text-3xl md:text-4xl font-bold tracking-widest uppercase text-black">
          {categoryTitle}
        </h1>
        <p className="mt-4 text-sm text-gray-500 max-w-lg mx-auto">
          {categoryDesc}
        </p>
      </div>

      {/* Products Grid */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-16">
        <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-4">
          <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
            {displayProducts.length} Product{displayProducts.length !== 1 ? "s" : ""} Found
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
              There is no product in this category
            </h2>
          </div>
        )}
      </div>
    </main>
  );
}
