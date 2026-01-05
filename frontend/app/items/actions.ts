"use server";

import { addProduct, embedAllProducts } from "../../lib/api";
import { revalidatePath } from "next/cache";

export async function addNewProduct(formData: FormData) {
    const payload = {
        title: String(formData.get("title") || ""),
        description: String(formData.get("description") || ""),
        fixture_type: String(formData.get("fixture_type") || ""),
        wattage: String(formData.get("wattage") || ""),
        cct: String(formData.get("cct") || ""),
        ip_rating: String(formData.get("ip_rating") || ""),
        price: parseFloat(String(formData.get("price") || "0")),
        category: "Lighting"
    };
    await addProduct(payload);
    revalidatePath("/items");
}

export async function embedAllAction() {
    await embedAllProducts();
    revalidatePath("/items");
}