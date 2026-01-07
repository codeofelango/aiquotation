"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";

export default function ResetPage() {
    const router = useRouter();
    const [step, setStep] = useState(1); // 1: Email, 2: Code & New Password
    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        await fetch("http://localhost:8000/auth/forgot-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email })
        });
        setLoading(false);
        setStep(2);
    };

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const res = await fetch("http://localhost:8000/auth/reset-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, code, new_password: newPassword })
        });
        if (res.ok) {
            alert("Password reset successful!");
            router.push("/login");
        } else {
            alert("Reset failed. Invalid code.");
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Navbar />
            <div className="flex-1 flex items-center justify-center px-6">
                <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100">
                    <h1 className="text-2xl font-bold text-slate-900 mb-6 text-center">Reset Password</h1>
                    
                    {step === 1 ? (
                        <form onSubmit={handleRequest} className="space-y-4">
                            <input placeholder="Email Address" type="email" className="input-field w-full" value={email} onChange={e=>setEmail(e.target.value)} required />
                            <button disabled={loading} className="btn-primary w-full py-3">{loading ? "Sending..." : "Send Reset Code"}</button>
                        </form>
                    ) : (
                        <form onSubmit={handleReset} className="space-y-4">
                            <input placeholder="Reset Code" className="input-field w-full" value={code} onChange={e=>setCode(e.target.value)} required />
                            <input placeholder="New Password" type="password" className="input-field w-full" value={newPassword} onChange={e=>setNewPassword(e.target.value)} required />
                            <button disabled={loading} className="btn-primary w-full py-3">{loading ? "Updating..." : "Set New Password"}</button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}