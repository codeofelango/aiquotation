"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { AuthGuard } from "@/components/AuthGuard";
import { LoadingSpinner } from "@/components/LoadingSpinner";

// Types
type Deal = {
    id: number;
    title: string;
    company_name: string;
    estimated_value: number;
    status: string; // Used as Stage
    created_at: string;
};

type Column = {
    id: string; // The status string (e.g., "New", "Qualified")
    title: string;
    deals: Deal[];
};

export default function PipelinePage() {
    const [columns, setColumns] = useState<Column[]>([]);
    const [loading, setLoading] = useState(true);

    // Define the pipeline stages in order
    const STAGES = [
        { id: "New", title: "Lead / Discovery" },
        { id: "Qualified", title: "Qualified" },
        { id: "Site Survey", title: "Site Survey" },
        { id: "Proposal", title: "Proposal / Quote" },
        { id: "Negotiation", title: "Negotiation" },
        { id: "Converted", title: "Won / Contract" }
    ];

    useEffect(() => {
        fetchDeals();
    }, []);

    const fetchDeals = async () => {
        try {
            const res = await fetch('http://localhost:8000/api/crm/opportunities');
            if (res.ok) {
                const data: Deal[] = await res.json();
                
                // Group deals by status
                const newCols = STAGES.map(stage => ({
                    id: stage.id,
                    title: stage.title,
                    deals: Array.isArray(data) ? data.filter(d => d.status === stage.id) : []
                }));
                
                setColumns(newCols);
            } else {
                console.error("Failed to fetch deals", res.status);
            }
        } catch (error) {
            console.error("Error fetching pipeline:", error);
        } finally {
            setLoading(false);
        }
    };

    const updateDealStatus = async (dealId: number, newStatus: string) => {
        try {
            // Optimistic Update
            setColumns(prevCols => {
                const newCols = prevCols.map(col => ({
                    ...col,
                    deals: [...col.deals]
                }));
                
                let dealToMove: Deal | undefined;

                for (const col of newCols) {
                    const idx = col.deals.findIndex(d => d.id === dealId);
                    if (idx !== -1) {
                        dealToMove = col.deals[idx];
                        col.deals.splice(idx, 1);
                        break;
                    }
                }

                if (dealToMove) {
                    const targetCol = newCols.find(c => c.id === newStatus);
                    if (targetCol) {
                        dealToMove.status = newStatus;
                        targetCol.deals.push(dealToMove);
                    }
                }
                return newCols;
            });

            // API Call
            await fetch(`http://localhost:8000/api/crm/leads/${dealId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

        } catch (error) {
            console.error("Failed to move deal", error);
            fetchDeals(); // Revert on error
        }
    };

    if (loading) return <LoadingSpinner />;

    // Calculate totals safely
    const totalPipeline = columns.reduce((sum, col) => sum + col.deals.reduce((cSum, d) => cSum + (Number(d.estimated_value) || 0), 0), 0);

    return (
        <AuthGuard>
            <div className="min-h-screen bg-slate-50 flex flex-col">
                <Navbar />
                <div className="flex-1 overflow-x-auto p-6">
                    <div className="max-w-[1800px] mx-auto h-full flex flex-col">
                        <div className="flex justify-between items-end mb-6">
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900">Sales Pipeline</h1>
                                <p className="text-slate-500">Drag and drop opportunities to move them forward.</p>
                            </div>
                            <div className="flex gap-4 text-sm font-bold bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-100">
                                <div>Total Pipeline: <span className="text-brand">${totalPipeline.toLocaleString()}</span></div>
                            </div>
                        </div>

                        <div className="flex gap-4 h-full min-h-[600px]">
                            {columns.map((col, colIndex) => (
                                <div key={col.id} className="w-80 flex-shrink-0 flex flex-col bg-slate-100/50 rounded-xl border border-slate-200">
                                    <div className="p-4 border-b border-slate-200 bg-slate-100 rounded-t-xl flex justify-between items-center">
                                        <h3 className="font-bold text-slate-700 text-sm uppercase">{col.title}</h3>
                                        <span className="bg-white px-2 py-0.5 rounded text-xs font-bold text-slate-500">{col.deals.length}</span>
                                    </div>
                                    <div className="p-3 flex-1 space-y-3 overflow-y-auto">
                                        {col.deals.map(deal => (
                                            <div 
                                                key={deal.id} 
                                                className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 hover:shadow-md hover:border-brand/50 transition-all group relative"
                                            >
                                                <div className="text-xs text-slate-400 font-bold mb-1">{deal.company_name}</div>
                                                <div className="font-bold text-slate-800 mb-2">{deal.title}</div>
                                                <div className="flex justify-between items-end border-t border-slate-50 pt-2">
                                                    <span className="font-mono font-bold text-green-700">${Number(deal.estimated_value).toLocaleString()}</span>
                                                </div>
                                                
                                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex gap-1 bg-white/90 rounded shadow-sm">
                                                    {colIndex > 0 && (
                                                        <button 
                                                            onClick={() => updateDealStatus(deal.id, columns[colIndex - 1].id)} 
                                                            className="w-6 h-6 text-slate-500 hover:text-brand flex items-center justify-center font-bold text-lg" 
                                                            title="Move Back"
                                                        >
                                                            ←
                                                        </button>
                                                    )}
                                                    {colIndex < columns.length - 1 && (
                                                        <button 
                                                            onClick={() => updateDealStatus(deal.id, columns[colIndex + 1].id)} 
                                                            className="w-6 h-6 text-slate-500 hover:text-brand flex items-center justify-center font-bold text-lg" 
                                                            title="Move Next"
                                                        >
                                                            →
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </AuthGuard>
    );
}