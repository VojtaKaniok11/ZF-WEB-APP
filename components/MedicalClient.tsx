"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, ChevronRight, Download, Loader2, Plus } from "lucide-react";
import MedicalDetailModal from "./MedicalDetailModal";
import { getApiUrl } from "@/lib/constants";

import { Employee } from "@/types/employee";
import CreateMedicalTypeModal from "./CreateMedicalTypeModal";

export interface MedicalTypeV2 {
    id: string;
    name: string;
    description: string;
    validityMonths: number;
    category: string;
}

interface Props {
    employees: Employee[];
}

export default function MedicalClient({ employees }: Props) {
    const [types, setTypes] = useState<MedicalTypeV2[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("Vše");
    const [exporting, setExporting] = useState(false);

    const categories = useMemo(() => {
        const cats = new Set(types.map((t) => t.category));
        return ["Vše", ...Array.from(cats)].sort();
    }, [types]);

    const loadTypes = () => {
        setLoading(true);
        const apiUrl = getApiUrl();
        fetch(`${apiUrl}/medical-types`)
            .then((res) => res.json())
            .then((data) => {
                if (data.success) {
                    setTypes(data.data);
                }
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setLoading(false);
            });
    };

    useEffect(() => {
        loadTypes();
    }, []);

    const filtered = useMemo(() => {
        let res = types;
        
        if (selectedCategory !== "Vše") {
            res = res.filter((t) => t.category === selectedCategory);
        }
        
        if (search) {
            const s = search.toLowerCase();
            res = res.filter(
                (t) =>
                    t.name.toLowerCase().includes(s) ||
                    t.category.toLowerCase().includes(s)
            );
        }
        
        return res;
    }, [types, search, selectedCategory]);

    const handleExport = async () => {
        try {
            setExporting(true);
            const apiUrl = getApiUrl();
            const response = await fetch(`${apiUrl}/medical/export`); // Note: need to implement this endpoint
            if (!response.ok) throw new Error("Chyba při stahování Excelu.");
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.style.display = "none";
            a.href = url;
            a.download = `lekarske_prohlidky_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error("Export selhal:", error);
            alert("Export zatím není plně implementován pro tuto stránku.");
        } finally {
            setExporting(false);
        }
    };

    if (loading) {
        return (
            <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 flex justify-center mt-20">
                <div className="text-sm font-semibold text-gray-500 animate-pulse">Načítání lékařských prohlídek...</div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-8 flex items-center gap-3">
                <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-lg shadow-blue-600/25"
                    style={{ backgroundColor: "#0054A6" }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                    </svg>
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Lékařské prohlídky</h1>
                    <p className="text-sm text-gray-500">Evidence lékařských prohlídek zaměstnanců — vstupní, periodické, mimořádné.</p>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="mb-6 overflow-hidden rounded-xl border border-gray-200 bg-white p-4 shadow-sm flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Hledat prohlídku podle názvu..."
                        className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                </div>
                <div className="sm:w-64 shrink-0">
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2.5 px-4 text-sm text-gray-900 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                        {categories.map((c) => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Count badge */}
            <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <span className="inline-flex items-center rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                    Nalezeno: {filtered.length} typů prohlídek
                </span>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0054A6] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90 active:scale-95 cursor-pointer shrink-0"
                >
                    <Plus size={16} />
                    Přidat prohlídku
                </button>
            </div>

            {/* List */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className="mb-4 text-4xl text-gray-200">🔍</div>
                        <p className="text-sm text-gray-500 mb-6">
                            Žádná prohlídka nebyla nalezena.
                        </p>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                <th className="px-6 py-4 w-1/2">Název prohlídky</th>
                                <th className="px-6 py-4">Kategorie</th>
                                <th className="px-6 py-4 text-right">Platnost (měsíců)</th>
                                <th className="px-6 py-4 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filtered.map((t) => (
                                <tr
                                    key={t.id}
                                    onClick={() => setSelectedTypeId(t.id)}
                                    className="transition-colors hover:bg-blue-50/40 cursor-pointer group"
                                >
                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-gray-900">{t.name}</div>
                                        <div className="text-xs text-gray-500 mt-1 line-clamp-1">{t.description}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                                            {t.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="text-sm font-medium text-gray-900">{t.validityMonths > 0 ? t.validityMonths : 'N/A'}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <ChevronRight size={18} className="text-gray-300 group-hover:text-blue-500 transition-colors inline-block" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <MedicalDetailModal
                typeId={selectedTypeId}
                employees={employees}
                onClose={() => setSelectedTypeId(null)}
            />

            {showCreateModal && (
                <CreateMedicalTypeModal
                    onClose={() => setShowCreateModal(false)}
                    onSaved={() => {
                        setShowCreateModal(false);
                        loadTypes();
                    }}
                />
            )}
        </div>
    );
}
