"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export function Navbar() {
    const router = useRouter();
    const pathname = usePathname();
    const [imgError, setImgError] = useState(false);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const storedUser = localStorage.getItem("user");
            if (storedUser) {
                try { setUser(JSON.parse(storedUser)); } 
                catch (e) { localStorage.removeItem("user"); }
            }
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        setUser(null);
        router.push("/login");
    };

    const isActive = (path: string) => pathname === path ? "text-brand font-bold" : "hover:text-brand transition-colors";

	return (
		<nav className="glass-nav flex items-center justify-between px-8 py-5 mb-0 bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200">
			<Link href="/" className="flex items-center gap-3 group">
                {!imgError ? (
                    <Image 
                        src="/logo.png" 
                        alt="Project Phoenix" 
                        width={160}
                        height={40}
                        className="h-10 w-auto object-contain transition-transform group-hover:scale-105"
                        onError={() => setImgError(true)}
                        priority
                    />
                ) : (
                    <span className="text-xl font-bold text-brand flex items-center gap-2">⚡ Project Phoenix</span>
                )}
			</Link>
			<div className="flex items-center gap-6 text-slate-600 font-medium text-sm">
                <Link href="/" className={isActive("/")}>Home</Link>
                <Link href="/opportunities" className={isActive("/opportunities")}>Pipeline</Link>
				<Link href="/quotation" className={isActive("/quotation")}>Quotations</Link>
				<Link href="/items" className={isActive("/items")}>Catalog</Link>
                <Link href="/visual-search" className={isActive("/visual-search")}>Visual Search</Link>

                {/* Updated Link */}
                <Link href="/docchat" className={isActive("/docchat")}>Docs Chat</Link>
				<Link href="/db-chat" className={`${isActive("/db-chat")} flex items-center gap-1`}>
                <span>Data Chat</span>
                <span className="bg-indigo-100 text-indigo-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold">NEW</span>
              </Link>
                <Link href="/activity" className={isActive("/activity")}>Activity</Link>
                
                <div className="h-4 w-px bg-slate-300"></div>
                
                {user ? (
                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center text-xs font-bold shadow-md">
                            {user.name?.substring(0, 2).toUpperCase()}
                        </div>
                        <button onClick={handleLogout} className="text-xs text-red-500 hover:text-red-700 font-bold">Logout</button>
                    </div>
                ) : (
                    <Link href="/login" className="bg-brand text-white px-5 py-2 rounded-lg font-bold shadow-md shadow-brand/20 hover:bg-brand-dark transition-all">Login</Link>
                )}
			</div>
		</nav>
	);
}