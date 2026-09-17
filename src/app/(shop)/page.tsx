import HeroBanner from "@/components/shared/HeroBanner";
import PromoBlock from "@/components/shared/PromoBlock";
import CategoryGrid from "@/components/shared/CategoryGrid";
import SwipeableCarousel from "@/components/shared/SwipeableCarousel";
import ProductCard from "@/components/shared/ProductCard";
import Testimonials from "@/components/shared/Testimonials";
import { getStorefrontProducts, getStorefrontCMS } from "@/lib/data/storefront";

const fallbackNewArrivals = [
  {
    id: "na1",
    name: "Classic Overdyed Checkered Shirt",
    originalPrice: 2199,
    discountedPrice: 1499,
    discountPercentage: 31,
    imageUrl: "https://images.unsplash.com/photo-1603252109303-2751441dd157?w=600&q=80",
    variants: [],
  },
  {
    id: "na2",
    name: "Premium Linen Cargo Pant",
    originalPrice: 1599,
    discountedPrice: 1199,
    discountPercentage: 25,
    imageUrl: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&q=80",
    variants: [],
  },
  {
    id: "na3",
    name: "Streetwear Graphic Hoodie",
    originalPrice: 2499,
    discountedPrice: 1599,
    discountPercentage: 36,
    imageUrl: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&q=80",
    variants: [],
  },
  {
    id: "na4",
    name: "Vintage Cuban Chain",
    originalPrice: 1299,
    discountedPrice: 799,
    discountPercentage: 38,
    imageUrl: "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=600&q=80",
    variants: [],
  }
];

export const revalidate = 60; // Revalidate page every 60 seconds

export default async function Home() {
  const liveProducts = await getStorefrontProducts(12);
  const cmsData: Record<string, any> = await getStorefrontCMS();

  const productsToDisplay = liveProducts.length > 0 ? liveProducts : fallbackNewArrivals;
  const newArrivals = productsToDisplay.slice(0, 6);
  const trendingProducts = productsToDisplay.slice(6, 12).length > 0 ? productsToDisplay.slice(6, 12) : productsToDisplay.slice(0, 4);

  return (
    <main className="min-h-screen bg-white">
      {/* 1. Hero Section (Video / Banner) */}
      <HeroBanner config={cmsData.hero_banner} />
      
      {/* 2. Featured Categories */}
      <CategoryGrid />
      
      {/* 3. New Arrivals */}
      <div className="max-w-7xl mx-auto my-12">
        <SwipeableCarousel title="New Arrivals">
          {newArrivals.map((product) => (
            <div key={product.id} className="w-[45vw] sm:w-[45vw] md:w-[300px] flex-none snap-start">
              <ProductCard {...product} />
            </div>
          ))}
        </SwipeableCarousel>
      </div>

      {/* 4. Trending Products */}
      <div className="max-w-7xl mx-auto my-12">
        <SwipeableCarousel title="Trending Now">
          {trendingProducts.map((product) => (
            <div key={product.id} className="w-[45vw] sm:w-[45vw] md:w-[300px] flex-none snap-start">
              <ProductCard {...product} />
            </div>
          ))}
        </SwipeableCarousel>
      </div>

      {/* 5. Promo Block */}
      <PromoBlock config={cmsData.promo_block} />

      {/* 6. Testimonials */}
      <Testimonials />
    </main>
  );
}
