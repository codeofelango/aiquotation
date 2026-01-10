"use client";

import { useState } from "react";
import { uploadProductImage } from "@/lib/api";
import { updateExistingProduct } from "@/app/items/actions"; // Import server action
import { useRouter } from "next/navigation";

type Product = {
    id: number;
    title: string;
    description: string;
    fixture_type: string;
    wattage: string;
    cct: string;
    ip_rating: string;
    price: number;
    image_url: string;
    images?: string[];
};

type EditProductModalProps = {
    product: Product;
    onClose: () => void;
};

export function EditProductModal({ product, onClose }: EditProductModalProps) {
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        title: product.title || "",
        description: product.description || "",
        fixture_type: product.fixture_type || "",
        wattage: product.wattage || "",
        cct: product.cct || "",
        ip_rating: product.ip_rating || "",
        price: product.price || 0,
        images: product.images || (product.image_url ? [product.image_url] : [])
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setIsSaving(true);
            try {
                const newImages = [...(formData.images || [])];
                for (const file of Array.from(e.target.files)) {
                    const res = await uploadProductImage(file);
                    if (res.url) newImages.push(res.url);
                }
                setFormData(prev => ({ ...prev, images: newImages }));
            } catch (err) {
                console.error("Upload failed", err);
                alert("Image upload failed");
            } finally {
                setIsSaving(false);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            // Use the server action
            await updateExistingProduct(product.id, formData);
            
            alert("Product updated successfully!");
            onClose();
            // No need for router.refresh() if server action uses revalidatePath
        } catch (err: any) {
            console.error("Update failed", err);
            // Show the actual error message if available
            alert(`Failed to update product: ${err.message || "Unknown error"}`);
        } finally {
            setIsSaving(false);
        }
    };

    const labelClass = "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1";

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-bold text-slate-800">Edit Product</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors text-2xl leading-none">&times;</button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className={labelClass}>Product Title</label>
                            <input name="title" value={formData.title} onChange={handleChange} className="input-field w-full" required />
                        </div>
                        
                        <div>
                            <label className={labelClass}>Fixture Type</label>
                            <input name="fixture_type" value={formData.fixture_type} onChange={handleChange} className="input-field w-full" />
                        </div>
                        <div>
                            <label className={labelClass}>Price ($)</label>
                            <input name="price" type="number" step="0.01" value={formData.price} onChange={handleChange} className="input-field w-full" />
                        </div>
                        
                        <div>
                            <label className={labelClass}>Wattage</label>
                            <input name="wattage" value={formData.wattage} onChange={handleChange} className="input-field w-full" />
                        </div>
                        <div>
                            <label className={labelClass}>CCT</label>
                            <input name="cct" value={formData.cct} onChange={handleChange} className="input-field w-full" />
                        </div>
                        <div>
                            <label className={labelClass}>IP Rating</label>
                            <input name="ip_rating" value={formData.ip_rating} onChange={handleChange} className="input-field w-full" />
                        </div>
                    </div>

                    <div>
                        <label className={labelClass}>Description</label>
                        <textarea name="description" value={formData.description} onChange={handleChange} className="input-field w-full h-32" />
                    </div>

                    <div>
                        <label className={`${labelClass} mb-2`}>Images</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {formData.images && formData.images.map((img, i) => (
                                <div key={i} className="w-16 h-16 rounded-lg border relative group overflow-hidden">
                                    <img src={img} alt="" className="w-full h-full object-cover" />
                                    <button 
                                        type="button"
                                        onClick={() => setFormData(prev => ({...prev, images: (prev.images || []).filter((_, idx) => idx !== i)}))}
                                        className="absolute top-0 right-0 bg-red-500/80 text-white w-full h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                            <label className="w-16 h-16 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:bg-slate-50 text-slate-400 hover:text-brand hover:border-brand transition-all">
                                <span className="text-2xl">+</span>
                                <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
                            </label>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
                        <button 
                            type="submit" 
                            disabled={isSaving} 
                            className="bg-brand text-white px-6 py-2 rounded-lg font-bold hover:bg-brand-dark disabled:opacity-50 transition-all shadow-md"
                        >
                            {isSaving ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}