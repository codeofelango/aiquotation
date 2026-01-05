"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { AuthGuard } from "@/components/AuthGuard";
import { getOpportunities, addOpportunity, updateOpportunity, searchOpportunities } from "@/lib/api";
import { LoadingSpinner } from "@/components/LoadingSpinner";

// --- Icons & Charts ---
const ChartIcon = () => <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>;

const SimpleBarChart = ({ data }: { data: { label: string, value: number, color: string }[] }) => {
    // Determine max value for scaling, ensuring it's at least 1 to avoid division by zero
    const maxVal = Math.max(...data.map(d => d.value), 1);
    
    return (
        <div className="flex items-end gap-3 h-32 w-full pt-6">
            {data.map((item, i) => {
                // Calculate height percentage, with a minimum of 5% so 0-value bars are slightly visible or just flat
                const heightPct = item.value === 0 ? 2 : (item.value / maxVal) * 100;
                
                return (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end gap-2 group relative h-full">
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            <div className="bg-slate-800 text-white text-[10px] font-bold py-1 px-2 rounded shadow-lg whitespace-nowrap">
                                {item.value} Deals
                            </div>
                            <div className="w-2 h-2 bg-slate-800 rotate-45 mx-auto -mt-1"></div>
                        </div>

                        {/* Bar */}
                        <div 
                            className="w-full rounded-t-md transition-all duration-700 ease-out hover:opacity-80 relative"
                            style={{ 
                                height: `${heightPct}%`, 
                                backgroundColor: item.color 
                            }}
                        >
                            {/* Value Label inside/above bar */}
                            {item.value > 0 && (
                                <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-500">
                                    {item.value}
                                </span>
                            )}
                        </div>

                        {/* Label */}
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider text-center h-8 flex items-start justify-center leading-tight w-full">
                            {item.label}
                        </span>
                    </div>
                );
            })}
        </div>
    );
};

export default function OpportunitiesPage() {
    const [opportunities, setOpportunities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    // Metrics State
    const [metrics, setMetrics] = useState({
        totalValue: 0,
        activeDeals: 0,
        upcomingRFPs: 0,
        statusDist: [] as any[]
    });

    // Form State
    const [formData, setFormData] = useState({
        id: null,
        client_name: "",
        project_name: "",
        expected_rfp_date: "",
        estimated_value: 0,
        notes: "",
        status: "New"
    });

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const data = await getOpportunities();
            // Ensure data is array
            const safeData = Array.isArray(data) ? data : [];
            setOpportunities(safeData);
            calculateMetrics(safeData);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    function calculateMetrics(data: any[]) {
        const now = new Date();
        const thirtyDaysLater = new Date();
        thirtyDaysLater.setDate(now.getDate() + 30);

        const totalVal = data.reduce((acc, op) => acc + (Number(op.estimated_value) || 0), 0);
        const active = data.filter(op => op.status !== 'Closed').length;
        
        const upcoming = data.filter(op => {
            if (!op.expected_rfp_date) return false;
            const rfpDate = new Date(op.expected_rfp_date);
            return rfpDate >= now && rfpDate <= thirtyDaysLater;
        }).length;

        // Status Distribution
        // Explicitly define statuses to ensure consistent chart order
        const statuses = ['New', 'RFP Expected', 'RFQ Received', 'Closed'];
        const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#94a3b8']; // blue, purple, emerald, slate
        
        const dist = statuses.map((status, i) => {
            const count = data.filter(op => op.status === status).length;
            return {
                label: status, 
                value: count,
                color: colors[i]
            };
        });

        setMetrics({
            totalValue: totalVal,
            activeDeals: active,
            upcomingRFPs: upcoming,
            statusDist: dist
        });
    }

    async function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setCurrentPage(1); 
        try {
            if (search.trim()) {
                const results = await searchOpportunities(search);
                setOpportunities(results);
                calculateMetrics(results);
            } else {
                await loadData();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    const handleEdit = (op: any) => {
        setFormData({
            id: op.id,
            client_name: op.client_name,
            project_name: op.project_name,
            expected_rfp_date: op.expected_rfp_date || "",
            estimated_value: op.estimated_value,
            notes: op.notes || "",
            status: op.status
        });
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        try {
            if (formData.id) {
                await updateOpportunity(formData.id, formData);
            } else {
                await addOpportunity(formData); 
            }
            setShowForm(false);
            setFormData({ id: null, client_name: "", project_name: "", expected_rfp_date: "", estimated_value: 0, notes: "", status: "New" });
            await loadData();
        } catch (e) {
            alert("Failed to save opportunity");
            console.error(e);
        } finally {
            setSaving(false);
        }
    }

    const getStatusColor = (status: string) => {
        switch(status) {
            case 'New': return 'bg-blue-50 text-blue-700 border-blue-100';
            case 'RFP Expected': return 'bg-purple-50 text-purple-700 border-purple-100';
            case 'RFQ Received': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'Closed': return 'bg-slate-100 text-slate-600 border-slate-200';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    // Pagination Logic
    const totalPages = Math.ceil(opportunities.length / itemsPerPage);
    const paginatedOpportunities = opportunities.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) setCurrentPage(page);
    };

    return (
        <AuthGuard>
            <div className="min-h-screen bg-slate-50">
                <Navbar />
                <div className="max-w-7xl mx-auto px-6 py-10">
                    
                    <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
                        <div>
                            <h1 className="text-4xl font-bold text-slate-900 mb-2">Sales Pipeline</h1>
                            <p className="text-slate-500">Track and manage upcoming project opportunities.</p>
                        </div>
                        <button 
                            onClick={() => {
                                const nextState = !showForm;
                                setShowForm(nextState);
                                if (!nextState) setFormData({ id: null, client_name: "", project_name: "", expected_rfp_date: "", estimated_value: 0, notes: "", status: "New" });
                            }}
                            className="bg-brand text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-brand/20 hover:bg-brand-dark transition-all flex items-center gap-2"
                        >
                            <span>{showForm ? '✕ Cancel' : '+ Register Opportunity'}</span>
                        </button>
                    </div>

                    {/* --- Executive Summary Dashboard --- */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        {/* Metric 1: Pipeline Value */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
                            <div>
                                <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Total Pipeline Value</h3>
                                <div className="text-3xl font-bold text-slate-900">${(metrics.totalValue / 1000).toLocaleString()}k</div>
                            </div>
                            <div className="mt-4 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded w-fit">
                                ▲ Active Revenue Potential
                            </div>
                        </div>

                        {/* Metric 2: Upcoming Actions */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Upcoming RFPs</h3>
                                    <div className="text-3xl font-bold text-brand">{metrics.upcomingRFPs}</div>
                                </div>
                                <div className="text-right">
                                    <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Active Deals</h3>
                                    <div className="text-2xl font-bold text-slate-700">{metrics.activeDeals}</div>
                                </div>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
                                <div className="bg-brand h-1.5 rounded-full" style={{ width: `${metrics.activeDeals > 0 ? (metrics.upcomingRFPs / metrics.activeDeals) * 100 : 0}%` }}></div>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-2 text-right">Due in next 30 days</p>
                        </div>

                        {/* Metric 3: Visual Status Distribution */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
                            <div className="flex justify-between items-center mb-1">
                                <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                                    <ChartIcon /> Deal Stage
                                </h3>
                            </div>
                            <div className="flex-1 flex items-end w-full">
                                <SimpleBarChart data={metrics.statusDist} />
                            </div>
                        </div>
                    </div>

                    {/* Registration/Edit Form */}
                    {showForm && (
                        <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200 mb-8 animate-fade-in ring-4 ring-brand/5">
                            <h2 className="text-xl font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">{formData.id ? 'Edit Opportunity' : 'New Opportunity Details'}</h2>
                            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Client Name</label>
                                    <input required className="input-field w-full" placeholder="e.g. Marriott Hotels" value={formData.client_name} onChange={e => setFormData({...formData, client_name: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Project Name</label>
                                    <input required className="input-field w-full" placeholder="e.g. Riyadh Renovation" value={formData.project_name} onChange={e => setFormData({...formData, project_name: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Est. Value ($)</label>
                                    <input type="number" className="input-field w-full" value={formData.estimated_value} onChange={e => setFormData({...formData, estimated_value: parseFloat(e.target.value)})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Expected RFP Date</label>
                                    <input type="date" className="input-field w-full" value={formData.expected_rfp_date} onChange={e => setFormData({...formData, expected_rfp_date: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status</label>
                                    <select className="input-field w-full" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                                        <option>New</option>
                                        <option>RFP Expected</option>
                                        <option>RFQ Received</option>
                                        <option>Closed</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Notes / Description</label>
                                    <textarea className="input-field w-full" rows={3} placeholder="Add key details..." value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
                                </div>
                                <div className="md:col-span-2 flex justify-end gap-3 pt-4 border-t border-slate-50">
                                    <button type="button" onClick={() => setShowForm(false)} className="text-slate-500 font-bold px-6 py-3 hover:bg-slate-50 rounded-xl transition-colors">Cancel</button>
                                    <button type="submit" disabled={saving} className="bg-brand text-white px-8 py-3 rounded-xl font-bold hover:bg-brand-dark disabled:opacity-50 shadow-md shadow-brand/20 transition-all">
                                        {saving ? 'Saving...' : (formData.id ? 'Update Opportunity' : 'Create Opportunity')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Search & List */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50/30">
                            <div className="flex items-center gap-4">
                                <h3 className="font-bold text-lg text-slate-700">Detailed List</h3>
                                <span className="text-xs font-medium text-slate-400 bg-white border border-slate-200 px-2 py-1 rounded-full">{opportunities.length} Records</span>
                            </div>
                            <form onSubmit={handleSearch} className="relative w-full md:w-80">
                                <input 
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all"
                                    placeholder="Search client, project..."
                                    value={search}
                                    onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                                />
                                <span className="absolute left-3 top-2.5 text-slate-400">🔍</span>
                            </form>
                        </div>

                        {loading ? (
                            <div className="p-20 flex justify-center"><LoadingSpinner /></div>
                        ) : (
                            <>
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                                        <tr>
                                            <th className="px-6 py-4">Client</th>
                                            <th className="px-6 py-4">Project</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4">Est. Value</th>
                                            <th className="px-6 py-4">RFP Date</th>
                                            <th className="px-6 py-4 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {paginatedOpportunities.map((op) => (
                                            <tr key={op.id} className="hover:bg-slate-50 transition-colors group">
                                                <td className="px-6 py-4 font-bold text-slate-800">{op.client_name}</td>
                                                <td className="px-6 py-4">
                                                    <div className="text-slate-900 font-medium">{op.project_name}</div>
                                                    <div className="text-xs text-slate-500 truncate max-w-[200px] mt-1">{op.notes}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${getStatusColor(op.status)}`}>
                                                        {op.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 font-mono font-medium text-slate-700">
                                                    ${(op.estimated_value || 0).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-500">
                                                    {op.expected_rfp_date ? new Date(op.expected_rfp_date).toLocaleDateString() : <span className="text-slate-300 italic">TBD</span>}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button 
                                                        onClick={() => handleEdit(op)}
                                                        className="text-xs font-bold text-brand hover:text-brand-dark bg-brand/5 hover:bg-brand/10 px-3 py-1.5 rounded transition-colors"
                                                    >
                                                        Edit
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                
                                {/* Pagination Controls */}
                                {totalPages > 1 && (
                                    <div className="px-8 py-4 border-t border-slate-100 flex justify-between items-center bg-slate-50/30">
                                        <button 
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            className="text-sm text-slate-500 hover:text-brand disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                        >
                                            ← Previous
                                        </button>
                                        <div className="flex gap-1">
                                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                let p = i + 1;
                                                if (totalPages > 5 && currentPage > 3) p = currentPage - 2 + i;
                                                if (p > totalPages) return null;
                                                
                                                return (
                                                    <button 
                                                        key={p}
                                                        onClick={() => handlePageChange(p)}
                                                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold transition-colors ${currentPage === p ? 'bg-brand text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                                                    >
                                                        {p}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <button 
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                            className="text-sm text-slate-500 hover:text-brand disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                        >
                                            Next →
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </AuthGuard>
    );
}