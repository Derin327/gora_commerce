import Link from "next/link";
import { getStorefrontCategories } from "@/lib/data/storefront";

const fallbackCategories = [
  { id: "cat_1", name: "Shirts", slug: "shirts", image_url: "https://images.unsplash.com/photo-1603252109303-2751441dd157?w=600&q=80" },
  { id: "cat_2", name: "Bottoms", slug: "bottoms", image_url: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&q=80" },
  { id: "cat_3", name: "Hoodies", slug: "hoodies", image_url: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&q=80" },
  { id: "cat_4", name: "Accessories", slug: "accessories", image_url: "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=600&q=80" },
];

export default async function CategoryGrid() {
  const liveCategories = await getStorefrontCategories();
  const categories = liveCategories.length > 0 ? liveCategories : fallbackCategories;

  return (
    <div className="w-full py-16 px-4 md:px-8 bg-white">
      <h2 className="text-xl md:text-2xl font-semibold text-center mb-12 tracking-wide uppercase">
        Shop By Category
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-8 max-w-7xl mx-auto justify-items-center">
        {categories.map((cat) => (
          <Link key={cat.slug} href={`/shop/${cat.slug}`} className="group relative block aspect-[3/4] w-[75vw] sm:w-full max-w-[320px] md:max-w-none overflow-hidden bg-gray-50">
            <img
              src={cat.image_url || "https://images.unsplash.com/photo-1603252109303-2751441dd157?w=600&q=80"}
              alt={cat.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors duration-500" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="bg-white/90 text-black px-6 py-2 text-sm font-semibold tracking-widest uppercase shadow-sm">
                {cat.name}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

