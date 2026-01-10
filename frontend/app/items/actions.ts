"use server";

import { addProduct, embedAllProducts, uploadProductImage, updateProduct } from "../../lib/api";
import { revalidatePath } from "next/cache";

export async function addNewProduct(formData: FormData) {
    // 1. Handle Image Uploads
    const imageFiles = formData.getAll("images") as File[];
    const uploadedUrls: string[] = [];

    for (const file of imageFiles) {
        if (file.size > 0 && file.name !== "undefined") {
            try {
                // Call the upload API function
                const response = await uploadProductImage(file);
                if (response.url) {
                    uploadedUrls.push(response.url);
                }
            } catch (err) {
                console.error("Failed to upload image:", file.name, err);
            }
        }
    }

    // 2. Prepare Payload
    const payload = {
        title: String(formData.get("title") || ""),
        description: String(formData.get("description") || ""),
        fixture_type: String(formData.get("fixture_type") || ""),
        wattage: String(formData.get("wattage") || ""),
        cct: String(formData.get("cct") || ""),
        ip_rating: String(formData.get("ip_rating") || ""),
        price: parseFloat(String(formData.get("price") || "0")),
        category: "Lighting",
        images: uploadedUrls // Pass the list of uploaded URLs
    };

    // 3. Save Product
    await addProduct(payload);
    revalidatePath("/items");
}

export async function updateExistingProduct(id: number, formData: any) {
    // Note: formData here is a plain object from the client component state, not FormData object
    // Ensure types are correct
    const payload = {
        ...formData,
        price: parseFloat(String(formData.price || "0")),
    };

    await updateProduct(id, payload);
    revalidatePath("/items");
}

export async function embedAllAction() {
    await embedAllProducts();
    revalidatePath("/items");
}