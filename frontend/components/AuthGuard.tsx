"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { LoadingSpinner } from "./LoadingSpinner";

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        // Check if user is logged in
        if (!isAuthenticated()) {
            // Redirect to login if not
            router.push("/login");
        } else {
            setAuthorized(true);
        }
    }, [router]);

    // Show loading or nothing while checking auth status
    if (!authorized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-3">
                    <LoadingSpinner size="lg" />
                    <p className="text-slate-500 text-sm font-medium">Verifying access...</p>
                </div>
            </div>
        );
    }

    // Render protected content only if authorized
    return <>{children}</>;
}