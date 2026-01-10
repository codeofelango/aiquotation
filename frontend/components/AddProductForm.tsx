"use client";

import { useState } from "react";
import { addNewProduct } from "../app/items/actions";

export function AddProductForm() {
    const [isSaving, setIsSaving] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [previews, setPreviews] = useState<string[]>([]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            const newPreviews = files.map(file => URL.createObjectURL(file));
            setPreviews(newPreviews);
        }
    };

    const handleSubmit = async (formData: FormData) => {
        setIsSaving(true);
        try {
            await addNewProduct(formData);
            setIsOpen(false); 
            setPreviews([]);
            // Note: In a real app, reset the form ref here
        } catch (e) {
            console.error(e);
            alert("Failed to save product");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="mb-8">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 cursor-pointer font-bold text-brand hover:text-brand-dark mb-4 select-none bg-white p-4 rounded-xl border border-slate-200 shadow-sm w-full md:w-auto inline-flex"
            >
                <span className={`text-xl transition-transform ${isOpen ? 'rotate-90' : ''}`}>▶</span>
                <span>Add New Product</span>
            </button>
            
            {isOpen && (
                <form action={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 animate-fade-in mt-2">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Column 1: Core Info */}
                        <div className="space-y-5">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Core Info</h3>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Product Code / Title</label>
                                <input name="title" placeholder="e.g. L-SPL-72W" className="input-field w-full" required />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Fixture Type</label>
                                <input name="fixture_type" placeholder="e.g. Wall Grazer" className="input-field w-full" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Base Price ($)</label>
                                <input name="price" type="number" step="0.01" placeholder="0.00" className="input-field w-full" />
                            </div>
                        </div>

                        {/* Column 2: Tech Specs */}
                        <div className="space-y-5">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Technical Specs</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Wattage</label>
                                    <input name="wattage" placeholder="e.g. 72W" className="input-field w-full" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">CCT</label>
                                    <input name="cct" placeholder="e.g. 3000K" className="input-field w-full" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">IP Rating</label>
                                    <input name="ip_rating" placeholder="e.g. IP67" className="input-field w-full" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Beam Angle</label>
                                    <input name="beam_angle" placeholder="e.g. 30D" className="input-field w-full" />
                                </div>
                            </div>
                        </div>

                        {/* Column 3: Images & Details */}
                        <div className="flex flex-col h-full space-y-5">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Images & Details</h3>
                            
                            {/* Image Upload Area */}
                            <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:bg-slate-50 transition-colors relative">
                                <input 
                                    type="file" 
                                    name="images" 
                                    multiple 
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <div className="pointer-events-none">
                                    <span className="text-2xl block mb-1">📷</span>
                                    <span className="text-xs font-bold text-brand">Click to Upload Images</span>
                                    <p className="text-[10px] text-slate-400">Select multiple files</p>
                                </div>
                            </div>

                            {/* Preview Grid */}
                            {previews.length > 0 && (
                                <div className="flex gap-2 overflow-x-auto pb-2">
                                    {previews.map((src, idx) => (
                                        <div key={idx} className="w-16 h-16 shrink-0 rounded-lg overflow-hidden border border-slate-200 relative">
                                            <img src={src} alt="Preview" className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex-1">
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Full Description</label>
                                <textarea name="description" placeholder="Enter detailed specifications..." className="input-field w-full h-24 resize-none" />
                            </div>
                            
                            <button 
                                type="submit" 
                                disabled={isSaving}
                                className={`w-full text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-brand/20 flex items-center justify-center gap-2
                                    ${isSaving ? 'bg-slate-400 cursor-wait' : 'bg-brand hover:bg-brand-dark'}
                                `}
                            >
                                {isSaving ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></span>
                                        <span>Uploading & Saving...</span>
                                    </>
                                ) : (
                                    "+ Save Product"
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            )}
        </div>
    );
}