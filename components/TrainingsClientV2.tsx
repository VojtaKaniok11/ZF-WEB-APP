"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, ChevronRight, GraduationCap } from "lucide-react";
import TrainingDetailModalV2 from "./TrainingDetailModalV2";

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

    useEffect(() => {
        fetch("/api/trainings-v2")
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
    }, []);

    const filtered = useMemo(() => {
        if (!search) return trainings;
        const s = search.toLowerCase();
        return trainings.filter(
            (t) =>
                t.name.toLowerCase().includes(s) ||
                t.categoryName.toLowerCase().includes(s)
        );
    }, [trainings, search]);

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

            {/* Search */}
            <div className="mb-6 overflow-hidden rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Hledat školení podle názvu nebo kategorie..."
                        className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                </div>
            </div>

            {/* Count badge */}
            <div className="mb-4 flex items-center justify-between gap-2">
                <span className="inline-flex items-center rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                    Nalezeno: {filtered.length} školení
                </span>
            </div>

            {/* List */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className="mb-3 text-4xl">🔍</div>
                        <p className="text-sm text-gray-400">
                            Žádné školení nebylo nalezeno.
                        </p>
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
        </div>
    );
}
