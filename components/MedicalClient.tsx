"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Download, Loader2, Plus } from "lucide-react";
import * as xlsx from "xlsx";
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
    medicalFacility: string;
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
    const [exportingCatalog, setExportingCatalog] = useState(false);
    const [exportingEmployees, setExportingEmployees] = useState(false);
    const [noteModal, setNoteModal] = useState<string | null>(null);

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
                if (data.success) setTypes(data.data);
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
        if (selectedCategory !== "Vše") res = res.filter((t) => t.category === selectedCategory);
        if (search) {
            const s = search.toLowerCase();
            res = res.filter(t => t.name.toLowerCase().includes(s) || t.category.toLowerCase().includes(s));
        }
        return res;
    }, [types, search, selectedCategory]);

    const handleExportCatalog = () => {
        if (filtered.length === 0) return;
        setExportingCatalog(true);
        try {
            const data = filtered.map(t => ({
                'Kategorie': t.category,
                'Název prohlídky': t.name,
                'Lékařské zařízení': t.medicalFacility || '',
                'Perioda (měsíce)': t.validityMonths,
                'Poznámka': t.description || '',
            }));
            const ws = xlsx.utils.json_to_sheet(data);
            ws['!cols'] = [{ wch: 20 }, { wch: 35 }, { wch: 30 }, { wch: 16 }, { wch: 45 }];
            const wb = xlsx.utils.book_new();
            xlsx.utils.book_append_sheet(wb, ws, "Katalog prohlídek");
            xlsx.writeFile(wb, `katalog_prohlidek_${new Date().toISOString().split('T')[0]}.xlsx`);
        } finally {
            setExportingCatalog(false);
        }
    };

    const handleExportEmployees = async () => {
        setExportingEmployees(true);
        try {
            const apiUrl = getApiUrl();
            const params = new URLSearchParams();
            if (selectedCategory !== "Vše") params.set("category", selectedCategory);
            if (search) params.set("search", search);
            const qs = params.toString();
            const res = await fetch(`${apiUrl}/medical/export${qs ? `?${qs}` : ""}`);
            const result = await res.json();
            if (!result.success || !result.data) return;

            const fmt = (d: string | null | undefined) =>
                d ? new Date(d).toLocaleDateString('cs-CZ') : '';

            const data = result.data.map((row: Record<string, unknown>) => ({
                'Osobní číslo': row.personalNumber ?? '',
                'Příjmení': row.lastName ?? '',
                'Jméno': row.firstName ?? '',
                'Kategorie zaměstnance': row.employeeCategory ?? '',
                'Nákladové středisko – číslo': row.costNumber ?? '',
                'Nákladové středisko – popis': row.costNumberDesc ?? '',
                'Kategorie prohlídky': row.examCategory ?? '',
                'Název lékařské prohlídky': row.examName ?? '',
                'Datum absolvování': fmt(row.completionDate as string | null),
                'Datum platnosti': fmt(row.expirationDate as string | null),
                'Perioda (měsíce)': row.periodicityMonths ?? '',
                'Platné': row.isValid ?? 'N',
            }));

            const ws = xlsx.utils.json_to_sheet(data);
            ws['!cols'] = [
                { wch: 14 }, { wch: 20 }, { wch: 16 }, { wch: 20 },
                { wch: 24 }, { wch: 28 }, { wch: 20 }, { wch: 32 },
                { wch: 18 }, { wch: 16 }, { wch: 16 }, { wch: 8 },
            ];
            const wb = xlsx.utils.book_new();
            xlsx.utils.book_append_sheet(wb, ws, "Lékařské prohlídky");
            xlsx.writeFile(wb, `lekarske_prohlidky_${new Date().toISOString().split('T')[0]}.xlsx`);
        } catch (err) {
            console.error(err);
        } finally {
            setExportingEmployees(false);
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

            {/* Count badge & Buttons */}
            <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <span className="inline-flex items-center rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                    Nalezeno: {filtered.length} typů prohlídek
                </span>
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <button
                        onClick={handleExportCatalog}
                        disabled={exportingCatalog || filtered.length === 0}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:bg-green-50 hover:text-green-700 hover:border-green-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none shrink-0"
                    >
                        {exportingCatalog ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                        Export katalogu
                    </button>
                    <button
                        onClick={handleExportEmployees}
                        disabled={exportingEmployees}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
                    >
                        {exportingEmployees ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                        Export zaměstnanců
                    </button>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0054A6] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90 active:scale-95 shrink-0"
                    >
                        <Plus size={16} />
                        Přidat prohlídku
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className="mb-4 text-4xl text-gray-200">🔍</div>
                        <p className="text-sm text-gray-500">Žádná prohlídka nebyla nalezena.</p>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                <th className="px-6 py-4">Kategorie</th>
                                <th className="px-6 py-4">Název prohlídky</th>
                                <th className="px-6 py-4">Lékařské zařízení</th>
                                <th className="px-6 py-4 text-right">Perioda (měsíců)</th>
                                <th className="px-6 py-4">Poznámka</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filtered.map((t) => (
                                <tr
                                    key={t.id}
                                    onClick={() => setSelectedTypeId(t.id)}
                                    className="transition-colors hover:bg-blue-50/40 cursor-pointer"
                                >
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                                            {t.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-gray-900">{t.name}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-gray-700">
                                            {t.medicalFacility || '—'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="text-sm font-medium text-gray-900">
                                            {t.validityMonths > 0 ? t.validityMonths : '—'}
                                        </span>
                                    </td>
                                    <td
                                        className="px-6 py-4"
                                        onClick={(e) => {
                                            if (!t.description) return;
                                            e.stopPropagation();
                                            setNoteModal(t.description);
                                        }}
                                    >
                                        <span className={`text-sm line-clamp-1 ${t.description ? "text-blue-600 underline decoration-dotted cursor-pointer hover:text-blue-800" : "text-gray-400"}`}>
                                            {t.description || '—'}
                                        </span>
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

            {noteModal !== null && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
                    onClick={() => setNoteModal(null)}
                >
                    <div
                        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-semibold text-gray-900">Poznámka</h3>
                            <button
                                onClick={() => setNoteModal(null)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{noteModal}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
