import { createClient } from "@/utils/supabase/client";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

// Server-side helper to create Supabase client in Server Components
export function getSupabaseServerComponent() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try { cookieStore.set(name, value, options); } catch {}
        },
        remove(name: string, options: CookieOptions) {
          try { cookieStore.set(name, "", options); } catch {}
        },
      },
    }
  );
}

// 1. Fetch active categories
export async function getStorefrontCategories() {
  const supabase = getSupabaseServerComponent();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("name");

  if (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
  return data;
}

// 2. Fetch active storefront CMS components (Hero, Announcement, Promo)
export async function getStorefrontCMS() {
  const supabase = getSupabaseServerComponent();
  const { data, error } = await supabase
    .from("storefront_components")
    .select("*")
    .eq("is_active", true);

  if (error) {
    console.error("Error fetching storefront components:", error);
    return [];
  }

  const cmsMap: Record<string, any> = {};
  data.forEach((comp) => {
    cmsMap[comp.component_type] = comp.config;
  });
  return cmsMap;
}

// 3. Fetch active products for home (Featured / Trending / New Arrivals)
export async function getStorefrontProducts(limit = 8) {
  const supabase = getSupabaseServerComponent();
  const { data, error } = await supabase
    .from("products")
    .select(`
      id, name, slug, base_price, compare_at_price, discount_badge, is_featured,
      categories(name, slug),
      product_images(url, is_primary, color),
      product_variants(color, size, stock_quantity, image_url)
    `)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching products:", error);
    return [];
  }

  // Format to standard shape used by ProductCard
  return data.map((p) => {
    const primaryImg = p.product_images?.find((img) => img.is_primary)?.url || p.product_images?.[0]?.url || "/placeholder.jpg";
    const discountPct = p.compare_at_price
      ? Math.round(((p.compare_at_price - p.base_price) / p.compare_at_price) * 100)
      : 0;

    const uniqueColors = Array.from(new Set(p.product_variants?.map((v: any) => v.color).filter(Boolean)));
    const variantImages = uniqueColors.map((color: any) => {
      const colorImg = p.product_images?.find((img: any) => img.color === color);
      const variantImg = p.product_variants?.find((v: any) => v.color === color)?.image_url;
      return colorImg?.url || variantImg;
    }).filter(Boolean);

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      originalPrice: p.compare_at_price || p.base_price,
      discountedPrice: p.base_price,
      discountPercentage: discountPct,
      imageUrl: primaryImg,
      badge: p.discount_badge,
      category: (p.categories as any)?.name,
      variants: variantImages,
    };
  });
}

// 4. Fetch single product by ID or Slug with images & variants
export async function getStorefrontProductById(idOrSlug: string) {
  const supabase = getSupabaseServerComponent();
  
  // Try by UUID or slug
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
  
  let query = supabase
    .from("products")
    .select(`
      *,
      categories(id, name, slug),
      product_images(*),
      product_variants(*)
    `)
    .eq("status", "active");

  if (isUuid) {
    query = query.eq("id", idOrSlug);
  } else {
    query = query.eq("slug", idOrSlug);
  }

  const { data, error } = await query.single();

  if (error || !data) {
    console.error("Error fetching product detail:", error);
    return null;
  }

  return data;
}

// 5. Fetch products by Category slug
export async function getProductsByCategory(categorySlug: string, subcategory?: string) {
  const supabase = getSupabaseServerComponent();
  
  // First get category ID
  const { data: category } = await supabase
    .from("categories")
    .select("id, name, description, image_url")
    .eq("slug", categorySlug)
    .single();

  if (!category) return { category: null, products: [] };

  let query = supabase
    .from("products")
    .select(`
      id, name, slug, base_price, compare_at_price, discount_badge, subcategory,
      product_images(url, is_primary, color),
      product_variants(color, size, image_url)
    `)
    .eq("category_id", category.id)
    .eq("status", "active")
    .order("created_at", { ascending: false });
    
  if (subcategory) {
    query = query.eq("subcategory", subcategory);
  }

  const { data: products } = await query;

  const formattedProducts = (products || []).map((p) => {
    const primaryImg = p.product_images?.find((img: any) => img.is_primary)?.url || p.product_images?.[0]?.url || "/placeholder.jpg";
    const discountPct = p.compare_at_price
      ? Math.round(((p.compare_at_price - p.base_price) / p.compare_at_price) * 100)
      : 0;

    const uniqueColors = Array.from(new Set(p.product_variants?.map((v: any) => v.color).filter(Boolean)));
    const variantImages = uniqueColors.map((color: any) => {
      const colorImg = p.product_images?.find((img: any) => img.color === color);
      const variantImg = p.product_variants?.find((v: any) => v.color === color)?.image_url;
      return colorImg?.url || variantImg;
    }).filter(Boolean);

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      originalPrice: p.compare_at_price || p.base_price,
      discountedPrice: p.base_price,
      discountPercentage: discountPct,
      imageUrl: primaryImg,
      badge: p.discount_badge,
      variants: variantImages,
    };
  });

  return { category, products: formattedProducts };
}


// 6. Fetch related products by Category ID
export async function getRelatedProducts(categoryId: string, excludeProductId: string, limit = 4) {
  const supabase = getSupabaseServerComponent();
  const { data: products } = await supabase
    .from('products')
    .select(`
      id, name, slug, base_price, compare_at_price, discount_badge,
      product_images(url, is_primary, color),
      product_variants(color, size, image_url)
    `)
    .eq('category_id', categoryId)
    .eq('status', 'active')
    .neq('id', excludeProductId)
    .limit(limit);

  return (products || []).map((p) => {
    const primaryImg = p.product_images?.find((img: any) => img.is_primary)?.url || p.product_images?.[0]?.url || '/placeholder.jpg';
    const discountPct = p.compare_at_price
      ? Math.round(((p.compare_at_price - p.base_price) / p.compare_at_price) * 100)
      : 0;

    const uniqueColors = Array.from(new Set(p.product_variants?.map((v: any) => v.color).filter(Boolean)));
    const variantImages = uniqueColors.map((color: any) => {
      const colorImg = p.product_images?.find((img: any) => img.color === color);
      const variantImg = p.product_variants?.find((v: any) => v.color === color)?.image_url;
      return colorImg?.url || variantImg;
    }).filter(Boolean);

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      originalPrice: p.compare_at_price || p.base_price,
      discountedPrice: p.base_price,
      discountPercentage: discountPct,
      imageUrl: primaryImg,
      badge: p.discount_badge,
      variants: variantImages,
    };
  });
}

export async function getSpecialOffers() {
  const supabase = getSupabaseServerComponent();
  const { data, error } = await supabase
    .from("products")
    .select(`
      id, name, slug, base_price, compare_at_price, discount_badge, is_featured,
      categories(name, slug),
      product_images(url, is_primary, color),
      product_variants(color, size, stock_quantity, image_url)
    `)
    .eq("status", "active")
    .eq("is_featured", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching special offers:", error);
    return [];
  }

  return data.map((p) => {
    const primaryImg = p.product_images?.find((img: any) => img.is_primary)?.url || p.product_images?.[0]?.url || "/placeholder.jpg";
    const discountPct = p.compare_at_price
      ? Math.round(((p.compare_at_price - p.base_price) / p.compare_at_price) * 100)
      : 0;

    // Extract unique image URLs for colors from product_images based on variants
    const uniqueColors = Array.from(new Set(p.product_variants?.map((v: any) => v.color).filter(Boolean)));
    const variants = uniqueColors.map((color) => {
      const matchingImg = p.product_images?.find((img: any) => img.color === color);
      return matchingImg?.url;
    }).filter(Boolean);

    return {
      id: p.id,
      name: p.name,
      category: (p.categories as any)?.name || "Uncategorized",
      slug: p.slug,
      originalPrice: p.compare_at_price || p.base_price,
      discountedPrice: p.base_price,
      discountPercentage: discountPct,
      imageUrl: primaryImg,
      badge: p.discount_badge,
      variants,
    };
  });
}

export async function getNewArrivals(limit = 20) {
  const supabase = getSupabaseServerComponent();
  const { data, error } = await supabase
    .from("products")
    .select(`
      id, name, slug, base_price, compare_at_price, discount_badge, is_featured,
      categories(name, slug),
      product_images(url, is_primary, color),
      product_variants(color, size, stock_quantity, image_url)
    `)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching new arrivals:", error);
    return [];
  }

  return data.map((p) => {
    const primaryImg = p.product_images?.find((img: any) => img.is_primary)?.url || p.product_images?.[0]?.url || "/placeholder.jpg";
    const discountPct = p.compare_at_price
      ? Math.round(((p.compare_at_price - p.base_price) / p.compare_at_price) * 100)
      : 0;

    const uniqueColors = Array.from(new Set(p.product_variants?.map((v: any) => v.color).filter(Boolean)));
    const variants = uniqueColors.map((color) => {
      const matchingImg = p.product_images?.find((img: any) => img.color === color);
      return matchingImg?.url;
    }).filter(Boolean);

    return {
      id: p.id,
      name: p.name,
      category: (p.categories as any)?.name || "Uncategorized",
      slug: p.slug,
      originalPrice: p.compare_at_price || p.base_price,
      discountedPrice: p.base_price,
      discountPercentage: discountPct,
      imageUrl: primaryImg,
      badge: p.discount_badge,
      variants,
    };
  });
}

export async function getTrendingProducts(limit = 20) {
  const supabase = getSupabaseServerComponent();
  const { data, error } = await supabase
    .from("products")
    .select(`
      id, name, slug, base_price, compare_at_price, discount_badge, is_featured,
      categories(name, slug),
      product_images(url, is_primary, color),
      product_variants(color, size, stock_quantity, image_url)
    `)
    .eq("status", "active")
    .not("compare_at_price", "is", null) // Temporarily using discounted items as trending
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching trending:", error);
    return [];
  }

  return data.map((p) => {
    const primaryImg = p.product_images?.find((img: any) => img.is_primary)?.url || p.product_images?.[0]?.url || "/placeholder.jpg";
    const discountPct = p.compare_at_price
      ? Math.round(((p.compare_at_price - p.base_price) / p.compare_at_price) * 100)
      : 0;

    const uniqueColors = Array.from(new Set(p.product_variants?.map((v: any) => v.color).filter(Boolean)));
    const variants = uniqueColors.map((color) => {
      const matchingImg = p.product_images?.find((img: any) => img.color === color);
      return matchingImg?.url;
    }).filter(Boolean);

    return {
      id: p.id,
      name: p.name,
      category: (p.categories as any)?.name || "Uncategorized",
      slug: p.slug,
      originalPrice: p.compare_at_price || p.base_price,
      discountedPrice: p.base_price,
      discountPercentage: discountPct,
      imageUrl: primaryImg,
      badge: p.discount_badge,
      variants,
    };
  });
}

export async function searchProducts(filters: {
  query?: string;
  categories?: string[];
  colors?: string[];
  sizes?: string[];
}) {
  const supabase = getSupabaseServerComponent();

  let query = supabase
    .from('products')
    .select(`
      id, name, slug, base_price, compare_at_price, discount_badge, subcategory,
      categories(name, slug),
      product_images(url, is_primary, color),
      product_variants(color, size, stock_quantity, image_url)
    `)
    .eq('status', 'active');

  if (filters.query) {
    // Search in name or description
    query = query.ilike('name', `%${filters.query}%`);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('Search error:', error);
    return [];
  }

  // Filter in memory for related table arrays (colors, sizes, category names)
  // because Supabase postgREST filtering on arrays inside related tables can be tricky/limited
  let filteredData = data;

  if (filters.categories && filters.categories.length > 0) {
    const catsLower = filters.categories.map(c => c.toLowerCase());
    filteredData = filteredData.filter((p: any) => p.categories?.name && catsLower.includes(p.categories.name.toLowerCase()));
  }

  if (filters.colors && filters.colors.length > 0) {
    const colorsLower = filters.colors.map(c => c.toLowerCase());
    filteredData = filteredData.filter((p: any) => 
      p.product_variants?.some((v: any) => v.color && colorsLower.includes(v.color.toLowerCase()))
    );
  }

  if (filters.sizes && filters.sizes.length > 0) {
    const sizesLower = filters.sizes.map(s => s.toLowerCase());
    filteredData = filteredData.filter((p: any) => 
      p.product_variants?.some((v: any) => v.size && sizesLower.includes(v.size.toLowerCase()))
    );
  }

  return filteredData.map((p: any) => {
    const primaryImg = p.product_images?.find((img: any) => img.is_primary)?.url || p.product_images?.[0]?.url || '/placeholder.jpg';
    const discountPct = p.compare_at_price
      ? Math.round(((p.compare_at_price - p.base_price) / p.compare_at_price) * 100)
      : 0;

    const uniqueColors = Array.from(new Set(p.product_variants?.map((v: any) => v.color).filter(Boolean)));
    const variants = uniqueColors.map((color) => {
      const matchingImg = p.product_images?.find((img: any) => img.color === color);
      return matchingImg?.url;
    }).filter(Boolean);

    return {
      id: p.id,
      name: p.name,
      category: p.categories?.name || 'Uncategorized',
      slug: p.slug,
      originalPrice: p.compare_at_price || p.base_price,
      discountedPrice: p.base_price,
      discountPercentage: discountPct,
      imageUrl: primaryImg,
      badge: p.discount_badge,
      variants,
    };
  });
}
