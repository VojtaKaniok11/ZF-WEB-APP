"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, ChevronRight, Loader2, Plus } from "lucide-react";
import OoppDetailModal from "./OoppDetailModal";
import { getApiUrl } from "@/lib/constants";
import { Employee } from "@/types/employee";
import CreateOoppItemModal from "./CreateOoppItemModal";

export interface OoppItemV2 {
    id: string;
    name: string;
    category: string;
}

interface Props {
    employees: Employee[];
}

export default function OoppClient({ employees }: Props) {
    const [items, setItems] = useState<OoppItemV2[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("Vše");


    const categories = useMemo(() => {
        const cats = new Set(items.map((t) => t.category));
        return ["Vše", ...Array.from(cats)].sort();
    }, [items]);

    const loadItems = () => {
        setLoading(true);
        const apiUrl = getApiUrl();
        fetch(`${apiUrl}/oopp`)
            .then((res) => res.json())
            .then((data) => {
                if (data.success) {
                    setItems(data.data);
                }
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setLoading(false);
            });
    };

    useEffect(() => {
        loadItems();
    }, []);

    const filtered = useMemo(() => {
        let res = items;
        
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
    }, [items, search, selectedCategory]);



    if (loading) {
        return (
            <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 flex justify-center mt-20">
                <div className="text-sm font-semibold text-gray-500 animate-pulse">Načítání OOPP...</div>
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
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
                    </svg>
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">OOPP Evidence</h1>
                    <p className="text-sm text-gray-500">Katalog osobních ochranných pracovních pomůcek a jejich výdeje.</p>
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
                        placeholder="Hledat položku podle názvu..."
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
                    Nalezeno: {filtered.length} položek OOPP
                </span>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0054A6] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90 active:scale-95 cursor-pointer shrink-0"
                >
                    <Plus size={16} />
                    Přidat OOPP
                </button>
            </div>

            {/* List */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className="mb-4 text-4xl text-gray-200">🛠️</div>
                        <p className="text-sm text-gray-500 mb-6">
                            Žádná OOPP položka nebyla nalezena.
                        </p>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                <th className="px-6 py-4 w-1/2">Název OOPP</th>
                                <th className="px-6 py-4">Kategorie</th>
                                <th className="px-6 py-4 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filtered.map((t) => (
                                <tr
                                    key={t.id}
                                    onClick={() => setSelectedItemId(t.id)}
                                    className="transition-colors hover:bg-blue-50/40 cursor-pointer group"
                                >
                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-gray-900">{t.name}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                                            {t.category}
                                        </span>
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

            <OoppDetailModal
                itemId={selectedItemId}
                employees={employees}
                onClose={() => setSelectedItemId(null)}
            />

            {showCreateModal && (
                <CreateOoppItemModal
                    onClose={() => setShowCreateModal(false)}
                    onSaved={() => {
                        setShowCreateModal(false);
                        loadItems();
                    }}
                />
            )}
        </div>
    );
}
