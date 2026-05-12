"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { AuthGuard } from "@/components/AuthGuard";
import { LoadingSpinner } from "@/components/LoadingSpinner";

// Types matching DB
type Lead = {
    id: number;
    title: string;
    company_name: string;
    source: string;
    status: string;
    estimated_value: number;
    created_at: string;
};

export default function LeadsPage() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("All");

    useEffect(() => {
        fetchLeads();
    }, []);

    const fetchLeads = async () => {
        try {
            const res = await fetch('http://localhost:8000/api/crm/leads');
            if (res.ok) {
                const data = await res.json();
                setLeads(data);
            }
        } catch (error) {
            console.error("Error fetching leads:", error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch(status) {
            case "New": return "bg-blue-100 text-blue-700";
            case "Qualified": return "bg-green-100 text-green-700";
            case "Contacted": return "bg-purple-100 text-purple-700";
            case "Disqualified": return "bg-red-100 text-red-700";
            case "Converted": return "bg-indigo-100 text-indigo-700";
            default: return "bg-gray-100 text-gray-700";
        }
    };

    const filteredLeads = filter === "All" ? leads : leads.filter(l => l.status === filter);

    if (loading) return <LoadingSpinner />;

    return (
        <AuthGuard>
            <div className="min-h-screen bg-slate-50">
                <Navbar />
                <div className="max-w-7xl mx-auto px-6 py-10">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">Lead Management</h1>
                            <p className="text-slate-500">Acquire, track, and qualify incoming business potential.</p>
                        </div>
                        <button className="bg-brand text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-brand-dark transition-all">
                            + Add New Lead
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                        {["New", "Qualified", "Contacted", "Converted"].map(status => (
                            <div key={status} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                <div className="text-xs text-slate-500 uppercase font-bold">{status} Leads</div>
                                <div className="text-2xl font-bold text-slate-800 mt-1">
                                    {leads.filter(l => l.status === status).length}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Filters & List */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-4 border-b border-slate-100 flex gap-4">
                            {["All", "New", "Qualified", "Contacted", "Disqualified"].map(f => (
                                <button 
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>

                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                                <tr>
                                    <th className="px-6 py-4">Lead Details</th>
                                    <th className="px-6 py-4">Source</th>
                                    <th className="px-6 py-4">Est. Value</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredLeads.map((lead) => (
                                    <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-800">{lead.title}</div>
                                            <div className="text-sm text-slate-500">{lead.company_name}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{lead.source}</td>
                                        <td className="px-6 py-4 font-mono text-sm font-medium text-slate-700">
                                            ${Number(lead.estimated_value).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${getStatusColor(lead.status)}`}>
                                                {lead.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-brand font-bold text-xs hover:underline">
                                                View →
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {filteredLeads.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-10 text-center text-slate-400">No leads found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AuthGuard>
    );
}