import { getStorefrontCMS } from "@/lib/data/storefront";
import Header from "./Header";

export default async function ServerHeader() {
  const cmsData = await getStorefrontCMS();
  // Safe cast since it could be [] on error
  const announcementConfig = Array.isArray(cmsData) ? null : cmsData.announcement_bar || null;
  return <Header config={announcementConfig} />;
}
