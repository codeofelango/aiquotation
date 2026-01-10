"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { getProducts } from "@/lib/api";
import { ProductImage } from "@/components/ProductImage";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { AddProductForm } from "@/components/AddProductForm";
import { EditProductModal } from "@/components/EditProductModal";
import { AuthGuard } from "@/components/AuthGuard";

export default function ItemsPage() {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingItem, setEditingItem] = useState<any | null>(null);
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

    useEffect(() => {
        loadItems();
    }, []);

    const loadItems = async () => {
        try {
            const data = await getProducts();
            setItems(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthGuard>
            <div className="min-h-screen bg-slate-50 pb-20">
                <Navbar />
                
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-800">Product Catalog</h1>
                            <p className="text-slate-500">Manage your lighting inventory and specifications.</p>
                        </div>
                        
                        <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                            <button 
                                onClick={() => setViewMode("grid")}
                                className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-slate-100 text-brand shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                title="Grid View"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                            </button>
                            <button 
                                onClick={() => setViewMode("list")}
                                className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-slate-100 text-brand shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                title="List View"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
                            </button>
                        </div>
                    </div>

                    {/* Add Product Form */}
                    <AddProductForm />

                    {/* Product List */}
                    {loading ? (
                        <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
                    ) : (
                        <>
                            {viewMode === "grid" ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                                    {items.map((item) => (
                                        <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden group hover:shadow-md transition-all flex flex-col">
                                            <div className="aspect-video relative bg-slate-100">
                                                <ProductImage src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                    <button 
                                                        onClick={() => setEditingItem(item)}
                                                        className="bg-white text-slate-800 px-4 py-2 rounded-lg font-bold text-sm shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all hover:text-brand"
                                                    >
                                                        Edit Product
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="p-5 flex-1 flex flex-col">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h3 className="font-bold text-slate-800 text-lg leading-tight">{item.title}</h3>
                                                    <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-1 rounded font-bold uppercase">{item.category || "Light"}</span>
                                                </div>
                                                <p className="text-sm text-slate-500 line-clamp-2 mb-4 flex-1">{item.description}</p>
                                                
                                                <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                    <div><span className="font-bold">Watts:</span> {item.wattage || "-"}</div>
                                                    <div><span className="font-bold">CCT:</span> {item.cct || "-"}</div>
                                                    <div><span className="font-bold">IP:</span> {item.ip_rating || "-"}</div>
                                                    <div><span className="font-bold">Type:</span> {item.fixture_type || "-"}</div>
                                                </div>

                                                <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                                                    <span className="font-mono font-bold text-lg text-slate-800">${item.price?.toLocaleString()}</span>
                                                    <button 
                                                        onClick={() => setEditingItem(item)}
                                                        className="text-slate-400 hover:text-brand font-bold text-sm"
                                                    >
                                                        Edit
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase border-b border-slate-200">
                                            <tr>
                                                <th className="px-6 py-4">Product</th>
                                                <th className="px-6 py-4">Specs</th>
                                                <th className="px-6 py-4">Description</th>
                                                <th className="px-6 py-4 text-right">Price</th>
                                                <th className="px-6 py-4 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {items.map((item) => (
                                                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
                                                                <ProductImage src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-slate-800">{item.title}</div>
                                                                <div className="text-xs text-slate-500">{item.fixture_type}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-xs space-y-1 text-slate-600">
                                                            <div><span className="font-bold text-slate-400">W:</span> {item.wattage}</div>
                                                            <div><span className="font-bold text-slate-400">CCT:</span> {item.cct}</div>
                                                            <div><span className="font-bold text-slate-400">IP:</span> {item.ip_rating}</div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 max-w-xs">
                                                        <p className="text-sm text-slate-500 line-clamp-2">{item.description}</p>
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-mono font-bold text-slate-700">
                                                        ${item.price?.toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button 
                                                            onClick={() => setEditingItem(item)}
                                                            className="text-slate-400 hover:text-brand font-bold text-sm px-3 py-1 rounded hover:bg-slate-100 transition-colors"
                                                        >
                                                            Edit
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Edit Modal */}
                {editingItem && (
                    <EditProductModal 
                        product={editingItem} 
                        onClose={() => {
                            setEditingItem(null);
                            loadItems(); // Refresh list after edit
                        }} 
                    />
                )}
            </div>
        </AuthGuard>
    );
}