import { getStorefrontCMS } from "@/lib/data/storefront";
import Footer from "./Footer";

export default async function ServerFooter() {
  const cmsData = await getStorefrontCMS();
  // Safe cast since it could be [] on error
  const footerConfig = Array.isArray(cmsData) ? null : cmsData.footer_config || null;
  return <Footer config={footerConfig} />;
}
