"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";

function VerifyForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    // Auto-fill email if passed via URL (?email=...)
    const [email, setEmail] = useState(searchParams.get("email") || "");
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccessMsg("");
        
        try {
            const res = await fetch("http://localhost:8000/auth/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, code })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || "Verification failed");
            }

            alert("Account verified successfully! You can now login.");
            router.push("/login");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (!email) {
            setError("Please enter your email address first.");
            return;
        }
        setResending(true);
        setError("");
        setSuccessMsg("");

        try {
            const res = await fetch("http://localhost:8000/auth/resend-code", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            });
            
            if (res.ok) {
                setSuccessMsg(`New code sent to ${email}`);
            } else {
                const data = await res.json();
                throw new Error(data.message || "Failed to resend");
            }
        } catch (e: any) {
            setError(e.message || "Error resending code");
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100">
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
                    ✓
                </div>
                <h1 className="text-2xl font-bold text-slate-900">Verify Account</h1>
                <p className="text-slate-500 text-sm">Enter the code sent to your email.</p>
            </div>

            {error && (
                <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center gap-2">
                    ⚠️ {error}
                </div>
            )}
            
            {successMsg && (
                <div className="mb-6 p-3 bg-green-50 text-green-600 text-sm rounded-lg border border-green-100 flex items-center gap-2">
                    ✅ {successMsg}
                </div>
            )}

            <form onSubmit={handleVerify} className="space-y-4">
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Email Address</label>
                    <input 
                        type="email" 
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand focus:border-brand outline-none"
                        placeholder="name@company.com"
                    />
                </div>
                
                {/* Resend Option */}
                <div className="bg-blue-50 p-3 rounded-lg text-xs text-blue-700 border border-blue-100 flex justify-between items-center">
                    <span>Missing code?</span>
                    <button 
                        type="button"
                        onClick={handleResend}
                        disabled={resending || !email}
                        className="text-brand font-bold underline hover:text-brand-dark disabled:opacity-50 disabled:no-underline disabled:text-slate-400"
                    >
                        {resending ? "Sending..." : "Send Again"}
                    </button>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Verification Code</label>
                    <input 
                        type="text" 
                        required
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand focus:border-brand outline-none tracking-widest text-center text-lg font-mono"
                        placeholder="123456"
                        maxLength={6}
                    />
                </div>
                
                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full py-3 rounded-xl font-bold text-white shadow-lg shadow-green-500/20 bg-green-600 hover:bg-green-700 transition-all disabled:opacity-70"
                >
                    {loading ? "Verifying..." : "Confirm Code"}
                </button>
            </form>
        </div>
    );
}

export default function VerifyPage() {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Navbar />
            <div className="flex-1 flex items-center justify-center px-6">
                <Suspense fallback={<div>Loading...</div>}>
                    <VerifyForm />
                </Suspense>
            </div>
        </div>
    );
}