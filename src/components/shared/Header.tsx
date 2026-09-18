"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Search, 
  Menu, 
  X, 
  Tag, 
  ChevronDown, 
  Heart, 
  ShoppingCart,
  Globe,
  SlidersHorizontal
} from "lucide-react";
import { useCartStore } from "@/lib/store";
import { useWishlistStore } from "@/lib/wishlist-store";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { getUserWishlistIds } from "@/lib/actions/wishlist-actions";
import CartDrawer from "./CartDrawer";
import FilterDrawer from "./FilterDrawer";

// Inline SVGs for brand icons
const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
);
const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
);
const YoutubeIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>
);
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M20.283 12.256c0-.828-.07-1.616-.217-2.376H12v4.444h4.743c-.22 1.5-1.127 2.775-2.43 3.635v2.996h3.916c2.29-2.096 3.616-5.183 3.616-8.7z"/><path d="M12 20.67c2.327 0 4.28-.76 5.706-2.064l-3.916-2.996c-.773.514-1.757.818-2.79.818-2.146 0-3.963-1.44-4.61-3.376H2.33v3.084C4.05 19.537 7.747 20.67 12 20.67z"/><path d="M7.39 13.052c-.17-.506-.264-1.04-.264-1.59 0-.55.094-1.084.264-1.59V6.788H2.33a8.966 8.966 0 0 0 0 8.324l5.06-3.06z"/><path d="M12 6.315c1.26 0 2.39.428 3.284 1.272l2.45-2.43C16.275 3.738 14.32 3 12 3 7.746 3 4.05 5.394 2.33 8.788l5.06 3.084c.646-1.936 2.464-3.376 4.61-3.376z"/></svg>
);

export default function Header({ config }: { config?: any }) {
  const pathname = usePathname();
  const router = useRouter();
  const { setIsOpen, items } = useCartStore();
  const { wishlistIds, setWishlistIds } = useWishlistStore();
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    const supabase = createClient();
    
    const loadData = async (sessionUser: any) => {
      setUser(sessionUser);
      if (sessionUser) {
        const res = await getUserWishlistIds();
        if (res.success) {
          setWishlistIds(res.ids);
        }
      } else {
        setWishlistIds([]);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      loadData(session?.user || null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      loadData(session?.user || null);
    });
    return () => subscription.unsubscribe();
  }, []);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  if (pathname.startsWith("/manager-gora")) {
    return null;
  }

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <>
      <header className="w-full bg-white z-40 relative shadow-sm">
        {/* Top Black Bar */}
        <div className="w-full bg-[#1a1a1a] text-white py-2.5 px-4 md:px-8">
          <div className="max-w-[1400px] mx-auto flex justify-between items-center text-[11px] uppercase font-semibold tracking-wider">
            <div>
              {config?.text || "Special Offer: Enjoy 40% OFF on Two Hot-Selling Products!"}{" "}
              <Link href={config?.linkUrl || "/offers"} className="underline hover:text-gray-300 ml-1">
                {config?.linkText || "SHOP NOW"}
              </Link>
            </div>
            <div className="hidden md:flex items-center gap-5">
              {config?.socials?.instagram && (
                <Link href={config.socials.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-gray-400"><InstagramIcon /></Link>
              )}
              {config?.socials?.facebook && (
                <Link href={config.socials.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-gray-400"><FacebookIcon /></Link>
              )}
              {config?.socials?.youtube && (
                <Link href={config.socials.youtube} target="_blank" rel="noopener noreferrer" className="hover:text-gray-400"><YoutubeIcon /></Link>
              )}
              {(!config?.socials) && (
                <>
                  <Link href="https://instagram.com" className="hover:text-gray-400"><InstagramIcon /></Link>
                  <Link href="https://facebook.com" className="hover:text-gray-400"><FacebookIcon /></Link>
                  <Link href="https://youtube.com" className="hover:text-gray-400"><YoutubeIcon /></Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Main Header Row */}
        <div className="border-b border-gray-100">
          <div className="max-w-[1400px] mx-auto px-4 md:px-8 h-20 md:h-24 flex items-center justify-between">
            
            {/* Mobile Menu Toggle (Left on mobile) */}
            <div className="flex md:hidden items-center w-[80px]">
              <button className="p-2 -ml-2" onClick={() => setIsMobileMenuOpen(true)}>
                <Menu className="h-6 w-6 text-black" />
              </button>
            </div>

            {/* Search Bar (Left on Desktop) */}
            <div className="hidden md:flex w-[300px]">
              <form onSubmit={handleSearch} className="w-full bg-gray-50 flex items-center px-4 py-3 rounded-sm border border-transparent focus-within:border-gray-200 transition-colors">
                <input 
                  type="text" 
                  placeholder="Search products..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent outline-none text-sm w-full text-black placeholder:text-gray-400" 
                />
                <button type="submit" className="flex-shrink-0">
                  <Search className="w-4 h-4 text-gray-400 hover:text-black transition-colors" />
                </button>
              </form>
            </div>
            
            {/* Logo (Center) */}
            <div className="flex-1 text-center flex justify-center">
              <Link href="/" className="inline-block flex justify-center items-center h-16 md:h-20">
                <img 
                  src={config?.logoUrl || "/gora-logo.png"} 
                  alt="GORA Logo" 
                  className={`h-full w-auto object-contain ${config?.invertLogo ? "invert" : ""}`}
                />
              </Link>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-5 md:gap-8 justify-end w-[80px] md:w-[300px]">
              {user ? (
                <Link href="/account" className="hidden lg:block text-xs font-bold uppercase tracking-widest hover:text-[#e32c2b] transition-colors">
                  Account
                </Link>
              ) : (
                <Link href="/login" className="hidden lg:block text-xs font-bold uppercase tracking-widest hover:text-[#e32c2b] transition-colors">
                  Login
                </Link>
              )}
              
              <Link href="/wishlist" className="hidden sm:block relative hover:text-[#e32c2b] transition-colors">
                <Heart className="w-6 h-6 stroke-[1.5]" />
                <span className="absolute -top-1.5 -right-2 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#1a1a1a] text-[10px] font-bold text-white">
                  {mounted ? wishlistIds.length : 0}
                </span>
              </Link>

              <button className="flex items-center gap-3 hover:text-[#e32c2b] transition-colors" onClick={() => setIsOpen(true)}>
                <div className="relative">
                  <ShoppingCart className="w-6 h-6 stroke-[1.5]" />
                  {mounted && (
                    <span className="absolute -top-1.5 -right-2 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#1a1a1a] text-[10px] font-bold text-white">
                      {totalItems}
                    </span>
                  )}
                </div>
                <div className="hidden lg:flex flex-col text-left leading-tight">
                  <span className="text-[13px] font-bold text-black">My Cart</span>
                  <span className="text-xs text-gray-500 font-medium tracking-wide">
                    {mounted ? `Rs.${cartTotal.toFixed(2)}` : "Rs.0.00"}
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Secondary Nav Bar (Desktop) */}
        <div className="hidden md:block border-b border-gray-100">
          <div className="max-w-[1400px] mx-auto px-4 md:px-8 h-14 flex items-center justify-between text-[13px] font-bold tracking-widest uppercase">
            
            {/* Shop By Categories (Left) */}
            <div className="group relative h-full flex items-center w-[250px]">
              <button className="flex items-center gap-2 text-black hover:text-[#e32c2b] transition-colors h-full w-full">
                <Menu className="w-5 h-5 stroke-[2]" />
                Shop By Categories
              </button>
              
              {/* Dropdown Menu */}
              <div className="absolute top-full left-0 w-64 bg-white shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 flex flex-col z-50">
                <Link href="/shop/hoodies" className="px-6 py-4 border-b border-gray-50 hover:bg-gray-50 hover:text-[#e32c2b] text-black">Hoodies</Link>
                <Link href="/shop/bottoms" className="px-6 py-4 border-b border-gray-50 hover:bg-gray-50 hover:text-[#e32c2b] text-black">Bottoms</Link>
                <Link href="/shop/shirts" className="px-6 py-4 hover:bg-gray-50 hover:text-[#e32c2b] text-black">Shirts</Link>
              </div>
            </div>

            {/* Center Links */}
            <div className="flex flex-1 items-center justify-center gap-10">
              <Link href="/new-arrivals" className="text-black hover:text-[#e32c2b] transition-colors">New Arrivals</Link>
              <Link href="/trending" className="text-black hover:text-[#e32c2b] transition-colors">Trending Now</Link>
              <Link href="/shop/hoodies" className="text-black hover:text-[#e32c2b] transition-colors">Hoodies</Link>
              
              <div className="group relative h-full flex items-center cursor-pointer">
                <span className="flex items-center gap-1.5 text-black hover:text-[#e32c2b] transition-colors">
                  Bottoms <ChevronDown className="w-3.5 h-3.5" />
                </span>
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-48 bg-white shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 flex flex-col z-50">
                  <Link href="/shop/bottoms/jeans" className="px-5 py-3 border-b border-gray-50 hover:bg-gray-50 hover:text-[#e32c2b] text-black text-center">Jeans</Link>
                  <Link href="/shop/bottoms/cargos" className="px-5 py-3 hover:bg-gray-50 hover:text-[#e32c2b] text-black text-center">Cargos</Link>
                </div>
              </div>

              <div className="group relative h-full flex items-center cursor-pointer">
                <span className="flex items-center gap-1.5 text-black hover:text-[#e32c2b] transition-colors">
                  Shirts <ChevronDown className="w-3.5 h-3.5" />
                </span>
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-48 bg-white shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 flex flex-col z-50">
                  <Link href="/shop/shirts/oversized" className="px-5 py-3 border-b border-gray-50 hover:bg-gray-50 hover:text-[#e32c2b] text-black text-center">Oversized</Link>
                  <Link href="/shop/shirts/casual" className="px-5 py-3 border-b border-gray-50 hover:bg-gray-50 hover:text-[#e32c2b] text-black text-center">Casual</Link>
                  <Link href="/shop/shirts/formals" className="px-5 py-3 hover:bg-gray-50 hover:text-[#e32c2b] text-black text-center">Formals</Link>
                </div>
              </div>
            </div>

            {/* Best Offers & Filter (Right) */}
            <div className="w-[250px] flex justify-end gap-6">
              <button onClick={() => setIsFilterOpen(true)} className="flex items-center gap-2 text-black hover:text-[#e32c2b] transition-colors uppercase tracking-widest text-xs font-bold">
                <SlidersHorizontal className="w-4 h-4" />
                Filter
              </button>
              <Link href="/offers" className="flex items-center gap-2 text-black hover:text-[#e32c2b] transition-colors">
                <Tag className="w-5 h-5" />
                Best Offers
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex sm:hidden">
          <div 
            className="fixed inset-0 bg-black/50 transition-opacity" 
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative w-4/5 max-w-sm bg-white h-full shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50">
              <span className="text-lg font-bold tracking-widest uppercase text-black">Menu</span>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors bg-white shadow-sm border border-gray-100">
                <X className="w-5 h-5 text-black" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 text-[13px] font-bold tracking-widest uppercase">
              <Link href="/offers" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 text-black">
                <Tag className="w-4 h-4" /> Best Offers
              </Link>
              <hr className="border-gray-100" />
              <Link href="/new-arrivals" onClick={() => setIsMobileMenuOpen(false)} className="text-black hover:text-[#e32c2b] transition-colors">New Arrivals</Link>
              <Link href="/trending" onClick={() => setIsMobileMenuOpen(false)} className="text-black hover:text-[#e32c2b] transition-colors">Trending Now</Link>
              <hr className="border-gray-100" />
              <Link href="/shop/hoodies" onClick={() => setIsMobileMenuOpen(false)} className="text-black hover:text-[#e32c2b]">Hoodies</Link>
              <Link href="/shop/bottoms" onClick={() => setIsMobileMenuOpen(false)} className="text-black hover:text-[#e32c2b] transition-colors">Bottoms</Link>
              <Link href="/shop/shirts" onClick={() => setIsMobileMenuOpen(false)} className="text-black hover:text-[#e32c2b] transition-colors">Shirts</Link>
              <Link href="/shop/accessories" onClick={() => setIsMobileMenuOpen(false)} className="text-black hover:text-[#e32c2b] transition-colors">Accessories</Link>
              <hr className="border-gray-100" />
              {user ? (
                <Link href="/account" onClick={() => setIsMobileMenuOpen(false)} className="text-black hover:text-[#e32c2b] transition-colors">My Account</Link>
              ) : (
                <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="text-black hover:text-[#e32c2b] transition-colors">Login / Register</Link>
              )}
            </div>
          </div>
        </div>
      )}

      <FilterDrawer isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} />
      <CartDrawer />
    </>
  );
}
