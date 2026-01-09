"use client";

type ProfitCardProps = {
    revenue: number;
    cost: number;
};

export function ProfitabilityCard({ revenue, cost }: ProfitCardProps) {
    const profit = revenue - cost;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

    // Color logic
    const marginColor = margin < 20 ? 'text-red-500' : margin < 35 ? 'text-yellow-500' : 'text-green-500';
    const progressColor = margin < 20 ? 'bg-red-500' : margin < 35 ? 'bg-yellow-500' : 'bg-green-500';

    return (
        <div className="bg-slate-900 text-white rounded-xl p-6 shadow-2xl flex flex-col md:flex-row gap-8 items-center justify-between">
            <div className="flex-1 w-full">
                <h4 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-4">Commercial Summary</h4>
                <div className="flex justify-between items-end mb-2">
                    <div>
                        <div className="text-2xl font-bold">{margin.toFixed(1)}%</div>
                        <div className="text-xs text-slate-400">Net Margin</div>
                    </div>
                    <div className="text-right">
                        <div className={`text-2xl font-bold ${profit >= 0 ? 'text-white' : 'text-red-400'}`}>${profit.toLocaleString()}</div>
                        <div className="text-xs text-slate-400">Total Profit</div>
                    </div>
                </div>
                {/* Visual Margin Bar */}
                <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div 
                        className={`h-full ${progressColor} transition-all duration-500`} 
                        style={{ width: `${Math.min(margin, 100)}%` }}
                    />
                </div>
            </div>

            <div className="w-px h-16 bg-slate-700 hidden md:block"></div>

            <div className="flex gap-8 text-sm">
                <div>
                    <div className="text-slate-400 mb-1">Total Cost</div>
                    <div className="font-mono font-bold text-lg">${cost.toLocaleString()}</div>
                </div>
                <div>
                    <div className="text-slate-400 mb-1">Total Revenue</div>
                    <div className="font-mono font-bold text-lg text-brand-300">${revenue.toLocaleString()}</div>
                </div>
            </div>
        </div>
    );
}