"use client";

import { useState, useMemo } from "react";

type EnergyProps = {
    totalNewWattage: number;
    totalCost: number;
};

export function EnergyROICalculator({ totalNewWattage, totalCost }: EnergyProps) {
    const [hoursPerDay, setHoursPerDay] = useState(12);
    const [daysPerWeek, setDaysPerWeek] = useState(5);
    const [energyCost, setEnergyCost] = useState(0.15); // $ per kWh
    const [legacyMultiplier, setLegacyMultiplier] = useState(2.5); // Fluorescent is approx 2.5x LED wattage

    // Calculations
    const annualHours = hoursPerDay * daysPerWeek * 52;
    const oldWattage = totalNewWattage * legacyMultiplier;
    const energySavedKW = (oldWattage - totalNewWattage) / 1000;
    const annualSavings = energySavedKW * annualHours * energyCost;
    const paybackMonths = annualSavings > 0 ? (totalCost / annualSavings) * 12 : 0;
    const co2Saved = energySavedKW * annualHours * 0.4; // Approx 0.4kg CO2 per kWh

    return (
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 p-6 text-white">
                <h3 className="text-xl font-bold flex items-center gap-2">
                    <span className="text-brand-300">⚡</span> Energy ROI Analysis
                </h3>
                <p className="text-slate-400 text-sm mt-1">Show your client how this investment pays for itself.</p>
            </div>

            <div className="p-6 grid lg:grid-cols-2 gap-8">
                {/* Inputs */}
                <div className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Comparison Baseline (Existing Tech)</label>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { label: "Fluorescent", val: 2.2 },
                                { label: "Halogen", val: 5.0 },
                                { label: "Metal Halide", val: 3.0 }
                            ].map((opt) => (
                                <button
                                    key={opt.label}
                                    onClick={() => setLegacyMultiplier(opt.val)}
                                    className={`py-2 px-3 text-sm font-bold rounded-lg border transition-all ${legacyMultiplier === opt.val ? 'bg-brand text-white border-brand' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Operating Hours</label>
                            <span className="text-xs font-bold text-brand">{hoursPerDay}h / day</span>
                        </div>
                        <input type="range" min="1" max="24" value={hoursPerDay} onChange={(e) => setHoursPerDay(parseInt(e.target.value))} className="w-full accent-brand" />
                    </div>

                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Energy Cost ($/kWh)</label>
                            <span className="text-xs font-bold text-brand">${energyCost.toFixed(2)}</span>
                        </div>
                        <input type="number" step="0.01" value={energyCost} onChange={(e) => setEnergyCost(parseFloat(e.target.value))} className="w-full p-2 border border-slate-200 rounded-lg" />
                    </div>
                </div>

                {/* Results Dashboard */}
                <div className="bg-slate-50 rounded-xl p-6 border border-slate-100 flex flex-col justify-center">
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                            <div className="text-xs text-slate-400 font-bold uppercase">Annual Savings</div>
                            <div className="text-2xl font-bold text-green-600">${annualSavings.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                            <div className="text-xs text-slate-400 font-bold uppercase">Payback Period</div>
                            <div className="text-2xl font-bold text-blue-600">{paybackMonths.toFixed(1)} <span className="text-sm text-slate-400 font-normal">months</span></div>
                        </div>
                    </div>
                    
                    <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Old System Load</span>
                            <span className="font-mono font-bold">{(oldWattage/1000).toFixed(1)} kW</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">New LED Load</span>
                            <span className="font-mono font-bold text-green-600">{(totalNewWattage/1000).toFixed(1)} kW</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-2">
                            <div className="bg-green-500 h-full" style={{ width: `${(totalNewWattage / oldWattage) * 100}%` }}></div>
                        </div>
                        <p className="text-xs text-slate-400 mt-2 text-center">
                            You reduce energy consumption by {((1 - totalNewWattage/oldWattage) * 100).toFixed(0)}%
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}