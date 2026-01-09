"use client";

import { useState, useMemo } from "react";

type ROICalculatorProps = {
    totalNewWattage: number; // Total wattage of the new quotation
    totalCost: number;       // Total investment cost
};

export function EnergyROICalculator({ totalNewWattage, totalCost }: ROICalculatorProps) {
    // Defaults: Commercial rates (approx $0.15/kWh) and 12 hours/day operation
    const [energyRate, setEnergyRate] = useState(0.15);
    const [dailyHours, setDailyHours] = useState(12);
    const [daysPerYear, setDaysPerYear] = useState(260); // Commercial year
    
    // Estimate old wattage (assuming a 50% reduction for typical LED upgrades if not known)
    // In a real app, you'd let the user input "Existing Fixture Wattage" per line item.
    const [existingWattage, setExistingWattage] = useState(totalNewWattage * 2.5); 

    const stats = useMemo(() => {
        const annualHours = dailyHours * daysPerYear;
        
        // kWh consumption
        const oldKwh = (existingWattage * annualHours) / 1000;
        const newKwh = (totalNewWattage * annualHours) / 1000;
        
        // Costs
        const oldCost = oldKwh * energyRate;
        const newCost = newKwh * energyRate;
        
        const annualSavings = oldCost - newCost;
        const monthlySavings = annualSavings / 12;
        const roiMonths = annualSavings > 0 ? (totalCost / annualSavings) * 12 : 0;
        const fiveYearSavings = (annualSavings * 5) - totalCost;

        return { annualSavings, monthlySavings, roiMonths, fiveYearSavings, oldCost, newCost };
    }, [energyRate, dailyHours, daysPerYear, existingWattage, totalNewWattage, totalCost]);

    return (
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl shadow-xl overflow-hidden">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center">
                <h3 className="font-bold text-lg flex items-center gap-2">
                    <span className="text-yellow-400">⚡</span> ROI Investment Analysis
                </h3>
                <div className="text-xs bg-slate-700 px-2 py-1 rounded text-slate-300">
                    Est. Payback: <span className="text-white font-bold">{stats.roiMonths.toFixed(1)} Months</span>
                </div>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Inputs */}
                <div className="space-y-4 text-sm">
                    <div>
                        <label className="block text-slate-400 text-xs uppercase font-bold mb-1">Electricity Rate ($/kWh)</label>
                        <input type="number" step="0.01" value={energyRate} onChange={e => setEnergyRate(parseFloat(e.target.value))} className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 focus:border-brand outline-none" />
                    </div>
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-slate-400 text-xs uppercase font-bold mb-1">Hours/Day</label>
                            <input type="number" value={dailyHours} onChange={e => setDailyHours(parseFloat(e.target.value))} className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 focus:border-brand outline-none" />
                        </div>
                        <div className="flex-1">
                            <label className="block text-slate-400 text-xs uppercase font-bold mb-1">Days/Year</label>
                            <input type="number" value={daysPerYear} onChange={e => setDaysPerYear(parseFloat(e.target.value))} className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 focus:border-brand outline-none" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-slate-400 text-xs uppercase font-bold mb-1">Comparison: Old System Watts</label>
                        <input type="number" value={existingWattage} onChange={e => setExistingWattage(parseFloat(e.target.value))} className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 focus:border-brand outline-none text-yellow-500 font-mono" />
                    </div>
                </div>

                {/* Big Stats */}
                <div className="flex flex-col justify-center space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-700 pb-4">
                        <div className="text-slate-400">Annual Energy Savings</div>
                        <div className="text-2xl font-bold text-green-400">${stats.annualSavings.toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
                    </div>
                    <div className="flex items-center justify-between border-b border-slate-700 pb-4">
                        <div className="text-slate-400">5-Year Net Profit</div>
                        <div className="text-2xl font-bold text-brand-300">${stats.fiveYearSavings.toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
                    </div>
                    
                    {/* Visual Bar */}
                    <div className="space-y-2">
                         <div className="flex justify-between text-xs text-slate-500">
                             <span>Old Bill: ${stats.oldCost.toFixed(0)}</span>
                             <span>New Bill: ${stats.newCost.toFixed(0)}</span>
                         </div>
                         <div className="h-4 bg-slate-700 rounded-full overflow-hidden flex">
                             <div className="h-full bg-green-500" style={{ width: '100%' }}></div>
                             <div className="h-full bg-red-500 opacity-30" style={{ width: `${(stats.newCost/stats.oldCost)*100}%` }}></div>
                         </div>
                         <div className="text-center text-xs text-green-400 font-bold mt-1">
                             Reduces energy costs by {((1 - (stats.newCost/stats.oldCost)) * 100).toFixed(0)}%
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
}