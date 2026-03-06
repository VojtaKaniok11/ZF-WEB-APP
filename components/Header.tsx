"use client";

import { useState } from "react";
import Link from "next/link";
import NavigationMenu from "./NavigationMenu";

export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    return (
        <>
            <header
                className="sticky top-0 z-40 flex items-center justify-between px-4 py-5 sm:px-6"
                style={{ backgroundColor: "#0054A6" }}
            >
                {/* Left — Hamburger */}
                <button
                    onClick={() => setIsMenuOpen((prev) => !prev)}
                    className="flex h-12 w-12 items-center justify-center rounded-lg text-white transition-colors hover:bg-white/10 active:bg-white/20"
                    aria-label="Otevřít menu"
                    id="hamburger-menu-btn"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="size-7"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                        />
                    </svg>
                </button>

                {/* Center — Title */}
                <Link
                    href="/"
                    className="absolute left-1/2 -translate-x-1/2 text-lg font-bold tracking-wide text-white sm:text-2xl"
                    id="header-title"
                >
                    ZF HR Portal
                </Link>

                {/* Right — Login button */}
                <button
                    onClick={() => setIsLoggedIn((prev) => !prev)}
                    className="flex items-center gap-2 rounded-lg border border-white/30 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-white/10 active:bg-white/20"
                    id="login-btn"
                >
                    {isLoggedIn ? (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                            </svg>
                            Odhlásit
                        </>
                    ) : (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                            </svg>
                            Přihlásit
                        </>
                    )}
                </button>
            </header>

            {/* Navigation overlay */}
            <NavigationMenu
                isOpen={isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
            />
        </>
    );
}
