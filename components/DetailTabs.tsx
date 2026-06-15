"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { User, GraduationCap, HeartPulse, ShieldAlert, BarChart3 } from "lucide-react";

export default function DetailTabs() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const pn = searchParams.get("pn");

    if (!pn) return null;

    const tabs = [
        { id: "profile", label: "Profil", href: `/employee/profile?pn=${pn}`, icon: <User size={18} /> },
        { id: "trainings", label: "Školení", href: `/trainings/detail?pn=${pn}`, icon: <GraduationCap size={18} /> },
        { id: "medical", label: "Lékařské", href: `/medical/detail?pn=${pn}`, icon: <HeartPulse size={18} /> },
        { id: "oopp", label: "OOPP", href: `/oopp/detail?pn=${pn}`, icon: <ShieldAlert size={18} /> },
        { id: "iluo", label: "ILUO", href: `/iluo/detail?pn=${pn}`, icon: <BarChart3 size={18} /> },
    ];

    return (
        <div className="mb-6 border-b border-gray-200">
            <nav className="flex -mb-px space-x-8 overflow-x-auto no-scrollbar" aria-label="Tabs">
                {tabs.map((tab) => {
                    const isActive = pathname.includes(tab.id) || (tab.id === "profile" && pathname.includes("profile"));
                    // Note: This is a bit loose but works for our static structure
                    
                    return (
                        <Link
                            key={tab.id}
                            href={tab.href}
                            className={`
                                flex items-center gap-2 border-b-2 py-4 px-1 text-sm font-medium transition-colors whitespace-nowrap
                                ${isActive 
                                    ? "border-[#0054A6] text-[#0054A6]" 
                                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"}
                            `}
                        >
                            {tab.icon}
                            {tab.label}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
