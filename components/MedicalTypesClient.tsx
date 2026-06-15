"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, ChevronRight, GraduationCap, Download, Loader2, Plus } from "lucide-react";
import TrainingDetailModalV2 from "./TrainingDetailModalV2";
import AddNewTrainingModalV2 from "./AddNewTrainingModalV2";
import { getApiUrl } from "@/lib/constants";

export interface TrainingV2 {
    id: number;
    name: string;
    description: string;
    periodicityMonths: number;
    categoryId: number;
    categoryName: string;
}

export default function TrainingsClientV2() {
    const [trainings, setTrainings] = useState<TrainingV2[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTrainingId, setSelectedTrainingId] = useState<number | null>(null);
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("Vše");
    const [exportFilter, setExportFilter] = useState("all");
    const [exporting, setExporting] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);

    const categories = useMemo(() => {
        const cats = new Set(trainings.map((t) => t.categoryName));
        return ["Vše", ...Array.from(cats)].sort();
    }, [trainings]);

    const loadTrainings = () => {
        setLoading(true);
        const apiUrl = getApiUrl();
        fetch(`${apiUrl}/trainings-v2`)
            .then((res) => res.json())
            .then((data) => {
                if (data.success) {
                    setTrainings(data.data);
                }
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setLoading(false);
            });
    };

    useEffect(() => {
        loadTrainings();
    }, []);

    const filtered = useMemo(() => {
        let res = trainings;
        
        if (selectedCategory !== "Vše") {
            res = res.filter((t) => t.categoryName === selectedCategory);
        }
        
        if (search) {
            const s = search.toLowerCase();
            res = res.filter(
                (t) =>
                    t.name.toLowerCase().includes(s) ||
                    t.categoryName.toLowerCase().includes(s)
            );
        }
        
        return res;
    }, [trainings, search, selectedCategory]);

    const handleExport = async () => {
        try {
            setExporting(true);
            const apiUrl = getApiUrl();
            const response = await fetch(`${apiUrl}/trainings-v2/export?filter=${exportFilter}&category=${encodeURIComponent(selectedCategory)}`);
            if (!response.ok) throw new Error("Chyba při stahování Excelu.");
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.style.display = "none";
            a.href = url;
            a.download = `katalog_skoleni_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error("Export selhal:", error);
            alert("Export do Excelu se nezdařil.");
        } finally {
            setExporting(false);
        }
    };

    if (loading) {
        return (
            <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 flex justify-center mt-20">
                <div className="text-sm font-semibold text-gray-500 animate-pulse">Načítání školení...</div>
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
                    <GraduationCap size={20} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Školení</h1>
                    <p className="text-sm text-gray-500">Katalog všech školení, evidence a správa platností.</p>
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
                        placeholder="Hledat školení podle názvu..."
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

            {/* Count badge & Export */}
            <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <span className="inline-flex items-center rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                    Nalezeno: {filtered.length} školení
                </span>
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <select
                        value={exportFilter}
                        onChange={(e) => setExportFilter(e.target.value)}
                        className="rounded-lg border border-gray-300 bg-white py-2.5 px-4 text-sm text-gray-700 focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600/20 w-full sm:w-auto shadow-sm transition-colors"
                    >
                        <option value="all">Exportovat všechna data</option>
                        <option value="expiring">Exportovat prošlá a končící v příštích 30 dnech</option>
                    </select>
                    <button
                        onClick={handleExport}
                        disabled={exporting}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed shrink-0 cursor-pointer"
                    >
                        {exporting ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <Download size={16} />
                        )}
                        Export Excel
                    </button>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0054A6] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90 active:scale-95 cursor-pointer shrink-0"
                    >
                        <Plus size={16} />
                        Přidat školení
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className="mb-4 text-4xl text-gray-200">🔍</div>
                        <p className="text-sm text-gray-500 mb-6">
                            Žádné školení nebylo nalezeno.
                        </p>
                        <button
                            onClick={async () => {
                                const apiUrl = getApiUrl();
                                await fetch(`${apiUrl}/trainings-v2/seed`, { method: "POST" });
                                loadTrainings();
                            }}
                            className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
                        >
                            Vložit ukázková data
                        </button>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                <th className="px-6 py-4 w-1/2">Název školení</th>
                                <th className="px-6 py-4">Kategorie</th>
                                <th className="px-6 py-4 text-right">Platnost (měsíců)</th>
                                <th className="px-6 py-4 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filtered.map((t) => (
                                <tr
                                    key={t.id}
                                    onClick={() => setSelectedTrainingId(t.id)}
                                    className="transition-colors hover:bg-blue-50/40 cursor-pointer group"
                                >
                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-gray-900">{t.name}</div>
                                        <div className="text-xs text-gray-500 mt-1 line-clamp-1">{t.description}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                                            {t.categoryName}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="text-sm font-medium text-gray-900">{t.periodicityMonths}</span>
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

            <TrainingDetailModalV2
                trainingId={selectedTrainingId}
                onClose={() => setSelectedTrainingId(null)}
            />

            {showCreateModal && (
                <AddNewTrainingModalV2
                    onClose={() => setShowCreateModal(false)}
                    onSaved={() => {
                        setShowCreateModal(false);
                        loadTrainings();
                    }}
                />
            )}
        </div>
    );
}
