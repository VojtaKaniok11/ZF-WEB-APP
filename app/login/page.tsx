"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
    const [personalNumber, setPersonalNumber] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        const result = await login(personalNumber, password);

        if (result.success) {
            router.push("/");
        } else {
            setError(result.message || "Neplatné přihlašovací údaje.");
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-slate-50 p-4 sm:p-6 lg:p-8">
            <div className="w-full max-w-md">
                <div className="relative overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-200">
                    {/* Header with ZF style */}
                    <div className="bg-[#0054A6] px-8 py-10 text-center text-white">
                        <div className="mb-4 flex justify-center">
                            <div className="rounded-full bg-white/20 p-4 backdrop-blur-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-8">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                                </svg>
                            </div>
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight">Vítejte v HR Portálu</h1>
                        <p className="mt-2 text-sm text-blue-100">Přihlaste se ke svému účtu</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8">
                        {error && (
                            <div className="mb-6 flex items-center gap-3 rounded-lg bg-red-50 p-4 text-sm font-medium text-red-600 ring-1 ring-red-100">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5 shrink-0">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                                </svg>
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="space-y-5">
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">Osobní číslo</label>
                                <div className="relative">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                                        </svg>
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        value={personalNumber}
                                        onChange={(e) => setPersonalNumber(e.target.value)}
                                        className="block w-full rounded-xl border-0 py-3 pl-11 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-[#0054A6] sm:text-sm"
                                        placeholder="Např. 80001234"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">Heslo</label>
                                <div className="relative">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                                        </svg>
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="block w-full rounded-xl border-0 py-3 pl-11 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-[#0054A6] sm:text-sm"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="flex w-full items-center justify-center rounded-xl bg-[#0054A6] px-4 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-[#004285] active:scale-[0.98] disabled:opacity-50"
                            >
                                {loading ? (
                                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                                ) : (
                                    "Přihlásit se"
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="border-t border-slate-100 bg-slate-50/50 p-6 text-center">
                        <Link href="/" className="text-sm font-medium text-slate-500 hover:text-[#0054A6]">
                            Zpět na hlavní stránku
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
