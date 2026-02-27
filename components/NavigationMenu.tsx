"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavigationMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

const NAV_ITEMS = [
    {
        href: "/",
        label: "Přehled zaměstnanců",
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
            </svg>
        ),
    },
    {
        href: "/trainings",
        label: "Školení",
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a23.838 23.838 0 0 0-1.012 5.434c0 .043.007.085.01.127a23.95 23.95 0 0 0 5.502 1.397m-5.502-6.958a24.08 24.08 0 0 1 2.918-3.56M12 3.59a24.076 24.076 0 0 1 5.166 6.558m-10.332 0A23.953 23.953 0 0 1 12 8.59a23.953 23.953 0 0 1 5.166 1.558M12 3.59l-.004.014M12 3.59l.004.014M3.859 6.707a24.08 24.08 0 0 1 2.918-3.56" />
            </svg>
        ),
    },
    {
        href: "/medical",
        label: "Lékařské prohlídky",
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
            </svg>
        ),
    },
    {
        href: "/oopp",
        label: "OOPP",
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
            </svg>
        ),
    },
    {
        href: "/iluo",
        label: "ILUO",
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
            </svg>
        ),
    },
];

export default function NavigationMenu({ isOpen, onClose }: NavigationMenuProps) {
    const pathname = usePathname();

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Slide-in panel */}
            <nav
                className="fixed left-0 top-0 z-50 flex h-full w-72 flex-col bg-white shadow-2xl"
                style={{ animation: "slideIn 0.2s ease-out" }}
                id="navigation-menu"
            >
                {/* Nav header */}
                <div
                    className="flex items-center justify-between px-5 py-4"
                    style={{ backgroundColor: "#0054A6" }}
                >
                    <span className="text-base font-bold text-white">Navigace</span>
                    <button
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                        aria-label="Zavřít menu"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Nav items */}
                <div className="flex-1 overflow-y-auto px-3 py-4">
                    <ul className="space-y-1">
                        {NAV_ITEMS.map((item) => {
                            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                            return (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        onClick={onClose}
                                        className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${isActive
                                            ? "bg-[#0054A6] text-white shadow-lg shadow-blue-600/25"
                                            : "text-gray-700 hover:bg-blue-50 hover:text-[#0054A6]"
                                            }`}
                                        id={`nav-link-${item.href.replace("/", "") || "home"}`}
                                    >
                                        <span className={isActive ? "text-white" : "text-gray-400"}>
                                            {item.icon}
                                        </span>
                                        <div>
                                            <div>{item.label}</div>
                                        </div>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 px-5 py-4">
                    <p className="text-xs text-gray-400">ZF HR Portal v1.0</p>
                    <p className="text-xs text-gray-400">© 2025 ZF Group</p>
                </div>
            </nav>
        </>
    );
}
