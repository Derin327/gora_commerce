import Link from "next/link";

interface PromoConfig {
  title?: string;
  buttonText?: string;
  buttonLink?: string;
  imageUrl?: string;
}

export default function PromoBlock({ config }: { config?: PromoConfig }) {
  const title = config?.title || "Because Every Look Deserves an Upgrade";
  const buttonText = config?.buttonText || "Shop Now";
  const buttonLink = config?.buttonLink || "/shop";
  const imageUrl = config?.imageUrl || "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=800&q=80";

  return (
    <div className="w-full bg-[#f9f9f9] flex items-center min-h-[600px]">
      <div className="max-w-[1400px] mx-auto w-full px-4 md:px-8 py-12 flex flex-col md:flex-row items-center gap-12">
        {/* Left Content */}
        <div className="flex-1 max-w-xl">
          <span className="uppercase tracking-[0.2em] text-xs font-bold text-gray-600 block mb-6">
            Step Into Style
          </span>
          <h1 className="text-5xl md:text-6xl font-semibold leading-tight text-black mb-6 whitespace-pre-line">
            {title}
          </h1>
          <p className="text-gray-500 mb-10 leading-relaxed max-w-md">
            Redefine your everyday fashion with pieces that blend trend, comfort, and confidence. Step up your style game effortlessly.
          </p>
          <Link 
            href={buttonLink} 
            className="inline-block bg-[#1a1a1a] text-white px-8 py-4 text-xs font-bold uppercase tracking-widest hover:bg-black transition-colors"
          >
            {buttonText}
          </Link>
        </div>

        {/* Right Image */}
        <div className="flex-1 w-full h-[500px] md:h-[600px] relative bg-gray-200">
          <img 
            src={imageUrl} 
            alt="Promo feature" 
            className="w-full h-full object-cover object-top"
          />
        </div>
      </div>
    </div>
  );
}
