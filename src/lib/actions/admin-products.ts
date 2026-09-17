"use server";

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function createProductAction(formData: FormData) {
  const cookieStore = cookies();
  
  // 1. Initialize Supabase Server Client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value; },
        set(name: string, value: string, options: CookieOptions) { cookieStore.set(name, value, options); },
        remove(name: string, options: CookieOptions) { cookieStore.set(name, "", options); },
      },
    }
  );

  // 2. Security: Verify Admin Role natively on the server
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user || user.email !== process.env.ADMIN_EMAIL) {
    throw new Error("Unauthorized: Admin privileges required.");
  }

  // 3. Extract and Validate Form Data
  const name = formData.get("name") as string;
  const slug = formData.get("slug") as string;
  const description = formData.get("description") as string;
  const category_id = formData.get("category_id") as string;
  const base_price = parseFloat(formData.get("base_price") as string);
  const compare_at_price = formData.get("compare_at_price") ? parseFloat(formData.get("compare_at_price") as string) : null;
  const status = formData.get("status") as string;
  const discount_badge = formData.get("discount_badge") as string | null;

  // Variants and Image Metadata are passed as JSON strings
  const variants = JSON.parse(formData.get("variants") as string);
  const imagesMeta = JSON.parse(formData.get("imagesMeta") as string);
  
  // Actual image files
  const imageFiles = formData.getAll("images") as File[];
  
  const uploadedPublicIds: string[] = [];

  try {
    // 4. Upload Images to Cloudinary FIRST
    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      const meta = imagesMeta[i];
      
      const buffer = Buffer.from(await file.arrayBuffer());
      
      const uploadResult = await new Promise<{ secure_url: string, public_id: string }>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: "gora-store-products" },
          (error, result) => {
            if (error || !result) return reject(error || new Error("Failed to upload to Cloudinary"));
            resolve({ secure_url: result.secure_url, public_id: result.public_id });
          }
        );
        uploadStream.end(buffer);
      });
      
      uploadedPublicIds.push(uploadResult.public_id);
      
      // Update the metadata with the Cloudinary secure URL instead of just the key/path
      imagesMeta[i].storage_key = uploadResult.secure_url;
      imagesMeta[i].url = uploadResult.secure_url; 
    }

    // 5. Call the Database Transaction RPC
    const { data: productId, error } = await supabase.rpc('create_product_transaction', {
      p_name: name,
      p_slug: slug,
      p_description: description,
      p_category_id: category_id,
      p_base_price: base_price,
      p_compare_at_price: compare_at_price,
      p_status: status,
      p_discount_badge: discount_badge,
      p_variants: variants,
      p_images: imagesMeta
    });

    if (error) throw new Error(error.message);

    // Save subcategory if present
    const subcategory = formData.get("subcategory");
    if (subcategory) {
      await supabase.from('products').update({ subcategory: subcategory.toString() }).eq('id', productId);
    }

      // Update color variants if any
      for (const img of imagesMeta) {
        if (img.color) {
          await supabase.from('product_images').update({ color: img.color }).eq('product_id', productId).eq('storage_key', img.storage_key);
        }
      }

    return { success: true, productId };

  } catch (error: any) {
    // 6. Rollback: Delete orphaned images from Cloudinary if DB transaction failed
    if (uploadedPublicIds.length > 0) {
      console.log("Rolling back Cloudinary uploads...", uploadedPublicIds);
      for (const publicId of uploadedPublicIds) {
        await cloudinary.uploader.destroy(publicId).catch(err => console.error("Failed to delete orphaned image from Cloudinary:", err));
      }
    }
    
    return { success: false, error: error.message || "Failed to create product" };
  }
}


