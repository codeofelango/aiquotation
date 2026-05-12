"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { AuthGuard } from "@/components/AuthGuard";
import { LoadingSpinner } from "@/components/LoadingSpinner";

// Types matching the DB Schema
type LaborRate = {
    id: number;
    role_name: string;
    category: string;
    hourly_rate_cost: number;
    hourly_rate_sell: number;
};

type Consumable = {
    id: number;
    sku: string;
    name: string;
    unit_cost: number;
    unit_of_measure: string;
};

type LineItem = {
    id: number;
    type: "Labor" | "Material";
    description: string; // Combined Name/Role
    qty: number;
    unit: string;
    unit_cost: number;
    unit_price: number;
};

export default function EstimatorPage() {
    const [loading, setLoading] = useState(true);
    const [laborRates, setLaborRates] = useState<LaborRate[]>([]);
    const [consumables, setConsumables] = useState<Consumable[]>([]);
    
    // Line Items State
    const [lineItems, setLineItems] = useState<LineItem[]>([]);

    // Selection State for Adding New Items
    const [newItemType, setNewItemType] = useState<"Labor" | "Material">("Labor");
    const [selectedLaborId, setSelectedLaborId] = useState<string>("");
    const [selectedMaterialId, setSelectedMaterialId] = useState<string>("");
    const [newItemQty, setNewItemQty] = useState<number>(1);

    // Fetch Data on Load
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Labor Rates
                const laborRes = await fetch('http://localhost:8000/api/cpq/labor-rates');
                const laborData = await laborRes.json();
                
                // Fetch Consumables
                const matRes = await fetch('http://localhost:8000/api/cpq/consumables');
                const matData = await matRes.json();

                if (Array.isArray(laborData)) setLaborRates(laborData);
                if (Array.isArray(matData)) setConsumables(matData);

                // Initialize with some dummy data if empty, mapped to real data if possible
                if (laborData.length > 0 && matData.length > 0) {
                     setLineItems([
                        { 
                            id: 1, 
                            type: "Labor", 
                            description: laborData[0].role_name, 
                            qty: 160, 
                            unit: "Hours", 
                            unit_cost: Number(laborData[0].hourly_rate_cost), 
                            unit_price: Number(laborData[0].hourly_rate_sell) 
                        },
                        { 
                            id: 2, 
                            type: "Material", 
                            description: matData[0].name, 
                            qty: 10, 
                            unit: matData[0].unit_of_measure, 
                            unit_cost: Number(matData[0].unit_cost), 
                            unit_price: Number(matData[0].unit_cost) * 1.2 // Default 20% markup
                        },
                    ]);
                }
            } catch (error) {
                console.error("Failed to fetch CPQ master data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleAddItem = () => {
        let newItem: LineItem | null = null;
        const newId = Math.max(0, ...lineItems.map(i => i.id)) + 1;

        if (newItemType === "Labor" && selectedLaborId) {
            const labor = laborRates.find(l => l.id.toString() === selectedLaborId);
            if (labor) {
                newItem = {
                    id: newId,
                    type: "Labor",
                    description: labor.role_name,
                    qty: newItemQty,
                    unit: "Hours",
                    unit_cost: Number(labor.hourly_rate_cost),
                    unit_price: Number(labor.hourly_rate_sell)
                };
            }
        } else if (newItemType === "Material" && selectedMaterialId) {
            const mat = consumables.find(m => m.id.toString() === selectedMaterialId);
            if (mat) {
                newItem = {
                    id: newId,
                    type: "Material",
                    description: mat.name,
                    qty: newItemQty,
                    unit: mat.unit_of_measure,
                    unit_cost: Number(mat.unit_cost),
                    unit_price: Number(mat.unit_cost) * 1.3 // Default 30% markup for materials
                };
            }
        }

        if (newItem) {
            setLineItems([...lineItems, newItem]);
            // Reset selection
            setNewItemQty(1);
        }
    };

    const handleRemoveItem = (id: number) => {
        setLineItems(lineItems.filter(i => i.id !== id));
    };

    // Calculations
    const totalCost = lineItems.reduce((acc, item) => acc + (item.unit_cost * item.qty), 0);
    const totalRevenue = lineItems.reduce((acc, item) => acc + (item.unit_price * item.qty), 0);
    const margin = totalRevenue - totalCost;
    const marginPercent = totalRevenue > 0 ? (margin / totalRevenue) * 100 : 0;

    if (loading) return <LoadingSpinner />;

    return (
        <AuthGuard>
            <div className="min-h-screen bg-slate-50">
                <Navbar />
                
                {/* Top Bar: Financial Summary */}
                <div className="bg-slate-900 text-white p-6 sticky top-[72px] z-10 shadow-md transition-all">
                    <div className="max-w-7xl mx-auto flex justify-between items-center">
                        <div>
                            <h1 className="text-xl font-bold">Quote Estimator</h1>
                            <p className="text-xs text-slate-400">Ref: QT-2026-LIVE-001</p>
                        </div>
                        <div className="flex gap-8 text-sm">
                            <div className="text-right">
                                <div className="text-slate-400 text-xs uppercase">Cost (CTC)</div>
                                <div className="font-mono font-bold">${totalCost.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-slate-400 text-xs uppercase">Revenue</div>
                                <div className="font-mono font-bold text-brand-300">${totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-slate-400 text-xs uppercase">Net Margin</div>
                                <div className={`font-bold text-lg ${marginPercent < 18 ? 'text-red-400' : 'text-green-400'}`}>
                                    {marginPercent.toFixed(1)}%
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Left: Builder */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <span>🛠️</span> Build BOQ (Bill of Quantities)
                            </h3>
                            
                            {/* Add Item Interface */}
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6 grid grid-cols-12 gap-3 items-end">
                                <div className="col-span-3">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Type</label>
                                    <select 
                                        className="w-full text-sm p-2 border border-slate-300 rounded"
                                        value={newItemType}
                                        onChange={(e) => setNewItemType(e.target.value as "Labor" | "Material")}
                                    >
                                        <option value="Labor">Labor</option>
                                        <option value="Material">Material</option>
                                    </select>
                                </div>
                                
                                <div className="col-span-6">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Item Selection</label>
                                    <select 
                                        className="w-full text-sm p-2 border border-slate-300 rounded"
                                        value={newItemType === "Labor" ? selectedLaborId : selectedMaterialId}
                                        onChange={(e) => newItemType === "Labor" ? setSelectedLaborId(e.target.value) : setSelectedMaterialId(e.target.value)}
                                    >
                                        <option value="">Select Item...</option>
                                        {newItemType === "Labor" 
                                            ? laborRates.map(l => (
                                                <option key={l.id} value={l.id}>{l.role_name} (${l.hourly_rate_cost}/hr)</option>
                                            ))
                                            : consumables.map(c => (
                                                <option key={c.id} value={c.id}>{c.name} (${c.unit_cost}/{c.unit_of_measure})</option>
                                            ))
                                        }
                                    </select>
                                </div>

                                <div className="col-span-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Qty</label>
                                    <input 
                                        type="number" 
                                        className="w-full text-sm p-2 border border-slate-300 rounded"
                                        value={newItemQty}
                                        onChange={(e) => setNewItemQty(Number(e.target.value))}
                                        min={1}
                                    />
                                </div>

                                <div className="col-span-1">
                                    <button 
                                        onClick={handleAddItem}
                                        className="w-full h-[38px] bg-brand text-white rounded font-bold flex items-center justify-center hover:bg-brand-dark"
                                        title="Add Item"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                            
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                                        <tr>
                                            <th className="p-3">Type</th>
                                            <th className="p-3">Item Description</th>
                                            <th className="p-3 w-20">Qty</th>
                                            <th className="p-3 w-24">Unit Cost</th>
                                            <th className="p-3 w-24">Unit Price</th>
                                            <th className="p-3 text-right">Total</th>
                                            <th className="p-3 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {lineItems.map((item) => (
                                            <tr key={item.id} className="hover:bg-slate-50 group">
                                                <td className="p-3"><span className={`px-2 py-1 rounded text-xs font-bold ${item.type === 'Labor' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>{item.type}</span></td>
                                                <td className="p-3 font-medium text-slate-800">
                                                    {item.description}
                                                    <span className="text-xs text-slate-400 block">{item.unit}</span>
                                                </td>
                                                <td className="p-3"><input type="number" className="w-full p-1 border border-slate-200 rounded text-center" value={item.qty} readOnly /></td>
                                                <td className="p-3 text-slate-500 font-mono">${item.unit_cost.toFixed(2)}</td>
                                                <td className="p-3 font-mono font-bold text-blue-600">${item.unit_price.toFixed(2)}</td>
                                                <td className="p-3 text-right font-bold">${(item.unit_price * item.qty).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                                <td className="p-3 text-right">
                                                    <button onClick={() => handleRemoveItem(item.id)} className="text-red-400 hover:text-red-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                                                </td>
                                            </tr>
                                        ))}
                                        {lineItems.length === 0 && (
                                            <tr>
                                                <td colSpan={7} className="p-8 text-center text-slate-400 italic">No items in quotation. Add items above.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Right: Controls & Analysis */}
                    <div className="space-y-6">
                        
                        {/* Variables */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase">Site Variables</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Contract Duration</label>
                                    <select className="w-full p-2 border border-slate-200 rounded-lg text-sm">
                                        <option>1 Year</option>
                                        <option>3 Years (Annual Escalation)</option>
                                        <option>5 Years</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Site Complexity</label>
                                    <div className="flex gap-2">
                                        {['Low', 'Medium', 'High'].map(l => (
                                            <button key={l} className={`flex-1 py-2 rounded-lg text-xs font-bold border ${l === 'Medium' ? 'bg-brand text-white border-brand' : 'bg-white text-slate-600 border-slate-200'}`}>{l}</button>
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-1">Adjusts risk premium by +5%</p>
                                </div>
                            </div>
                        </div>

                        {/* Approvals */}
                        <div className={`rounded-xl p-6 border ${marginPercent < 18 ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'}`}>
                            <h3 className={`font-bold text-sm uppercase mb-2 ${marginPercent < 18 ? 'text-orange-800' : 'text-green-800'}`}>
                                {marginPercent < 18 ? '⚠️ Approval Required' : '✅ Auto-Approved'}
                            </h3>
                            <p className={`text-xs mb-4 ${marginPercent < 18 ? 'text-orange-700' : 'text-green-700'}`}>
                                {marginPercent < 18 
                                    ? "Margin is below the 18% threshold. Director approval required before sending." 
                                    : "Quote meets all financial guardrails."}
                            </p>
                            <button className={`w-full py-2 rounded-lg text-sm font-bold text-white shadow-sm ${marginPercent < 18 ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-600 hover:bg-green-700'}`}>
                                {marginPercent < 18 ? 'Request Approval' : 'Generate Quote'}
                            </button>
                        </div>

                        {/* Export */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase">Export</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <button className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50 text-xs font-bold text-slate-600 flex flex-col items-center gap-1">
                                    <span className="text-xl">📄</span> PDF Quote
                                </button>
                                <button className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50 text-xs font-bold text-slate-600 flex flex-col items-center gap-1">
                                    <span className="text-xl">📊</span> MRI Export
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </AuthGuard>
    );
}