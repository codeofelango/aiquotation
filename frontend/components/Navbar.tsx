"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export function Navbar() {
    const router = useRouter();
    const pathname = usePathname();
    const [imgError, setImgError] = useState(false);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
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
                    <img 
                        src="https://mefma.org/wp-content/uploads/2024/03/Al-Mahmal-180x180.jpg" 
                        alt="Project Phoenix Logo" 
                        className="h-10 w-auto object-contain transition-transform group-hover:scale-105"
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <span className="text-xl font-bold text-brand flex items-center gap-2">
                        ⚡ Project Phoenix
                    </span>
                )}
			</Link>
			<div className="flex items-center gap-8 text-slate-600 font-medium text-sm">
                <Link href="/" className={isActive("/")}>
					Home
				</Link>
                <Link href="/opportunities" className={isActive("/opportunities")}>
					Pipeline
				</Link>
				<Link href="/quotation" className={isActive("/quotation")}>
					Quotations
				</Link>
				<Link href="/items" className={isActive("/items")}>
					Catalog
				</Link>
                {/* New Activity Tab */}
                <Link href="/activity" className={isActive("/activity")}>
					Activity
				</Link>
                
                <div className="h-4 w-px bg-slate-300"></div>
                
                {user ? (
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 cursor-pointer hover:opacity-80">
                            <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center text-xs font-bold shadow-md">
                                {user.name.substring(0, 2).toUpperCase()}
                            </div>
                            <span className="text-xs font-bold text-slate-700 hidden md:block">{user.name}</span>
                        </div>
                        <button 
                            onClick={handleLogout}
                            className="text-xs text-red-500 hover:text-red-700 font-bold"
                        >
                            Logout
                        </button>
                    </div>
                ) : (
                    <Link 
                        href="/login" 
                        className="bg-brand text-white px-5 py-2 rounded-lg font-bold shadow-md shadow-brand/20 hover:bg-brand-dark transition-all"
                    >
                        Login
                    </Link>
                )}
			</div>
		</nav>
	);
}