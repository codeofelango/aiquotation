"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";

export default function RegisterPage() {
    const router = useRouter();
    const [step, setStep] = useState(1); // 1: Register, 2: Verify
    const [form, setForm] = useState({ name: "", email: "", password: "" });
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false); // New state for resend
    const [error, setError] = useState("");

    // Password Validation State
    const [pwdValid, setPwdValid] = useState({
        length: false,
        number: false,
        symbol: false
    });

    useEffect(() => {
        setPwdValid({
            length: form.password.length >= 8,
            number: /\d/.test(form.password),
            symbol: /[!@#$%^&*(),.?":{}|<>]/.test(form.password)
        });
    }, [form.password]);

    const isPasswordReady = Object.values(pwdValid).every(Boolean);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isPasswordReady) {
            setError("Please meet all password requirements.");
            return;
        }
        
        setLoading(true);
        setError("");
        
        try {
            const res = await fetch("http://localhost:8000/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form)
            });
            if (!res.ok) throw new Error((await res.json()).detail);
            setStep(2);
        } catch (e: any) { setError(e.message); }
        finally { setLoading(false); }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch("http://localhost:8000/auth/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: form.email, code })
            });
            if (!res.ok) throw new Error((await res.json()).detail);
            alert("Verified! Please login.");
            router.push("/login");
        } catch (e: any) { setError(e.message); }
        finally { setLoading(false); }
    };

    const handleResend = async () => {
        setResending(true);
        try {
            const res = await fetch("http://localhost:8000/auth/resend-code", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: form.email })
            });
            if (res.ok) {
                alert(`New code sent to ${form.email}`);
            } else {
                alert("Failed to resend code.");
            }
        } catch (e) {
            alert("Error resending code.");
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Navbar />
            <div className="flex-1 flex items-center justify-center px-6 py-12">
                <div className="bg-white p-8 md:p-10 rounded-3xl shadow-xl w-full max-w-lg border border-slate-100 transition-all">
                    
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">
                            {step === 1 ? "Create Account" : "Verify Email"}
                        </h1>
                        <p className="text-slate-500">
                            {step === 1 ? "Join Project Phoenix today." : `Code sent to ${form.email}`}
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 flex items-center gap-3 animate-pulse">
                            ⚠️ {error}
                        </div>
                    )}

                    {step === 1 ? (
                        <form onSubmit={handleRegister} className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Full Name</label>
                                <input 
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand focus:border-brand outline-none transition-all bg-slate-50 focus:bg-white" 
                                    value={form.name} 
                                    onChange={e=>setForm({...form, name: e.target.value})} 
                                    placeholder="John Doe"
                                    required 
                                />
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Email Address</label>
                                <input 
                                    type="email" 
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand focus:border-brand outline-none transition-all bg-slate-50 focus:bg-white" 
                                    value={form.email} 
                                    onChange={e=>setForm({...form, email: e.target.value})} 
                                    placeholder="name@company.com"
                                    required 
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Password</label>
                                <input 
                                    type="password" 
                                    maxLength={50}
                                    className={`w-full px-4 py-3 rounded-xl border focus:ring-2 outline-none transition-all bg-slate-50 focus:bg-white ${
                                        form.password && !isPasswordReady ? 'border-red-200 focus:border-red-400 focus:ring-red-400' : 'border-slate-200 focus:border-brand focus:ring-brand'
                                    }`}
                                    value={form.password} 
                                    onChange={e=>setForm({...form, password: e.target.value})} 
                                    placeholder="••••••••"
                                    required 
                                />
                                
                                <div className="mt-3 grid grid-cols-3 gap-2">
                                    <div className={`h-1 rounded-full transition-colors duration-300 ${pwdValid.length ? 'bg-green-500' : 'bg-slate-200'}`}></div>
                                    <div className={`h-1 rounded-full transition-colors duration-300 ${pwdValid.number ? 'bg-green-500' : 'bg-slate-200'}`}></div>
                                    <div className={`h-1 rounded-full transition-colors duration-300 ${pwdValid.symbol ? 'bg-green-500' : 'bg-slate-200'}`}></div>
                                </div>
                                <div className="mt-2 text-xs flex gap-4 text-slate-400">
                                    <span className={pwdValid.length ? "text-green-600 font-bold" : ""}>8+ Chars</span>
                                    <span className={pwdValid.number ? "text-green-600 font-bold" : ""}>Number</span>
                                    <span className={pwdValid.symbol ? "text-green-600 font-bold" : ""}>Symbol</span>
                                </div>
                            </div>

                            <button 
                                disabled={loading} 
                                className={`w-full py-4 rounded-xl font-bold text-white shadow-lg shadow-brand/20 transition-all transform hover:scale-[1.02] active:scale-95
                                    ${loading ? 'bg-slate-400' : 'bg-brand hover:bg-brand-dark'}
                                `}
                            >
                                {loading ? "Creating Account..." : "Sign Up"}
                            </button>
                            
                            <p className="text-center text-sm text-slate-500 mt-6">
                                Already have an account? <Link href="/login" className="text-brand font-bold hover:underline">Login here</Link>
                            </p>
                        </form>
                    ) : (
                        <form onSubmit={handleVerify} className="space-y-6 animate-fade-in">
                            <div className="bg-blue-50 p-4 rounded-xl text-sm text-blue-700 mb-4 border border-blue-100 text-center">
                                Check your inbox. Not there? <br/>
                                <button 
                                    type="button" 
                                    onClick={handleResend} 
                                    disabled={resending} 
                                    className="text-brand font-bold underline mt-1 hover:text-brand-dark disabled:opacity-50"
                                >
                                    {resending ? "Resending..." : "Send Again"}
                                </button>
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Verification Code</label>
                                <input 
                                    className="w-full px-4 py-4 text-center text-3xl font-mono tracking-[0.5em] rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand focus:border-brand outline-none transition-all" 
                                    value={code} 
                                    onChange={e=>setCode(e.target.value)} 
                                    maxLength={6}
                                    placeholder="000000"
                                    required 
                                />
                            </div>
                            
                            <button 
                                disabled={loading} 
                                className="w-full py-4 rounded-xl font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-lg transition-all transform hover:scale-[1.02]"
                            >
                                {loading ? "Verifying..." : "Verify & Login"}
                            </button>
                            
                            <button 
                                type="button" 
                                onClick={() => setStep(1)} 
                                className="w-full text-center text-sm text-slate-400 hover:text-slate-600"
                            >
                                ← Back to Registration
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}