"use client";

import { useState, useMemo } from "react";
import { ProductImage } from "./ProductImage";

type VEPanelProps = {
    items: any[];
    onSwap: (originalIndex: number, newProduct: any) => void;
};

export function ValueEngineeringPanel({ items, onSwap }: VEPanelProps) {
    const [isOpen, setIsOpen] = useState(true);

    // Identify items where a cheaper, high-quality alternative exists
    const opportunities = useMemo(() => {
        const ops: any[] = [];
        items.forEach((item, idx) => {
            if (!item.alternatives || item.alternatives.length === 0) return;

            // Find alternatives that are cheaper and have a decent match score (> 80%)
            const betterOptions = item.alternatives.filter(
                (alt: any) => alt.price < item.unit_price && alt.score > 0.8
            );

            if (betterOptions.length > 0) {
                // Sort by biggest savings
                betterOptions.sort((a: any, b: any) => a.price - b.price);
                ops.push({
                    index: idx,
                    original: item,
                    bestAlt: betterOptions[0],
                    savings: (item.unit_price - betterOptions[0].price) * item.quantity
                });
            }
        });
        return ops.sort((a, b) => b.savings - a.savings);
    }, [items]);

    const totalPotentialSavings = opportunities.reduce((acc, op) => acc + op.savings, 0);

    if (opportunities.length === 0) return null;

    return (
        <div className="bg-white rounded-xl shadow-lg border border-purple-100 overflow-hidden mb-8 ring-1 ring-purple-500/10">
            <div 
                className="bg-gradient-to-r from-purple-50 to-white p-4 flex justify-between items-center cursor-pointer select-none border-b border-purple-100"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-3">
                    <div className="bg-purple-100 p-2 rounded-lg text-purple-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                    </div>
                    <div>
                        <h3 className="font-bold text-purple-900 text-lg">Value Engineering Opportunities</h3>
                        <p className="text-xs text-purple-600 font-medium">AI found {opportunities.length} swaps to optimize costs</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Potential Savings</div>
                    <div className="text-2xl font-bold text-green-600">${totalPotentialSavings.toLocaleString()}</div>
                </div>
            </div>

            {isOpen && (
                <div className="p-4 bg-slate-50/50 max-h-[400px] overflow-y-auto">
                    <div className="grid gap-4">
                        {opportunities.map((op, i) => (
                            <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-6 group hover:border-purple-300 transition-all">
                                
                                {/* Original Item */}
                                <div className="flex-1 min-w-0 opacity-60 group-hover:opacity-100 transition-opacity">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Current Selection</div>
                                    <div className="flex items-center gap-3">
                                        <ProductImage src={op.original.image_url} alt="Original" className="w-12 h-12 rounded-lg bg-slate-100 object-cover" />
                                        <div className="min-w-0">
                                            <div className="font-bold text-slate-700 truncate text-sm">{op.original.product_title}</div>
                                            <div className="text-xs font-mono text-slate-500">${op.original.unit_price.toLocaleString()} ea</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Arrow */}
                                <div className="text-purple-300">
                                    <svg className="w-6 h-6 rotate-90 md:rotate-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                </div>

                                {/* Alternative */}
                                <div className="flex-1 min-w-0">
                                    <div className="text-[10px] font-bold text-green-600 uppercase mb-1 flex justify-between">
                                        <span>Recommended Swap</span>
                                        <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded">{(op.bestAlt.score * 100).toFixed(0)}% Match</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <ProductImage src={op.bestAlt.image_url} alt="Alt" className="w-12 h-12 rounded-lg bg-slate-100 object-cover" />
                                        <div className="min-w-0">
                                            <div className="font-bold text-slate-800 truncate text-sm">{op.bestAlt.title}</div>
                                            <div className="text-xs font-mono text-green-600 font-bold">${op.bestAlt.price.toLocaleString()} ea</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Action */}
                                <div className="flex flex-col items-end gap-1 min-w-[120px]">
                                    <div className="text-sm font-bold text-green-600">Save ${op.savings.toLocaleString()}</div>
                                    <button 
                                        onClick={() => onSwap(op.index, op.bestAlt)}
                                        className="bg-purple-600 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-md hover:bg-purple-700 hover:scale-105 transition-all w-full"
                                    >
                                        Apply Swap
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}