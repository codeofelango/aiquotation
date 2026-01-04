"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { getQuotation, updateQuotation, setQuotationStatus, rematchQuotation } from "@/lib/api";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useParams, useRouter } from "next/navigation";

// Extended type for selection
type MatchCandidate = {
    id: number;
    title: string;
    description: string;
    price: number;
    score: number;
};

type QuotationItem = {
    product_id: number;
    product_title: string;
    product_description?: string;
    requirement_id?: string;
    quantity: number;
    price: number;
    unit_price?: number;
    reasoning: string;
    image_url?: string;
    alternatives?: MatchCandidate[]; // Added for selection UI
};

type Requirement = {
    id: string;
    description: string;
    Fixture_Type?: string;
    Wattage?: string;
    Color_Temperature?: string;
    IP_Rating?: string;
    Description?: string;
    type_id?: string;
};

export default function QuotationEditor() {
    const { id } = useParams();
    const router = useRouter();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    const [activeTab, setActiveTab] = useState<"specs" | "pricing" | "finalize">("specs");
    
    const [requirements, setRequirements] = useState<Requirement[]>([]);
    const [items, setItems] = useState<QuotationItem[]>([]);
    const [clientName, setClientName] = useState("");

    useEffect(() => {
        if (id) loadData();
    }, [id]);

    async function loadData() {
        try {
            const q = await getQuotation(Number(id));
            setData(q);
            setClientName(q.content?.client_name || q.client_name || "");
            
            setRequirements(q.content?.requirements || []);

            // Normalize matches
            const mappedItems = (q.content?.matches || []).map((m: any) => ({
                ...m,
                quantity: m.quantity || 1,
                unit_price: m.unit_price || (m.price / (m.quantity || 1)) || m.price || 0,
                image_url: m.image_url || `https://placehold.co/100x100?text=${(m.product_title || 'Item').substring(0,3)}`,
                // Ensure alternatives exist (even if mocked from reasoning string for old data)
                alternatives: m.alternatives || [] 
            }));
            setItems(mappedItems);
            
            if (q.status === 'sent' || q.status === 'printed') {
                setActiveTab("finalize");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    // --- Actions ---

    const handleSpecChange = (idx: number, field: string, value: string) => {
        const newReqs = [...requirements];
        newReqs[idx] = { ...newReqs[idx], [field]: value };
        setRequirements(newReqs);
    };

    const handleRegenerateMatches = async () => {
        setSaving(true);
        try {
            // Call the real backend endpoint
            const res = await rematchQuotation(Number(id), requirements);
            
            const newMappedItems = (res.matches || []).map((m: any) => ({
                ...m,
                quantity: m.quantity || 1,
                unit_price: m.unit_price || 0,
                image_url: m.image_url || `https://placehold.co/100x100?text=${(m.product_title || 'Item').substring(0,3)}`,
                alternatives: m.alternatives || []
            }));
            
            setItems(newMappedItems);
            setData((prev: any) => ({...prev, total_price: res.total_price}));
            
            alert("Matches regenerated based on updated specs!");
            // Stay on specs tab to let them review the new matches
        } catch (e) {
            console.error(e);
            alert("Failed to regenerate matches. Ensure backend is running.");
        } finally {
            setSaving(false);
        }
    };

    const handleSelectAlternative = (matchIdx: number, alt: MatchCandidate) => {
        const newItems = [...items];
        // Swap current item with selected alternative
        newItems[matchIdx] = {
            ...newItems[matchIdx],
            product_id: alt.id,
            product_title: alt.title,
            product_description: alt.description,
            unit_price: alt.price,
            price: alt.price * newItems[matchIdx].quantity,
            // Keep reasoning but maybe note the manual swap?
            reasoning: `Manually selected: ${alt.title} (${(alt.score * 100).toFixed(0)}% match)`
        };
        setItems(newItems);
    };

    // --- Pricing Logic ---

    const handleQuantityChange = (idx: number, newQty: number) => {
        if (newQty < 1) return;
        const newItems = [...items];
        newItems[idx].quantity = newQty;
        newItems[idx].price = newQty * (newItems[idx].unit_price || 0);
        setItems(newItems);
    };

    const handlePriceChange = (idx: number, newPrice: number) => {
        const newItems = [...items];
        newItems[idx].unit_price = newPrice;
        newItems[idx].price = newItems[idx].quantity * newPrice;
        setItems(newItems);
    };

    const savePricingChanges = async () => {
        setSaving(true);
        try {
            const payload = {
                client_name: clientName,
                items: items.map(i => ({
                    product_id: i.product_id,
                    quantity: i.quantity,
                    unit_price: i.unit_price || 0
                }))
            };
            const res = await updateQuotation(Number(id), payload);
            setData((prev: any) => ({ ...prev, total_price: res.total_price }));
            setSaving(false);
            return true;
        } catch (e) {
            alert("Failed to save changes");
            setSaving(false);
            return false;
        }
    };

    const handleStatusChange = async (status: string) => {
        await setQuotationStatus(Number(id), status);
        loadData();
    };

    const calculateTotal = () => items.reduce((acc, item) => acc + (item.price || 0), 0);

    if (loading) return <div className="min-h-screen bg-slate-50 flex justify-center py-20"><LoadingSpinner size="lg" /></div>;
    if (!data) return <div className="p-10 text-center">Quotation not found</div>;

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />
            
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.push('/quotation')} className="text-slate-400 hover:text-slate-600">← Back</button>
                        <div>
                            <h1 className="font-bold text-slate-800 text-lg">{data.rfp_title}</h1>
                            <div className="flex items-center gap-2 text-xs">
                                <span className="font-bold uppercase text-brand">{data.status}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex gap-2">
                         {saving && <span className="text-sm text-slate-400 animate-pulse">Saving...</span>}
                         {activeTab === 'finalize' && (
                             <button onClick={() => window.print()} className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-700">
                                🖨️ Print
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                
                {/* Workflow Tabs */}
                <div className="flex gap-6 mb-8 border-b border-slate-200">
                    <button onClick={() => setActiveTab("specs")} className={`pb-3 font-semibold text-lg transition-colors ${activeTab === 'specs' ? 'text-brand border-b-2 border-brand' : 'text-slate-400'}`}>1. Edit Specs & Match</button>
                    <button onClick={() => setActiveTab("pricing")} className={`pb-3 font-semibold text-lg transition-colors ${activeTab === 'pricing' ? 'text-brand border-b-2 border-brand' : 'text-slate-400'}`}>2. Pricing & Qty</button>
                    <button onClick={async () => { await savePricingChanges(); setActiveTab("finalize"); }} className={`pb-3 font-semibold text-lg transition-colors ${activeTab === 'finalize' ? 'text-brand border-b-2 border-brand' : 'text-slate-400'}`}>3. Finalize</button>
                </div>

                {/* --- TAB 1: EDIT SPECS --- */}
                {activeTab === 'specs' && (
                    <div className="animate-fade-in space-y-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="font-bold text-xl text-slate-800">Review Specifications & Select Products</h2>
                            <button onClick={handleRegenerateMatches} className="bg-brand text-white px-6 py-2 rounded-lg font-bold hover:bg-brand-dark transition-colors shadow-lg">
                                ↻ Regenerate Matches
                            </button>
                        </div>

                        {requirements.map((req: any, i: number) => {
                            // Find match. We also check mapped items in case we regenerated
                            const match = (items || []).find((m: any) => 
                                m.requirement_id === req.id || m.requirement_id === req.type_id
                            );

                            return (
                                <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col lg:flex-row hover:shadow-md transition-shadow">
                                    <div className="flex-1 p-6 border-b lg:border-b-0 lg:border-r border-slate-100 bg-slate-50/30">
                                        <div className="flex items-center gap-3 mb-4">
                                            {/* RFP Ref Number */}
                                            <span className="bg-slate-800 text-white text-xs font-bold px-3 py-1 rounded shadow-sm">
                                                {req.type_id || req.id || `#${i+1}`}
                                            </span>
                                            <input 
                                                type="text" 
                                                value={req.Fixture_Type || ""} 
                                                onChange={(e) => handleSpecChange(i, "Fixture_Type", e.target.value)}
                                                className="font-bold text-slate-700 text-sm border-b border-dashed border-slate-300 bg-transparent focus:border-brand outline-none flex-1"
                                                placeholder="Fixture Type"
                                            />
                                        </div>
                                        <textarea 
                                            value={req.Description || req.description || ""}
                                            onChange={(e) => handleSpecChange(i, "description", e.target.value)}
                                            className="w-full text-sm text-slate-600 mb-4 p-2 border border-slate-200 rounded bg-white focus:ring-1 focus:ring-brand outline-none"
                                            rows={3}
                                        />
                                        <div className="grid grid-cols-3 gap-3 text-xs">
                                            <div className="space-y-1"><label className="text-slate-400 text-[10px] uppercase">Watts</label><input type="text" value={req.Wattage || ""} onChange={(e) => handleSpecChange(i, "Wattage", e.target.value)} className="w-full p-1 border rounded bg-white" /></div>
                                            <div className="space-y-1"><label className="text-slate-400 text-[10px] uppercase">CCT</label><input type="text" value={req.Color_Temperature || ""} onChange={(e) => handleSpecChange(i, "Color_Temperature", e.target.value)} className="w-full p-1 border rounded bg-white" /></div>
                                            <div className="space-y-1"><label className="text-slate-400 text-[10px] uppercase">IP</label><input type="text" value={req.IP_Rating || ""} onChange={(e) => handleSpecChange(i, "IP_Rating", e.target.value)} className="w-full p-1 border rounded bg-white" /></div>
                                        </div>
                                    </div>

                                    <div className="flex-1 p-6 bg-white relative">
                                        <div className="absolute top-4 right-4 text-xs font-bold text-teal-200">CURRENT MATCH</div>
                                        {match ? (
                                            <>
                                                <div className="flex gap-4 mb-4">
                                                    <img src={match.image_url} alt="Product" className="w-16 h-16 object-cover rounded bg-gray-100" />
                                                    <div>
                                                        <h3 className="font-bold text-teal-700 text-lg mb-1">{match.product_title}</h3>
                                                        <p className="text-xs text-slate-500 mb-1">{match.product_description?.substring(0, 100)}...</p>
                                                        <span className="font-bold text-slate-800">${match.unit_price}</span>
                                                    </div>
                                                </div>

                                                {/* Alternatives Selection */}
                                                {match.alternatives && match.alternatives.length > 0 && (
                                                    <div className="mt-4 border-t border-slate-100 pt-3">
                                                        <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">Switch to Alternative</div>
                                                        <div className="flex flex-col gap-2">
                                                            {match.alternatives.map((alt: any, idx: number) => (
                                                                <button 
                                                                    key={idx}
                                                                    onClick={() => handleSelectAlternative(items.indexOf(match), alt)}
                                                                    className="flex justify-between items-center text-left p-2 rounded border border-slate-100 hover:border-brand/50 hover:bg-slate-50 transition-all group"
                                                                >
                                                                    <div className="text-xs">
                                                                        <div className="font-semibold text-slate-700 group-hover:text-brand">{alt.title}</div>
                                                                        <div className="text-slate-400">{(alt.score * 100).toFixed(0)}% Match</div>
                                                                    </div>
                                                                    <span className="text-xs font-mono font-bold text-slate-600">${alt.price}</span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">Pending match generation...</div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* --- TAB 2: PRICING --- */}
                {activeTab === 'pricing' && (
                    <div className="animate-fade-in bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                            <h2 className="font-bold text-xl text-slate-800">Final Pricing</h2>
                        </div>
                        <div className="p-6">
                            <div className="mb-6"><label className="block text-sm font-bold text-slate-700 mb-2">Client Name</label><input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} className="w-full max-w-md px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-brand" /></div>
                            <table className="w-full">
                                <thead className="bg-slate-50 text-left text-xs font-bold text-slate-500 uppercase">
                                    <tr><th className="px-4 py-3">RFP Ref</th><th className="px-4 py-3">Product</th><th className="px-4 py-3 w-32">Qty</th><th className="px-4 py-3 w-40">Price</th><th className="px-4 py-3 w-40 text-right">Total</th></tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {items.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50">
                                            <td className="px-4 py-4 text-xs font-bold text-slate-500">{item.requirement_id || "-"}</td>
                                            <td className="px-4 py-4"><div className="font-bold text-slate-800">{item.product_title}</div></td>
                                            <td className="px-4 py-4"><input type="number" min="1" value={item.quantity} onChange={(e) => handleQuantityChange(idx, parseInt(e.target.value))} className="w-20 px-2 py-1 border rounded text-center" /></td>
                                            <td className="px-4 py-4"><input type="number" min="0" value={item.unit_price} onChange={(e) => handlePriceChange(idx, parseFloat(e.target.value))} className="w-24 px-2 py-1 border rounded text-right" /></td>
                                            <td className="px-4 py-4 text-right font-bold">${(item.price || 0).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* --- TAB 3: FINALIZE --- */}
                {activeTab === 'finalize' && (
                    <div className="animate-fade-in max-w-4xl mx-auto">
                        <div className="bg-white shadow-2xl rounded-none md:rounded-lg overflow-hidden mb-8 print:shadow-none print:w-full">
                            <div className="bg-slate-900 text-white p-12 print:bg-white print:text-black print:p-0 print:border-b-2 print:border-black print:mb-8">
                                <div className="flex justify-between"><div><h1 className="text-4xl font-bold mb-2">Quotation</h1><p className="opacity-75">#{data.id}</p></div><div className="text-right"><div className="text-2xl font-bold">{clientName}</div><div className="text-sm opacity-75">{new Date().toLocaleDateString()}</div></div></div>
                            </div>
                            <div className="p-12 print:p-0">
                                <table className="w-full mb-12">
                                    <thead><tr className="border-b-2 border-slate-800 text-left text-sm font-bold uppercase"><th className="py-3">Ref</th><th className="py-3 w-16">Img</th><th className="py-3">Description</th><th className="py-3 text-center">Qty</th><th className="py-3 text-right">Price</th><th className="py-3 text-right">Total</th></tr></thead>
                                    <tbody>
                                        {items.map((item, idx) => (
                                            <tr key={idx} className="border-b border-slate-200">
                                                <td className="py-4 text-xs font-bold text-slate-500">{item.requirement_id || "-"}</td>
                                                <td className="py-4"><img src={item.image_url} className="w-12 h-12 object-cover rounded bg-slate-100" /></td>
                                                <td className="py-4"><div className="font-bold text-slate-800">{item.product_title}</div></td>
                                                <td className="py-4 text-center">{item.quantity}</td>
                                                <td className="py-4 text-right">${item.unit_price?.toLocaleString()}</td>
                                                <td className="py-4 text-right font-bold">${item.price?.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <div className="flex justify-end mb-12"><div className="w-64"><div className="flex justify-between py-4 text-xl font-bold text-slate-900"><span>Total</span><span>${calculateTotal().toLocaleString()}</span></div></div></div>
                            </div>
                        </div>
                        <div className="flex justify-center gap-4 print:hidden">
                            <button onClick={() => handleStatusChange('sent')} className="bg-green-600 text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:bg-green-700">✅ Confirm & Mark as Sent</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}