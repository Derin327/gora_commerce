"use client";

import Link from "next/link";
import { MapPin, Phone, Mail, ArrowRight } from "lucide-react";
import { usePathname } from "next/navigation";

// Social Icons (SVG)
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.532,6.477,2.532,12s4.489,10,10.013,10c8.396,0,10.249-7.85,9.426-11.761H12.545z"/></svg>
);
const YoutubeIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M21.582,6.186c-0.23-0.86-0.908-1.538-1.768-1.768C18.254,4,12,4,12,4S5.746,4,4.186,4.418c-0.86,0.23-1.538,0.908-1.768,1.768C2,7.746,2,12,2,12s0,4.254,0.418,5.814c0.23,0.86,0.908,1.538,1.768,1.768C5.746,20,12,20,12,20s6.254,0,7.814-0.418c0.86-0.23,1.538-0.908,1.768-1.768C22,16.254,22,12,22,12S22,7.746,21.582,6.186z M10,15.464V8.536L16,12L10,15.464z"/></svg>
);
const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M14,13.06l0.55-3.56H11V7.19c0-0.98,0.5-1.93,2.06-1.93H14.7V2.18C14.7,2.18,13.23,2,11.85,2C8.95,2,7,3.75,7,6.86V9.5H3.84v3.56H7v8.6h4v-8.6H14z"/></svg>
);
const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12,5.556c-3.559,0-6.444,2.886-6.444,6.444S8.441,18.444,12,18.444c3.559,0,6.444-2.886,6.444-6.444S15.559,5.556,12,5.556z M12,16.275c-2.361,0-4.275-1.915-4.275-4.275S9.639,7.725,12,7.725c2.361,0,4.275,1.915,4.275,4.275S14.361,16.275,12,16.275z"/><path d="M17.848,4.686c-0.796,0-1.442,0.647-1.442,1.442s0.647,1.442,1.442,1.442S19.29,6.924,19.29,6.128S18.644,4.686,17.848,4.686z"/><path d="M19.982,5.773c-0.174-1.295-0.612-2.348-1.554-3.289c-0.941-0.941-1.994-1.38-3.289-1.554c-1.332-0.18-5.328-0.18-6.66,0C7.184,1.104,6.13,1.543,5.19,2.484C4.248,3.425,3.81,4.478,3.636,5.773c-0.18,1.332-0.18,5.328,0,6.66c0.174,1.295,0.612,2.348,1.554,3.289c0.941,0.941,1.994,1.38,3.289,1.554c1.332,0.18,5.328,0.18,6.66,0c1.295-0.174,2.348-0.612,3.289-1.554c0.941-0.941,1.38-1.994,1.554-3.289C20.162,11.101,20.162,7.105,19.982,5.773z M17.917,14.62c-0.297,0.738-0.871,1.312-1.609,1.609c-1.127,0.449-3.792,0.345-4.308,0.345s-3.181,0.104-4.308-0.345c-0.738-0.297-1.312-0.871-1.609-1.609C5.634,13.493,5.738,10.828,5.738,10c0-0.828-0.104-3.493,0.345-4.62c0.297-0.738,0.871-1.312,1.609-1.609C8.819,3.322,11.484,3.426,12,3.426s3.181-0.104,4.308,0.345c0.738,0.297,1.312,0.871,1.609,1.609C18.366,6.507,18.262,9.172,18.262,10C18.262,10.828,18.366,13.493,17.917,14.62z"/></svg>
);

export default function Footer({ config }: { config?: any }) {
  const pathname = usePathname();
  
  if (pathname.startsWith("/manager-gora")) {
    return null;
  }

  const stores = config?.stores || [
    { name: "Kanchipuram" },
    { name: "Trichy Thillai Nagar" },
    { name: "Cuddalore" },
    { name: "Pondicherry MG Road" },
    { name: "Coimbatore Saibaba Colony" },
    { name: "Coimbatore Lakshmi Mill" },
    { name: "Kumbakonam" },
    { name: "Erode" },
    { name: "Salem" },
  ];

  const help = config?.help || {
    address: "No 378, Mahatma Gandhi Road,\nNext to Petit Canal Street,\nPondicherry - 605001.",
    phones: ["(+91) 90036 35574", "(+91) 77080 16139", "(+91) 99407 37575"],
    email: "gora.clothing@gmail.com"
  };

  return (
    <footer className="w-full bg-white border-t border-gray-100">
      {/* Newsletter Section */}
      <div className="w-full py-16 px-4 border-b border-gray-100">
        <div className="max-w-2xl mx-auto text-center">
          <h3 className="text-2xl font-bold tracking-widest uppercase mb-4 text-black">Join The Club</h3>
          <p className="text-gray-500 mb-8 text-sm">Subscribe to our newsletter for exclusive offers, latest trends, and early access to drops.</p>
          <form className="flex w-full max-w-md mx-auto border-b-2 border-black pb-2">
            <input 
              type="email" 
              placeholder="Enter your email address" 
              className="flex-1 bg-transparent outline-none text-sm px-2 text-black placeholder:text-gray-400"
              required
            />
            <button type="submit" className="text-black hover:text-[#e32c2b] transition-colors p-2">
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-16 grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-8">
        
        {/* Brand Column */}
        <div className="md:col-span-12 lg:col-span-5 pr-0 lg:pr-12">
          <Link href="/" className="inline-block text-5xl font-black tracking-tighter text-black leading-none mb-6" style={{ fontFamily: "Georgia, serif" }}>
            GORA
          </Link>
          <p className="text-sm text-gray-500 leading-relaxed mb-6">
            We offer a wide range of <strong className="text-gray-700 font-semibold">streetwear and street fashion</strong> designed with comfort, quality, and style in mind. Our collection includes <strong className="text-gray-700 font-semibold">oversize shirts, oversize T-shirts, hoodies, baggy and momfit styles, polofit, drop shoulder,</strong> and <strong className="text-gray-700 font-semibold">backprint</strong> designs that are perfect for everyday wear and special occasions.
          </p>
          <p className="text-sm text-gray-500 leading-relaxed">
            Inspired by <strong className="text-gray-700 font-semibold">Italian</strong> and <strong className="text-gray-700 font-semibold">Korean</strong> trends, our <strong className="text-gray-700 font-semibold">imported</strong> clothing features <strong className="text-gray-700 font-semibold">printed, checked, stone shirts, acid wash,</strong> and <strong className="text-gray-700 font-semibold">party wear</strong> styles made for a modern and relaxed look. Explore comfortable options like <strong className="text-gray-700 font-semibold">cargo, eight pocket baggy, eight pocket cargo, joggers, linen pants, trousers, corduroy, gurka,</strong> and <strong className="text-gray-700 font-semibold">kneetorn</strong> designs crafted for easy movement.
          </p>
        </div>

                {/* Our Stores */}
        <div className="md:col-span-4 lg:col-span-2">
          <h4 className="font-bold text-black mb-6 text-sm">Our Stores</h4>
          <ul className="space-y-4 text-sm text-gray-500">
            {stores.map((store: any, idx: number) => (
              <li key={idx}>
                {store.url ? (
                  <Link href={store.url} target="_blank" rel="noopener noreferrer" className="hover:text-black transition-colors">{store.name}</Link>
                ) : (
                  <span className="hover:text-black transition-colors cursor-default">{store.name}</span>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Quick Links */}
        <div className="md:col-span-4 lg:col-span-2">
          <h4 className="font-bold text-black mb-6 text-sm">Quick Links</h4>
          <ul className="space-y-4 text-sm text-gray-500">
            <li><Link href="#" className="hover:text-black transition-colors">Privacy Policy</Link></li>
            <li><Link href="#" className="hover:text-black transition-colors">Return & Refund Policy</Link></li>
            <li><Link href="#" className="hover:text-black transition-colors">Shipping Policy</Link></li>
            <li><Link href="#" className="hover:text-black transition-colors">Terms and Conditions</Link></li>
            <li><Link href="/shop" className="hover:text-black transition-colors">Shop</Link></li>
            <li><Link href="#" className="hover:text-black transition-colors">Visit Us</Link></li>
          </ul>
        </div>

                {/* Help & Support */}
        <div className="md:col-span-4 lg:col-span-3">
          <h4 className="font-bold text-black mb-6 text-sm">Help & Support</h4>
          <ul className="space-y-5 text-sm text-gray-500">
            {help.address && (
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span className="whitespace-pre-line">{help.address}</span>
              </li>
            )}
            {(help.phones || []).map((phone: string, idx: number) => (
              <li key={idx} className="flex items-center gap-3">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <span>{phone}</span>
              </li>
            ))}
            {help.email && (
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <span>{help.email}</span>
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Copyright & Socials */}
      <div className="border-t border-gray-100 py-6 px-4 md:px-8">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-xs text-gray-400">
            © {new Date().getFullYear()} GORA. All rights reserved.
          </div>
          
          <div className="flex items-center gap-4">
            <Link href="https://google.com" className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 hover:bg-gray-200 transition-colors">
              <GoogleIcon />
            </Link>
            <Link href="https://youtube.com" className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 hover:bg-gray-200 transition-colors">
              <YoutubeIcon />
            </Link>
            <Link href="https://facebook.com" className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 hover:bg-gray-200 transition-colors">
              <FacebookIcon />
            </Link>
            <Link href="https://instagram.com" className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 hover:bg-gray-200 transition-colors">
              <InstagramIcon />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

