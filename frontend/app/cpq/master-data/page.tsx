"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { AuthGuard } from "@/components/AuthGuard";
import { LoadingSpinner } from "@/components/LoadingSpinner";

export default function MasterDataPage() {
    const [activeTab, setActiveTab] = useState<"labor" | "materials" | "margins">("labor");
    const [loading, setLoading] = useState(true);
    const [laborRates, setLaborRates] = useState<any[]>([]);
    const [consumables, setConsumables] = useState<any[]>([]);

    useEffect(() => {
        fetchMasterData();
    }, []);

    const fetchMasterData = async () => {
        try {
            const [laborRes, matRes] = await Promise.all([
                fetch('http://localhost:8000/api/cpq/labor-rates'),
                fetch('http://localhost:8000/api/cpq/consumables')
            ]);
            
            if (laborRes.ok) setLaborRates(await laborRes.json());
            if (matRes.ok) setConsumables(await matRes.json());

        } catch (error) {
            console.error("Error fetching master data:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <AuthGuard>
            <div className="min-h-screen bg-slate-50">
                <Navbar />
                <div className="max-w-7xl mx-auto px-6 py-10">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">CPQ Master Data</h1>
                    <p className="text-slate-500 mb-8">Manage cost baselines, rate cards, and pricing rules.</p>

                    {/* Tabs */}
                    <div className="flex gap-6 border-b border-slate-200 mb-8">
                        {["labor", "materials", "margins"].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`pb-3 text-sm font-bold capitalize transition-colors ${activeTab === tab ? "text-brand border-b-2 border-brand" : "text-slate-400 hover:text-slate-600"}`}
                            >
                                {tab} Data
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 min-h-[400px]">
                        
                        {activeTab === "labor" && (
                            <div>
                                <div className="flex justify-between mb-6">
                                    <h3 className="font-bold text-lg">Labor Rate Cards (2025)</h3>
                                    <button className="bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-lg">+ Add Role</button>
                                </div>
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                                        <tr>
                                            <th className="px-4 py-3">Role</th>
                                            <th className="px-4 py-3">Category</th>
                                            <th className="px-4 py-3 text-right">Hr Cost (CTC)</th>
                                            <th className="px-4 py-3 text-right">Hr Sell (Std)</th>
                                            <th className="px-4 py-3 text-right">Margin %</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {laborRates.map((r, i) => (
                                            <tr key={i} className="hover:bg-slate-50">
                                                <td className="px-4 py-3 font-medium text-slate-800">{r.role_name}</td>
                                                <td className="px-4 py-3 text-slate-500"><span className="bg-slate-100 px-2 py-1 rounded text-xs">{r.category}</span></td>
                                                <td className="px-4 py-3 text-right font-mono text-red-600">${Number(r.hourly_rate_cost).toFixed(2)}</td>
                                                <td className="px-4 py-3 text-right font-mono text-blue-600">${Number(r.hourly_rate_sell).toFixed(2)}</td>
                                                <td className="px-4 py-3 text-right font-bold text-green-600">
                                                    {(((Number(r.hourly_rate_sell) - Number(r.hourly_rate_cost)) / Number(r.hourly_rate_sell)) * 100).toFixed(1)}%
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {activeTab === "materials" && (
                            <div>
                                <div className="flex justify-between mb-6">
                                    <h3 className="font-bold text-lg">Consumables Library</h3>
                                    <button className="bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-lg">+ Add SKU</button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {consumables.map((m, i) => (
                                        <div key={i} className="p-4 border border-slate-200 rounded-xl hover:border-brand transition-colors">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="font-bold text-slate-700">{m.name}</div>
                                                <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded">{m.sku}</span>
                                            </div>
                                            <div className="text-sm text-slate-500">Unit Cost: <span className="font-mono font-bold text-slate-900">${Number(m.unit_cost).toFixed(2)}</span></div>
                                            <div className="text-xs text-slate-400 mt-1">UoM: {m.unit_of_measure}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === "margins" && (
                            <div className="max-w-xl">
                                <h3 className="font-bold text-lg mb-6">Margin Guardrails</h3>
                                <div className="space-y-4">
                                    <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl flex justify-between items-center">
                                        <div>
                                            <div className="font-bold text-orange-900">Minimum Gross Margin</div>
                                            <div className="text-xs text-orange-700">Quotes below this require Director approval</div>
                                        </div>
                                        <div className="text-2xl font-bold text-orange-600">18.0%</div>
                                    </div>
                                    
                                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-center">
                                        <div>
                                            <div className="font-bold text-slate-900">Mobilization Fee</div>
                                            <div className="text-xs text-slate-500">Standard charge for new contracts</div>
                                        </div>
                                        <div className="text-xl font-bold text-slate-700">5.0%</div>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </AuthGuard>
    );
}