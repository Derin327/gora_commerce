import { getFullWishlistProducts } from "@/lib/actions/wishlist-actions";
import ProductCard from "@/components/shared/ProductCard";
import { Heart } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export default async function WishlistPage() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value; }
      }
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login?callbackUrl=/wishlist");
  }

  const { success, products } = await getFullWishlistProducts();

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-12 md:py-16">
        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-widest text-center mb-4 text-black">
          My Wishlist
        </h1>
        <p className="text-center text-gray-500 mb-12 font-medium">
          {products?.length || 0} ITEMS SAVED
        </p>

        {(!success || !products || products.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <Heart className="w-10 h-10 text-gray-300" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2 tracking-wide">Your wishlist is empty</h2>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              Save your favorite items here to keep track of them and buy them later when you're ready.
            </p>
            <Link 
              href="/shop/hoodies" 
              className="bg-black text-white px-8 py-3.5 text-sm font-bold uppercase tracking-widest hover:bg-[#e32c2b] transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-6 md:gap-y-12">
            {products.map((product) => {
              const primaryImage = product.product_images?.find((img: any) => img.is_primary)?.url || product.product_images?.[0]?.url;
              const originalPrice = product.compare_at_price || product.base_price;
              const discountedPrice = product.base_price;
              const discountPercentage = originalPrice > discountedPrice
                ? Math.round(((originalPrice - discountedPrice) / originalPrice) * 100)
                : 0;

              return (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  originalPrice={originalPrice}
                  discountedPrice={discountedPrice}
                  discountPercentage={discountPercentage}
                  imageUrl={primaryImage || "/placeholder.jpg"}
                  variants={product.product_images?.map((img: any) => img.url) || []}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
