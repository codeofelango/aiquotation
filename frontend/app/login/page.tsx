"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { login } from "@/lib/auth";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            await login(email, password);
            router.push("/quotation");
            
        } catch (err: any) {
            setError(err.message);
            if (err.message.includes("verified")) {
                setTimeout(() => {
                    router.push(`/verify?email=${encodeURIComponent(email)}`);
                }, 2000);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Navbar />
            <div className="flex-1 flex items-center justify-center px-6">
                <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-brand/10 text-brand rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
                            🔐
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900">Welcome Back</h1>
                        <p className="text-slate-500 text-sm">Sign in to access Project Phoenix</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center gap-2">
                            ⚠️ {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Email Address</label>
                            <input 
                                type="email" 
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand focus:border-brand outline-none transition-all"
                                placeholder="name@company.com"
                            />
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-sm font-semibold text-slate-700">Password</label>
                                {/* FIXED: Changed class to className */}
                                <Link href="/reset-password" className="text-xs text-brand hover:underline font-medium">
                                    Forgot Password?
                                </Link>
                            </div>
                            <input 
                                type="password" 
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand focus:border-brand outline-none transition-all"
                                placeholder="••••••••"
                            />
                        </div>
                        
                        <button 
                            type="submit" 
                            disabled={loading}
                            className={`w-full py-3 rounded-xl font-bold text-white shadow-lg shadow-brand/20 transition-all
                                ${loading ? 'bg-slate-400 cursor-wait' : 'bg-brand hover:bg-brand-dark hover:scale-[1.02]'}
                            `}
                        >
                            {loading ? "Signing in..." : "Sign In"}
                        </button>
                    </form>
                    
                    <div className="mt-8 pt-6 border-t border-slate-100 text-center text-sm text-slate-500">
                        Don't have an account? <Link href="/register" className="text-brand font-bold hover:underline">Create one</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}