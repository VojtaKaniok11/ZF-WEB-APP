"use client";

import { useEffect, useState } from "react";
import { Search, ChevronRight, BarChart3, Users, Loader2 } from "lucide-react";
import Link from "next/link";
import { getApiUrl } from "@/lib/constants";

interface IluoEmployee {
    id: number;
    personalNumber: string;
    firstName: string;
    lastName: string;
    department: string;
    skillCount: number;
    expertLevelCount: number; // Level 'O'
}

export default function IluoPage() {
    const [employees, setEmployees] = useState<IluoEmployee[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        const apiUrl = getApiUrl();
        fetch(`${apiUrl}/iluo/summary`)
            .then(res => res.json())
            .then(json => {
                if (json.success) setEmployees(json.data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const filtered = employees.filter(e => 
        e.firstName.toLowerCase().includes(search.toLowerCase()) ||
        e.lastName.toLowerCase().includes(search.toLowerCase()) ||
        e.personalNumber.includes(search) ||
        e.department.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center">
                <Loader2 size={32} className="animate-spin text-blue-500 mb-4" />
                <p className="text-sm text-gray-400 font-medium">Načítám matici dovedností...</p>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-8 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-white shadow-lg shadow-violet-600/25">
                    <BarChart3 size={20} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">ILUO – Matice dovedností</h1>
                    <p className="text-sm text-gray-500">Hodnocení dovedností zaměstnanců: I → L → U → O.</p>
                </div>
            </div>

            {/* Search */}
            <div className="mb-6 overflow-hidden rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Hledat zaměstnance..."
                        className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                </div>
            </div>

            {/* Stats */}
            <div className="mb-4 flex items-center justify-between">
                <span className="inline-flex items-center rounded-lg bg-violet-50 px-3 py-1.5 text-sm font-medium text-violet-700 ring-1 ring-inset ring-violet-700/10">
                    Nalezeno: {filtered.length} zaměstnanců
                </span>
            </div>

            {/* List */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Users size={40} className="text-gray-200 mb-4" />
                        <p className="text-sm text-gray-400 mb-6">Žádní zaměstnanci k zobrazení.</p>
                        <button
                            onClick={async () => {
                                const apiUrl = getApiUrl();
                                await fetch(`${apiUrl}/iluo/seed`, { method: "POST" });
                                window.location.reload();
                            }}
                            className="rounded-lg border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-medium text-violet-700 hover:bg-violet-100 transition-colors cursor-pointer"
                        >
                            Vložit ukázkové dovednosti
                        </button>
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                <th className="px-6 py-4">Zaměstnanec</th>
                                <th className="px-6 py-4">Oddělení</th>
                                <th className="px-6 py-4 text-center">Počet dovedností</th>
                                <th className="px-6 py-4 text-center">Expertní (O)</th>
                                <th className="px-6 py-4 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filtered.map((emp) => (
                                <tr key={emp.id} className="group transition-colors hover:bg-violet-50/30">
                                    <td className="px-6 py-4">
                                        <Link href={`/iluo/detail?pn=${emp.personalNumber}`} className="flex items-center gap-3">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">
                                                {emp.lastName.charAt(0)}{emp.firstName.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="text-sm font-semibold text-gray-900">{emp.lastName} {emp.firstName}</div>
                                                <div className="text-xs text-gray-500 font-mono">{emp.personalNumber}</div>
                                            </div>
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{emp.department}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">{emp.skillCount}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {emp.expertLevelCount > 0 ? (
                                            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">{emp.expertLevelCount}</span>
                                        ) : (
                                            <span className="text-gray-300">—</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Link href={`/iluo/detail?pn=${emp.personalNumber}`} className="inline-flex items-center text-violet-600 hover:text-violet-700">
                                            <ChevronRight size={20} className="transition-transform group-hover:translate-x-1" />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
