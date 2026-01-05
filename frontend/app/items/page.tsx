import Link from "next/link";
import { Navbar } from "../../components/Navbar";
import { getProducts, searchProducts } from "../../lib/api";
import { AddProductForm } from "../../components/AddProductForm";
import { embedAllAction } from "./actions";
import { AuthGuard } from "@/components/AuthGuard"; // Import Guard

// --- Icons ---
const GridIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
const ListIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>;

export default async function ProductCatalogPage({ 
    searchParams 
}: { 
    searchParams: { q?: string; view?: string; page?: string } 
}) {
    const query = searchParams?.q || "";
    const viewMode = searchParams?.view || "grid";
    const currentPage = Number(searchParams?.page) || 1;
    const itemsPerPage = 12;

    let allProducts = [];
    
    try {
        if (query) {
            allProducts = await searchProducts(query);
        } else {
            allProducts = await getProducts();
        }
    } catch (e) {
        console.error(e);
        allProducts = [];
    }

    // Pagination Logic
    const totalItems = allProducts.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const products = allProducts.slice(startIndex, startIndex + itemsPerPage);

    const getQueryString = (newPage?: number, newView?: string) => {
        const params = new URLSearchParams();
        if (query) params.set("q", query);
        params.set("view", newView || viewMode);
        params.set("page", (newPage || currentPage).toString());
        return `?${params.toString()}`;
    };

    return (
        <AuthGuard>
            <div className="min-h-screen bg-slate-50">
                <Navbar />
                <div className="max-w-7xl mx-auto px-6 py-10">
                    
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
                        <div>
                            <h1 className="text-4xl font-bold text-slate-900 mb-2">Product Catalog</h1>
                            <p className="text-slate-500">Manage your lighting fixture database.</p>
                        </div>
                        
                        {/* Search Bar */}
                        <div className="w-full md:w-1/3 flex gap-2">
                            <form className="relative flex-1">
                                <input 
                                    name="q" 
                                    defaultValue={query}
                                    placeholder="Search products..." 
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 shadow-sm focus:ring-2 focus:ring-brand focus:border-brand outline-none transition-all"
                                />
                                <span className="absolute left-3 top-3.5 text-slate-400">🔍</span>
                                <input type="hidden" name="view" value={viewMode} />
                            </form>
                            {query && (
                                <Link 
                                    href="/items" 
                                    className="px-4 py-3 bg-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-300 transition-colors flex items-center"
                                    title="Clear Search"
                                >
                                    ✕
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Add New Product Form */}
                    <AddProductForm />

                    {/* Controls Bar */}
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="flex bg-slate-100 rounded-lg p-1">
                                <Link 
                                    href={getQueryString(1, "grid")}
                                    className={`p-2 rounded-md transition-all ${viewMode === "grid" ? "bg-white text-brand shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                                    title="Grid View"
                                >
                                    <GridIcon />
                                </Link>
                                <Link 
                                    href={getQueryString(1, "list")}
                                    className={`p-2 rounded-md transition-all ${viewMode === "list" ? "bg-white text-brand shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                                    title="List View"
                                >
                                    <ListIcon />
                                </Link>
                            </div>
                            <span className="text-sm text-slate-500 font-medium">
                                Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, totalItems)} of {totalItems} products
                            </span>
                        </div>

                        <div className="flex items-center gap-3">
                            <form action={embedAllAction}>
                                <button type="submit" className="text-xs font-bold text-slate-500 hover:text-brand px-3 py-1.5 rounded hover:bg-slate-50 transition-colors">
                                    ⚡ Re-index Embeddings
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Product Content */}
                    {products.length === 0 ? (
                        <div className="text-center py-20 text-slate-400 bg-white rounded-3xl border border-slate-100 border-dashed">
                            <div className="text-4xl mb-4">💡</div>
                            <p>No products found matching &quot;{query}&quot;</p>
                            <div className="mt-4">
                                <Link href="/items" className="text-brand font-bold hover:underline">
                                    Clear search to see all products
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <>
                            {viewMode === "grid" ? (
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {products.map((item: any) => (
                                        <div key={item.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all group flex flex-col h-full">
                                            <div className="h-40 bg-slate-50 flex items-center justify-center relative overflow-hidden group-hover:bg-slate-100 transition-colors border-b border-slate-100">
                                                <div className="text-5xl opacity-10 group-hover:scale-110 transition-transform duration-500 text-slate-500">🔦</div>
                                                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur text-[10px] font-bold px-2 py-1 rounded shadow-sm text-slate-600 border border-slate-100">
                                                    {item.fixture_type || "Fixture"}
                                                </div>
                                                <div className="absolute bottom-2 left-2 bg-slate-900/5 backdrop-blur text-[10px] font-mono px-2 py-0.5 rounded text-slate-600">
                                                    #{item.id}
                                                </div>
                                            </div>
                                            
                                            <div className="p-5 flex-1 flex flex-col">
                                                <h3 className="font-bold text-slate-800 text-sm mb-1 line-clamp-1" title={item.title}>
                                                    {item.title}
                                                </h3>
                                                <div className="text-xs text-slate-500 mb-4 line-clamp-2 h-8 flex-1">
                                                    {item.description}
                                                </div>
                                                
                                                <div className="grid grid-cols-2 gap-2 mb-4">
                                                    <div className="bg-slate-50 border border-slate-100 rounded p-1.5 flex justify-between items-center">
                                                        <span className="text-[9px] uppercase text-slate-400">Watts</span>
                                                        <span className="text-[10px] font-bold text-slate-700">{item.wattage || '-'}</span>
                                                    </div>
                                                    <div className="bg-slate-50 border border-slate-100 rounded p-1.5 flex justify-between items-center">
                                                        <span className="text-[9px] uppercase text-slate-400">CCT</span>
                                                        <span className="text-[10px] font-bold text-slate-700">{item.cct || '-'}</span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between pt-3 border-t border-slate-50 mt-auto">
                                                    <span className="font-mono font-bold text-brand text-lg">
                                                        ${(item.price || 0).toLocaleString()}
                                                    </span>
                                                    {item.score && (
                                                        <span className="text-[10px] bg-green-50 text-green-600 px-2 py-1 rounded font-bold border border-green-100">
                                                            {(item.score * 100).toFixed(0)}% Match
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                                            <tr>
                                                <th className="px-6 py-4 w-20">ID</th>
                                                <th className="px-6 py-4">Product Name</th>
                                                <th className="px-6 py-4">Type</th>
                                                <th className="px-6 py-4">Specs</th>
                                                <th className="px-6 py-4 text-right">Price</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {products.map((item: any) => (
                                                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4 text-xs font-mono text-slate-400">#{item.id}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="font-bold text-slate-800 text-sm">{item.title}</div>
                                                        <div className="text-xs text-slate-500 truncate max-w-xs">{item.description}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-1 rounded border border-slate-200 uppercase">
                                                            {item.fixture_type || "N/A"}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-xs text-slate-600">
                                                        <span className="mr-3"><span className="text-slate-400">W:</span> {item.wattage || '-'}</span>
                                                        <span className="mr-3"><span className="text-slate-400">K:</span> {item.cct || '-'}</span>
                                                        <span><span className="text-slate-400">IP:</span> {item.ip_rating || '-'}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-mono font-bold text-slate-700">
                                                        ${(item.price || 0).toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div className="flex justify-center items-center gap-2 mt-10">
                                    <Link 
                                        href={getQueryString(currentPage - 1)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium border ${currentPage === 1 ? 'bg-slate-50 text-slate-300 border-slate-100 pointer-events-none' : 'bg-white text-slate-600 border-slate-200 hover:border-brand hover:text-brand'}`}
                                    >
                                        ← Previous
                                    </Link>
                                    
                                    <div className="flex gap-1">
                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                            let p = i + 1;
                                            if (totalPages > 5 && currentPage > 3) p = currentPage - 2 + i;
                                            if (p > totalPages) return null;
                                            
                                            return (
                                                <Link 
                                                    key={p}
                                                    href={getQueryString(p)}
                                                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold transition-colors ${currentPage === p ? 'bg-brand text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                                                >
                                                    {p}
                                                </Link>
                                            );
                                        })}
                                    </div>

                                    <Link 
                                        href={getQueryString(currentPage + 1)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium border ${currentPage === totalPages ? 'bg-slate-50 text-slate-300 border-slate-100 pointer-events-none' : 'bg-white text-slate-600 border-slate-200 hover:border-brand hover:text-brand'}`}
                                    >
                                        Next →
                                    </Link>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </AuthGuard>
    );
}