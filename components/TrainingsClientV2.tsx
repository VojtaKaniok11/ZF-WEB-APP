"use client";

import { useState, useEffect, useMemo, useDeferredValue } from "react";
import { Search, ChevronRight, GraduationCap, Loader2, Plus, Download } from "lucide-react";
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
    isLegal: boolean;
    isExternal: boolean;
    trainerName: string;
}

const thClass = "px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-500 whitespace-nowrap";
const tdBase = "px-4 py-3 whitespace-nowrap text-sm";

export default function TrainingsClientV2() {
    const [trainings, setTrainings] = useState<TrainingV2[]>([]);
    const [loading, setLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);
    const [isExportingEmployees, setIsExportingEmployees] = useState(false);
    const [selectedTrainingId, setSelectedTrainingId] = useState<number | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);

    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("Vše");
    const [filterLegal, setFilterLegal] = useState("Vše");
    const [filterExternal, setFilterExternal] = useState("Vše");

    const deferredSearch = useDeferredValue(search);

    const categories = useMemo(() => {
        const cats = new Set(trainings.map((t) => t.categoryName));
        return ["Vše", ...Array.from(cats).sort()];
    }, [trainings]);

    const loadTrainings = () => {
        setLoading(true);
        fetch(`${getApiUrl()}/trainings-v2`)
            .then((res) => res.json())
            .then((data) => { if (data.success) setTrainings(data.data); })
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => { loadTrainings(); }, []);

    const filtered = useMemo(() => {
        let res = trainings;
        if (selectedCategory !== "Vše") res = res.filter((t) => t.categoryName === selectedCategory);
        if (filterLegal === "Zákonné") res = res.filter((t) => t.isLegal);
        if (filterLegal === "Nezákonné") res = res.filter((t) => !t.isLegal);
        if (filterExternal === "Interní") res = res.filter((t) => !t.isExternal);
        if (filterExternal === "Externí") res = res.filter((t) => t.isExternal);
        if (deferredSearch) {
            const s = deferredSearch.toLowerCase();
            res = res.filter((t) =>
                t.name.toLowerCase().includes(s) ||
                t.categoryName.toLowerCase().includes(s) ||
                t.trainerName.toLowerCase().includes(s)
            );
        }
        return res;
    }, [trainings, deferredSearch, selectedCategory, filterLegal, filterExternal]);

    async function handleExportEmployees() {
        setIsExportingEmployees(true);
        try {
            const res = await fetch(`${getApiUrl()}/trainings-v2/employees-export`);
            if (!res.ok) { console.error("Export failed"); return; }
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `skoleni_zamestnancu_${new Date().toISOString().slice(0, 10)}.xlsx`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Export employees error:", err);
        } finally {
            setIsExportingEmployees(false);
        }
    }

    async function handleExport() {
        setIsExporting(true);
        try {
            const params = new URLSearchParams();
            if (deferredSearch) params.set("search", deferredSearch);
            if (selectedCategory !== "Vše") params.set("category", selectedCategory);
            if (filterLegal === "Zákonné") params.set("isLegal", "1");
            if (filterLegal === "Nezákonné") params.set("isLegal", "0");
            if (filterExternal === "Interní") params.set("isExternal", "0");
            if (filterExternal === "Externí") params.set("isExternal", "1");

            const qs = params.toString();
            const res = await fetch(`${getApiUrl()}/trainings-v2/catalog-export${qs ? `?${qs}` : ""}`);
            if (!res.ok) { console.error("Export failed"); return; }

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `katalog_skoleni_${new Date().toISOString().slice(0, 10)}.xlsx`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Export error:", err);
        } finally {
            setIsExporting(false);
        }
    }

    if (loading) {
        return (
            <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 flex justify-center mt-20">
                <Loader2 size={28} className="animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-8 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-lg shadow-blue-600/25" style={{ backgroundColor: "#0054A6" }}>
                    <GraduationCap size={20} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Školení</h1>
                    <p className="text-sm text-gray-500">Katalog všech školení, evidence a správa platností.</p>
                </div>
            </div>

            {/* Filters */}
            <div className="mb-6 overflow-hidden rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap gap-3">
                    <div className="relative flex-1 min-w-[180px]">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Hledat školení..."
                            className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2.5 pl-9 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="rounded-lg border border-gray-300 bg-gray-50 py-2.5 px-3 text-sm text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                    >
                        {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select
                        value={filterLegal}
                        onChange={(e) => setFilterLegal(e.target.value)}
                        className="rounded-lg border border-gray-300 bg-gray-50 py-2.5 px-3 text-sm text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                    >
                        <option value="Vše">Zákonné – vše</option>
                        <option value="Zákonné">Zákonné</option>
                        <option value="Nezákonné">Nezákonné</option>
                    </select>
                    <select
                        value={filterExternal}
                        onChange={(e) => setFilterExternal(e.target.value)}
                        className="rounded-lg border border-gray-300 bg-gray-50 py-2.5 px-3 text-sm text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                    >
                        <option value="Vše">Interní/Ext. – vše</option>
                        <option value="Interní">Interní</option>
                        <option value="Externí">Externí</option>
                    </select>
                </div>
            </div>

            {/* Action bar */}
            <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <span className="inline-flex items-center rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                    Nalezeno: {filtered.length} školení
                </span>
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={handleExportEmployees}
                        disabled={isExportingEmployees}
                        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 active:scale-95 disabled:opacity-50"
                    >
                        <Download size={15} />
                        {isExportingEmployees ? "Exportuji..." : "Export školení zaměstnanců"}
                    </button>
                    <button
                        onClick={handleExport}
                        disabled={isExporting}
                        className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-green-700 active:scale-95 disabled:opacity-50"
                    >
                        <Download size={15} />
                        {isExporting ? "Exportuji..." : "Exportovat katalog"}
                    </button>

                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90 active:scale-95"
                        style={{ backgroundColor: "#0054A6" }}
                    >
                        <Plus size={15} />
                        Přidat školení
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className="mb-4 text-4xl text-gray-200">🔍</div>
                        <p className="text-sm text-gray-500 mb-6">Žádné školení nebylo nalezeno.</p>
                        <button
                            onClick={async () => {
                                await fetch(`${getApiUrl()}/trainings-v2/seed`, { method: "POST" });
                                loadTrainings();
                            }}
                            className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                        >
                            Vložit ukázková data
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-[0.82rem]">
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-50/80">
                                    <th className={thClass} style={{ width: "130px" }}>Kategorie</th>
                                    <th className={thClass} style={{ width: "260px" }}>Název školení</th>
                                    <th className={thClass} style={{ width: "100px" }}>Zákonné</th>
                                    <th className={thClass} style={{ width: "100px" }}>Interní/Ext.</th>
                                    <th className={thClass} style={{ width: "80px" }}>Perioda</th>
                                    <th className={thClass} style={{ width: "150px" }}>Školitel</th>
                                    <th className={thClass}>Poznámka</th>
                                    <th className={thClass} style={{ width: "40px" }}></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filtered.map((t) => (
                                    <tr
                                        key={t.id}
                                        onClick={() => setSelectedTrainingId(t.id)}
                                        className="transition-colors hover:bg-blue-50/40 cursor-pointer group"
                                    >
                                        <td className={tdBase}>
                                            <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                                                {t.categoryName}
                                            </span>
                                        </td>
                                        <td className={`${tdBase} py-4 text-[0.95rem] font-semibold text-gray-900`}>{t.name}</td>
                                        <td className={tdBase}>
                                            <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium ring-1 ring-inset ${
                                                t.isLegal
                                                    ? "bg-blue-50 text-blue-700 ring-blue-600/20"
                                                    : "bg-gray-50 text-gray-500 ring-gray-500/10"
                                            }`}>
                                                {t.isLegal ? "Zákonné" : "Nezákonné"}
                                            </span>
                                        </td>
                                        <td className={tdBase}>
                                            <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium ring-1 ring-inset ${
                                                t.isExternal
                                                    ? "bg-amber-50 text-amber-700 ring-amber-600/20"
                                                    : "bg-green-50 text-green-700 ring-green-600/20"
                                            }`}>
                                                {t.isExternal ? "Externí" : "Interní"}
                                            </span>
                                        </td>
                                        <td className={`${tdBase} text-gray-600 tabular-nums`}>
                                            {t.periodicityMonths === 0 ? "—" : `${t.periodicityMonths} měs.`}
                                        </td>
                                        <td className={`${tdBase} text-gray-600`}>
                                            {t.trainerName || <span className="text-gray-300">—</span>}
                                        </td>
                                        <td className={`${tdBase} text-gray-500`} style={{ maxWidth: "260px" }}>
                                            {t.description
                                                ? <span className="line-clamp-1 block overflow-hidden text-ellipsis">{t.description}</span>
                                                : <span className="text-gray-300">—</span>}
                                        </td>
                                        <td className={tdBase}>
                                            <ChevronRight size={16} className="text-gray-300 group-hover:text-blue-500 transition-colors" />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <TrainingDetailModalV2
                trainingId={selectedTrainingId}
                onClose={() => setSelectedTrainingId(null)}
                onUpdated={loadTrainings}
            />

            {showCreateModal && (
                <AddNewTrainingModalV2
                    onClose={() => setShowCreateModal(false)}
                    onSaved={() => { setShowCreateModal(false); loadTrainings(); }}
                />
            )}

        </div>
    );
}
