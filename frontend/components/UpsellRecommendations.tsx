"use client";

import { useMemo } from "react";

type UpsellProps = {
    items: any[];
    onAddItem: (item: any) => void;
};

export function UpsellRecommendations({ items, onAddItem }: UpsellProps) {
    // Determine missing items based on rules
    const suggestions = useMemo(() => {
        const itemTitles = items.map(i => i.product_title.toLowerCase());
        const suggs = [];

        // Rule 1: LED Strips usually need Drivers
        const hasStrip = itemTitles.some(t => t.includes("strip") || t.includes("tape"));
        const hasDriver = itemTitles.some(t => t.includes("driver") || t.includes("supply"));
        if (hasStrip && !hasDriver) {
            suggs.push({
                product_title: "24V LED Driver (100W)",
                product_description: "Essential for powering LED strips. IP67 rated.",
                unit_price: 45.00,
                quantity: 1,
                reasoning: "Required for LED Strips",
                image_url: "https://via.placeholder.com/150?text=Driver"
            });
        }

        // Rule 2: Panels often need Suspension Kits or Frames
        const hasPanel = itemTitles.some(t => t.includes("panel") || t.includes("troffer"));
        const hasMount = itemTitles.some(t => t.includes("suspension") || t.includes("frame") || t.includes("clip"));
        if (hasPanel && !hasMount) {
            suggs.push({
                product_title: "Suspension Mounting Kit",
                product_description: "1m adjustable steel wire kit for panels.",
                unit_price: 12.50,
                quantity: 1,
                reasoning: "Often needed for install",
                image_url: "https://via.placeholder.com/150?text=Kit"
            });
        }

         // Rule 3: High bay lights often need motion sensors
         const hasHighbay = itemTitles.some(t => t.includes("high bay") || t.includes("ufo"));
         const hasSensor = itemTitles.some(t => t.includes("sensor") || t.includes("control"));
         if (hasHighbay && !hasSensor) {
             suggs.push({
                 product_title: "Microwave Motion Sensor",
                 product_description: "Plug-and-play sensor for extra energy savings.",
                 unit_price: 35.00,
                 quantity: 1,
                 reasoning: "Increases energy savings",
                 image_url: "https://via.placeholder.com/150?text=Sensor"
             });
         }

        return suggs;
    }, [items]);

    if (suggestions.length === 0) return null;

    return (
        <div className="mb-6 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
                <span className="bg-orange-100 text-orange-600 p-1 rounded-md text-xs">💡 Smart Tip</span>
                <h4 className="text-sm font-bold text-orange-900">Recommended Add-ons</h4>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {suggestions.map((s, i) => (
                    <div key={i} className="bg-white p-3 rounded-lg border border-orange-100 shadow-sm flex items-center justify-between gap-3">
                        <div>
                            <div className="font-bold text-slate-800 text-sm">{s.product_title}</div>
                            <div className="text-xs text-slate-500">{s.reasoning}</div>
                        </div>
                        <button 
                            onClick={() => onAddItem(s)}
                            className="bg-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-orange-600 transition-colors shadow-sm whitespace-nowrap"
                        >
                            + Add ${s.unit_price}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}