"use client";

import { useAuth } from "@/lib/auth";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, ReactNode } from "react";

export default function AuthGuard({ children }: { children: ReactNode }) {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Clean pathname for comparison (remove trailing slash and .html extension)
        const cleanPathname = pathname.replace(/\/$/, "").replace(/\.html$/, "");
        const isLoginPage = cleanPathname === "/login" || pathname === "/login";

        if (!isLoading && !user && !isLoginPage) {
            router.push("/login");
        }
    }, [user, isLoading, pathname, router]);

    // Clean pathname for rendering check too
    const cleanPathname = pathname.replace(/\/$/, "").replace(/\.html$/, "");
    const isLoginPage = cleanPathname === "/login" || pathname === "/login";

    // Show nothing while checking session OR if redirecting (unless on login page)
    if (isLoading || (!user && !isLoginPage)) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#0054A6]/20 border-t-[#0054A6]"></div>
                    <p className="text-sm font-medium text-slate-500">Ověřování sezení...</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
