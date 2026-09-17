"use client";

import { useState, useEffect, useTransition } from "react";
import { Loader2, Check, LayoutTemplate, Plus, Trash2, Upload } from "lucide-react";
import { getStorefrontComponents, upsertStorefrontComponent } from "@/lib/actions/admin-crud";
import { uploadMediaAction } from "@/lib/actions/upload-media";

interface Component {
  id?: string;
  component_type: string;
  is_active: boolean;
  display_order: number;
  config: any;
}

const DEFAULT_COMPONENTS = [
  { component_type: "hero_banner", name: "Hero Banner", defaultConf: { heading: "", subheading: "", videoUrl: "", buttonText: "", buttonLink: "" } },
  { component_type: "promo_block", name: "Promo Block", defaultConf: { title: "", buttonText: "", buttonLink: "", imageUrl: "" } },
  { component_type: "announcement_bar", name: "Top Bar & Announcement", defaultConf: { 
    text: "Special Offer: Enjoy 40% OFF on Two Hot-Selling Products!", 
    linkText: "SHOP NOW",
    linkUrl: "/offers",
    socials: {
      instagram: "https://instagram.com",
      facebook: "https://facebook.com",
      youtube: "https://youtube.com"
    }
  } },
  { component_type: "footer_config", name: "Footer Config", defaultConf: {  
    stores: [
      { name: "Kanchipuram", url: "" },
      { name: "Trichy Thillai Nagar", url: "" },
      { name: "Cuddalore", url: "" },
      { name: "Pondicherry MG Road", url: "" },
      { name: "Coimbatore Saibaba Colony", url: "" },
      { name: "Coimbatore Lakshmi Mill", url: "" },
      { name: "Kumbakonam", url: "" },
      { name: "Erode", url: "" },
      { name: "Salem", url: "" }
    ],
    help: {
      address: "No 378, Mahatma Gandhi Road,\nNext to Petit Canal Street,\nPondicherry - 605001.",
      phones: ["(+91) 90036 35574", "(+91) 77080 16139", "(+91) 99407 37575"],
      email: "gora.clothing@gmail.com"
    }
  } },
];

export default function AdminStorefrontPage() {
  const [components, setComponents] = useState<Component[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [savingMsg, setSavingMsg] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const load = () => {
    startTransition(async () => {
      setIsLoading(true);
      try {
        const data = await getStorefrontComponents();
        setComponents(data ?? []);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    });
  };

  useEffect(() => { load(); }, []);

  const getComp = (type: string) => components.find(c => c.component_type === type) || {
    component_type: type,
    is_active: true,
    display_order: 0,
    config: DEFAULT_COMPONENTS.find(d => d.component_type === type)?.defaultConf || {},
  };

  const handleUpdate = (type: string, field: string, value: any) => {
    setComponents(prev => {
      const exists = prev.find(c => c.component_type === type);
      if (exists) {
        return prev.map(c => c.component_type === type ? { ...c, config: { ...c.config, [field]: value } } : c);
      }
      const def = DEFAULT_COMPONENTS.find(d => d.component_type === type)?.defaultConf || {};
      return [...prev, { component_type: type, is_active: true, display_order: 0, config: { ...def, [field]: value } }];
    });
  };

  const toggleActive = (type: string, active: boolean) => {
    setComponents(prev => {
      const exists = prev.find(c => c.component_type === type);
      if (exists) {
        return prev.map(c => c.component_type === type ? { ...c, is_active: active } : c);
      }
      const def = DEFAULT_COMPONENTS.find(d => d.component_type === type)?.defaultConf || {};
      return [...prev, { component_type: type, is_active: active, display_order: 0, config: def }];
    });
  };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, compType: string, configKey: string) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", e.target.files[0]);
      const res = await uploadMediaAction(formData);
      if (res.success && res.url) {
        handleUpdate(compType, configKey, res.url);
      } else {
        setError(res.error || "Failed to upload media.");
      }
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (type: string) => {
    const comp = getComp(type);
    setError(null);
    setSavingMsg(`Saving ${type}...`);
    const result = await upsertStorefrontComponent(comp.component_type, comp.config, comp.is_active, comp.display_order);
    if (!result.success) {
      setError(result.error || "Failed to save");
    } else {
      setTimeout(() => setSavingMsg(""), 2000);
      setSavingMsg("Saved successfully!");
    }
    load();
  };

  if (isLoading) {
    return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-gray-300" /></div>;
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Storefront CMS</h1>
          <p className="text-sm text-gray-500 mt-1">Manage homepage content, banners, and promotions.</p>
        </div>
        {savingMsg && <span className="text-sm font-semibold text-green-600 bg-green-50 px-3 py-1 rounded">{savingMsg}</span>}
      </div>

      {error && <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6 text-sm">{error}</div>}

      <div className="space-y-8">
                {/* Announcement Bar */}
        <section className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2"><LayoutTemplate className="w-5 h-5 text-gray-400" /> Top Bar & Announcement</h2>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={getComp("announcement_bar").is_active} onChange={(e) => toggleActive("announcement_bar", e.target.checked)} className="w-4 h-4 accent-black" />
              <span className="text-sm font-semibold">Active</span>
            </label>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Announcement Text</label>
              <input type="text" value={getComp("announcement_bar").config.text || ""} onChange={(e) => handleUpdate("announcement_bar", "text", e.target.value)} placeholder="Special Offer: Enjoy 40% OFF..." className="w-full border p-2 text-sm rounded focus:border-black outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Link Text</label>
                <input type="text" value={getComp("announcement_bar").config.linkText || ""} onChange={(e) => handleUpdate("announcement_bar", "linkText", e.target.value)} placeholder="SHOP NOW" className="w-full border p-2 text-sm rounded focus:border-black outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Link URL</label>
                <input type="text" value={getComp("announcement_bar").config.linkUrl || ""} onChange={(e) => handleUpdate("announcement_bar", "linkUrl", e.target.value)} placeholder="/offers" className="w-full border p-2 text-sm rounded focus:border-black outline-none" />
              </div>
            </div>
            
            <div className="border-t pt-4 mt-4">
              <h3 className="text-sm font-bold mb-3">Social Links</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <label className="w-24 text-xs font-bold uppercase text-gray-700">Instagram</label>
                  <input type="text" value={getComp("announcement_bar").config.socials?.instagram || ""} onChange={(e) => {
                    const soc = { ...getComp("announcement_bar").config.socials, instagram: e.target.value };
                    handleUpdate("announcement_bar", "socials", soc);
                  }} placeholder="https://instagram.com/..." className="flex-1 border p-2 text-sm rounded focus:border-black outline-none" />
                </div>
                <div className="flex items-center gap-3">
                  <label className="w-24 text-xs font-bold uppercase text-gray-700">Facebook</label>
                  <input type="text" value={getComp("announcement_bar").config.socials?.facebook || ""} onChange={(e) => {
                    const soc = { ...getComp("announcement_bar").config.socials, facebook: e.target.value };
                    handleUpdate("announcement_bar", "socials", soc);
                  }} placeholder="https://facebook.com/..." className="flex-1 border p-2 text-sm rounded focus:border-black outline-none" />
                </div>
                <div className="flex items-center gap-3">
                  <label className="w-24 text-xs font-bold uppercase text-gray-700">YouTube</label>
                  <input type="text" value={getComp("announcement_bar").config.socials?.youtube || ""} onChange={(e) => {
                    const soc = { ...getComp("announcement_bar").config.socials, youtube: e.target.value };
                    handleUpdate("announcement_bar", "socials", soc);
                  }} placeholder="https://youtube.com/..." className="flex-1 border p-2 text-sm rounded focus:border-black outline-none" />
                </div>
              </div>
            </div>
            <button onClick={() => handleSave("announcement_bar")} className="bg-black text-white px-4 py-2 text-sm font-semibold rounded hover:bg-gray-800 transition mt-4">Save Section</button>
          </div>
        </section>

        {/* Hero Banner */}
        <section className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2"><LayoutTemplate className="w-5 h-5 text-gray-400" /> Hero Banner</h2>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={getComp("hero_banner").is_active} onChange={(e) => toggleActive("hero_banner", e.target.checked)} className="w-4 h-4 accent-black" />
              <span className="text-sm font-semibold">Active</span>
            </label>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Video URL (Background)</label>
<div className="flex gap-2">
  <input type="text" value={getComp("hero_banner").config.videoUrl || ""} onChange={(e) => handleUpdate("hero_banner", "videoUrl", e.target.value)} placeholder="/videos/hero-bg.mp4" className="flex-1 border p-2 text-sm rounded focus:border-black outline-none" />
  <label className="bg-gray-100 border border-gray-200 text-gray-700 px-4 py-2 rounded text-sm font-semibold cursor-pointer hover:bg-gray-200 transition flex items-center justify-center min-w-[120px]">
    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Upload className="w-4 h-4 mr-2" /> Upload</>}
    <input type="file" accept="video/*,image/*" className="hidden" onChange={(e) => handleFileUpload(e, "hero_banner", "videoUrl")} disabled={isUploading} />
  </label>
</div>
</div>
            <div>
              <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Heading</label>
              <input type="text" value={getComp("hero_banner").config.heading || ""} onChange={(e) => handleUpdate("hero_banner", "heading", e.target.value)} placeholder="Elevate Your Style" className="w-full border p-2 text-sm rounded focus:border-black outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Subheading</label>
              <input type="text" value={getComp("hero_banner").config.subheading || ""} onChange={(e) => handleUpdate("hero_banner", "subheading", e.target.value)} placeholder="Discover our latest collection..." className="w-full border p-2 text-sm rounded focus:border-black outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Button Text</label>
                <input type="text" value={getComp("hero_banner").config.buttonText || ""} onChange={(e) => handleUpdate("hero_banner", "buttonText", e.target.value)} placeholder="Shop Now" className="w-full border p-2 text-sm rounded focus:border-black outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Button Link</label>
                <input type="text" value={getComp("hero_banner").config.buttonLink || ""} onChange={(e) => handleUpdate("hero_banner", "buttonLink", e.target.value)} placeholder="/shop" className="w-full border p-2 text-sm rounded focus:border-black outline-none" />
              </div>
            </div>
            <button onClick={() => handleSave("hero_banner")} className="bg-black text-white px-4 py-2 text-sm font-semibold rounded hover:bg-gray-800 transition">Save Section</button>
          </div>
        </section>

        {/* Promo Block */}
        <section className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2"><LayoutTemplate className="w-5 h-5 text-gray-400" /> Promo Block</h2>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={getComp("promo_block").is_active} onChange={(e) => toggleActive("promo_block", e.target.checked)} className="w-4 h-4 accent-black" />
              <span className="text-sm font-semibold">Active</span>
            </label>
          </div>
          <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Promo Image URL</label>
                <div className="flex gap-2">
                  <input type="text" value={getComp("promo_block").config.imageUrl || ""} onChange={(e) => handleUpdate("promo_block", "imageUrl", e.target.value)} placeholder="https://..." className="flex-1 border p-2 text-sm rounded focus:border-black outline-none" />
                  <label className="bg-gray-100 border border-gray-200 text-gray-700 px-4 py-2 rounded text-sm font-semibold cursor-pointer hover:bg-gray-200 transition flex items-center justify-center min-w-[120px]">
                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Upload className="w-4 h-4 mr-2" /> Upload</>}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, "promo_block", "imageUrl")} disabled={isUploading} />
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Title</label>
              <input type="text" value={getComp("promo_block").config.title || ""} onChange={(e) => handleUpdate("promo_block", "title", e.target.value)} placeholder="Because Every Look Deserves an Upgrade" className="w-full border p-2 text-sm rounded focus:border-black outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Button Text</label>
                <input type="text" value={getComp("promo_block").config.buttonText || ""} onChange={(e) => handleUpdate("promo_block", "buttonText", e.target.value)} placeholder="Shop Now" className="w-full border p-2 text-sm rounded focus:border-black outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Button Link</label>
                <input type="text" value={getComp("promo_block").config.buttonLink || ""} onChange={(e) => handleUpdate("promo_block", "buttonLink", e.target.value)} placeholder="/shop" className="w-full border p-2 text-sm rounded focus:border-black outline-none" />
              </div>
            </div>
            <button onClick={() => handleSave("promo_block")} className="bg-black text-white px-4 py-2 text-sm font-semibold rounded hover:bg-gray-800 transition">Save Section</button>
          </div>
        </section>
        {/* Footer Config */}
        <section className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2"><LayoutTemplate className="w-5 h-5 text-gray-400" /> Footer Config</h2>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={getComp("footer_config").is_active} onChange={(e) => toggleActive("footer_config", e.target.checked)} className="w-4 h-4 accent-black" />
              <span className="text-sm font-semibold">Active</span>
            </label>
          </div>
          <div className="space-y-6">
            
            <div>
              <h3 className="text-sm font-bold border-b pb-2 mb-3">Our Stores</h3>
              {(getComp("footer_config").config.stores || []).map((store: any, idx: number) => (
                <div key={idx} className="flex gap-2 mb-2 items-center">
                  <input type="text" value={store.name} onChange={(e) => {
                    const newStores = [...getComp("footer_config").config.stores];
                    newStores[idx].name = e.target.value;
                    handleUpdate("footer_config", "stores", newStores);
                  }} placeholder="Store Name" className="flex-1 border p-2 text-sm rounded focus:border-black outline-none" />
                  <input type="text" value={store.url || ""} onChange={(e) => {
                    const newStores = [...getComp("footer_config").config.stores];
                    newStores[idx].url = e.target.value;
                    handleUpdate("footer_config", "stores", newStores);
                  }} placeholder="Google Maps URL" className="flex-1 border p-2 text-sm rounded focus:border-black outline-none" />
                  <button onClick={() => {
                    const newStores = getComp("footer_config").config.stores.filter((_: any, i: number) => i !== idx);
                    handleUpdate("footer_config", "stores", newStores);
                  }} className="text-red-500 p-2 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
              <button onClick={() => {
                const newStores = [...(getComp("footer_config").config.stores || []), { name: "", url: "" }];
                handleUpdate("footer_config", "stores", newStores);
              }} className="text-xs font-bold text-black border border-black rounded px-3 py-1 flex items-center gap-1 hover:bg-black hover:text-white transition"><Plus className="w-3 h-3"/> Add Store</button>
            </div>

            <div>
              <h3 className="text-sm font-bold border-b pb-2 mb-3">Help & Support</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Address</label>
                  <textarea value={getComp("footer_config").config.help?.address || ""} onChange={(e) => {
                    const help = { ...getComp("footer_config").config.help, address: e.target.value };
                    handleUpdate("footer_config", "help", help);
                  }} rows={3} className="w-full border p-2 text-sm rounded focus:border-black outline-none"></textarea>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Phone Numbers (comma separated)</label>
                  <input type="text" value={(getComp("footer_config").config.help?.phones || []).join(", ")} onChange={(e) => {
                    const help = { ...getComp("footer_config").config.help, phones: e.target.value.split(",").map(s => s.trim()).filter(Boolean) };
                    handleUpdate("footer_config", "help", help);
                  }} className="w-full border p-2 text-sm rounded focus:border-black outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Email</label>
                  <input type="email" value={getComp("footer_config").config.help?.email || ""} onChange={(e) => {
                    const help = { ...getComp("footer_config").config.help, email: e.target.value };
                    handleUpdate("footer_config", "help", help);
                  }} className="w-full border p-2 text-sm rounded focus:border-black outline-none" />
                </div>
              </div>
            </div>

            <button onClick={() => handleSave("footer_config")} className="bg-black text-white px-4 py-2 text-sm font-semibold rounded hover:bg-gray-800 transition">Save Footer Config</button>
          </div>
        </section>
      </div>
    </div>
  );
}







