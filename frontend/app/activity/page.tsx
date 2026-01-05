"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { AuthGuard } from "@/components/AuthGuard";
import { getActivity } from "@/lib/api";
import { LoadingSpinner } from "@/components/LoadingSpinner";

export default function ActivityPage() {
    const [activities, setActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const data = await getActivity();
            setActivities(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    async function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        try {
            const results = await getActivity(search);
            setActivities(results);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    return (
        <AuthGuard>
            <div className="min-h-screen bg-slate-50">
                <Navbar />
                <div className="max-w-7xl mx-auto px-6 py-10">
                    
                    <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
                        <div>
                            <h1 className="text-4xl font-bold text-slate-900 mb-2">System Activity</h1>
                            <p className="text-slate-500">Track user actions and system events.</p>
                        </div>
                        
                        <form onSubmit={handleSearch} className="relative w-full md:w-80">
                            <input 
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                                placeholder="Search activity..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                            <span className="absolute left-3 top-2.5 text-slate-400">🔍</span>
                        </form>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        {loading ? (
                            <div className="p-20 flex justify-center"><LoadingSpinner /></div>
                        ) : (
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                                    <tr>
                                        <th className="px-6 py-4">User</th>
                                        <th className="px-6 py-4">Action</th>
                                        <th className="px-6 py-4">Entity</th>
                                        <th className="px-6 py-4">Details</th>
                                        <th className="px-6 py-4 text-right">Time</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {activities.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                                No activity found.
                                            </td>
                                        </tr>
                                    ) : (
                                        activities.map((act) => (
                                            <tr key={act.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-slate-800 text-sm">{act.user_email || "System"}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold border border-blue-100">
                                                        {act.action}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-600">
                                                    {act.entity_type} #{act.entity_id}
                                                </td>
                                                <td className="px-6 py-4 text-xs text-slate-500 font-mono max-w-xs truncate">
                                                    {act.details}
                                                </td>
                                                <td className="px-6 py-4 text-right text-xs text-slate-400">
                                                    {new Date(act.timestamp).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>

                </div>
            </div>
        </AuthGuard>
    );
}