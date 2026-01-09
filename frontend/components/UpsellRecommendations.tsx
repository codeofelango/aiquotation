"use client";

import { useMemo } from "react";

type UpsellProps = {
    items: any[];
    onAddItem: (item: any) => void;
};

// Simulated "AI" Logic for Upselling
const RULES = [
    { keyword: "Strip", required: ["Driver", "Profile"], suggestion: { title: "24V LED Driver - 100W", price: 45, description: "Essential for powering LED strips safely." } },
    { keyword: "Tape", required: ["Driver"], suggestion: { title: "Aluminum Profile Kit", price: 15, description: "Heat dissipation and clean installation for tapes." } },
    { keyword: "Panel", required: ["Suspension"], suggestion: { title: "Emergency Battery Pack (3hr)", price: 35, description: "Mandatory for compliance in office escapes." } },
    { keyword: "Downlight", required: ["Dimmer"], suggestion: { title: "Smart Dimmer Module", price: 55, description: "Enable app control and dimming." } },
    { keyword: "High Bay", required: ["Sensor"], suggestion: { title: "PIR Occupancy Sensor", price: 25, description: "Save energy by turning off when warehouse is empty." } },
];

export function UpsellRecommendations({ items, onAddItem }: UpsellProps) {
    const suggestions = useMemo(() => {
        const found: any[] = [];
        const existingTitles = items.map(i => i.product_title.toLowerCase());

        items.forEach(item => {
            RULES.forEach(rule => {
                if (item.product_title.includes(rule.keyword)) {
                    // Check if the suggestion is already in the quote
                    const alreadyAdded = existingTitles.some(t => t.includes(rule.suggestion.title.toLowerCase()));
                    if (!alreadyAdded && !found.some(f => f.title === rule.suggestion.title)) {
                        found.push({
                            ...rule.suggestion,
                            reason: `Recommended for your ${item.product_title}`
                        });
                    }
                }
            });
        });
        return found;
    }, [items]);

    if (suggestions.length === 0) return null;

    return (
        <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 mb-6">
            <h3 className="font-bold text-orange-800 text-sm flex items-center gap-2 mb-3">
                <span>🎁</span> Frequently Bought Together (Increase Value)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {suggestions.map((s, i) => (
                    <div key={i} className="bg-white border border-orange-200 p-3 rounded-lg shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                        <div>
                            <div className="font-bold text-slate-800 text-sm">{s.title}</div>
                            <div className="text-xs text-slate-500 mb-2">{s.description}</div>
                            <div className="text-[10px] text-orange-600 font-medium italic mb-2">{s.reason}</div>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                            <span className="font-mono font-bold text-slate-700">${s.price}</span>
                            <button 
                                onClick={() => onAddItem({
                                    product_title: s.title,
                                    product_description: s.description,
                                    quantity: 1,
                                    unit_price: s.price,
                                    price: s.price,
                                    image_url: "https://placehold.co/100x100?text=Accessory", // Placeholder
                                    requirement_id: "ACC-UPSELL"
                                })}
                                className="bg-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded hover:bg-orange-600 transition-colors"
                            >
                                + Add
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}