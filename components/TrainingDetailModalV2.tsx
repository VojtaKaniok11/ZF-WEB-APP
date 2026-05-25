"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { X, Plus, AlertTriangle, CheckCircle, Clock, Search, Filter, Download, Building2, Check } from "lucide-react";
import * as xlsx from "xlsx";
import { TrainingV2 } from "./TrainingsClientV2";
import AddTrainingRecordModalV2 from "./AddTrainingRecordModalV2";
import { getApiUrl } from "@/lib/constants";

interface EmployeeStatus {
    employeeId: number;
    firstName: string;
    lastName: string;
    personalNumber: string;
    department: string;
    workcenter: string;
    category: string;
    costNumber: string;
    costNumberDesc: string;
    hasCompleted: boolean;
    completionDate: string | null;
    expirationDate: string | null;
    validityStatus: 'Platné' | 'Neplatné' | 'Blíží se expirace';
    isLegalOrExternal: boolean;
    hiringDate: string | null;
}

interface Props {
    trainingId: number | null;
    onClose: () => void;
}

export default function TrainingDetailModalV2({ trainingId, onClose }: Props) {
    const [training, setTraining] = useState<TrainingV2 | null>(null);
    const [employees, setEmployees] = useState<EmployeeStatus[]>([]);
    const [loading, setLoading] = useState(false);

    const [showAddModal, setShowAddModal] = useState(false);

    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState<"Vše" | "Platné" | "Neplatné" | "Blíží se expirace">("Vše");
    const [selectedWorkcenters, setSelectedWorkcenters] = useState<Set<string>>(new Set());
    const [isWorkcenterDropdownOpen, setIsWorkcenterDropdownOpen] = useState(false);
    const workcenterDropdownRef = useRef<HTMLDivElement>(null);

    const workcenters = useMemo(() => {
        const wcs = new Set(employees.map(e => (e.workcenter || "").trim()).filter(Boolean));
        return Array.from(wcs).sort() as string[];
    }, [employees]);

    const loadDetail = () => {
        if (!trainingId) return;
        setLoading(true);
        const apiUrl = getApiUrl();
        fetch(`${apiUrl}/trainings-v2/${trainingId}`)
            .then((res) => res.json())
            .then((data) => {
                if (data.success) {
                    setTraining(data.training);
                    setEmployees(data.employees);
                }
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setLoading(false);
            });
    };

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (workcenterDropdownRef.current && !workcenterDropdownRef.current.contains(event.target as Node)) {
                setIsWorkcenterDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        setSearchQuery("");
        setFilterStatus("Vše");
        setSelectedWorkcenters(new Set());
        if (trainingId) {
            loadDetail();
        } else {
            setTraining(null);
            setEmployees([]);
        }
    }, [trainingId]);

    // Direct computation — no useMemo — guarantees table re-renders on every filter change
    let filteredEmployees = employees;

    // Filter out employees with "Neproškolen" status (no training record)
    filteredEmployees = filteredEmployees.filter(emp => (emp.validityStatus || "").trim() !== "Neproškolen");

    if (searchQuery) {
        const s = searchQuery.toLowerCase();
        filteredEmployees = filteredEmployees.filter(emp =>
            emp.firstName.toLowerCase().includes(s) ||
            emp.lastName.toLowerCase().includes(s) ||
            (emp.personalNumber && emp.personalNumber.toLowerCase().includes(s))
        );
    }

    if (filterStatus !== "Vše") {
        filteredEmployees = filteredEmployees.filter(emp => {
            const empStatus = (emp.validityStatus || "").trim();
            return empStatus === filterStatus;
        });
    }

    if (selectedWorkcenters.size > 0) {
        filteredEmployees = filteredEmployees.filter(emp => selectedWorkcenters.has((emp.workcenter || "").trim()));
    }

    const handleExportExcel = () => {
        if (filteredEmployees.length === 0) return;

        const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString('cs-CZ') : '';

        const data = filteredEmployees.map(emp => ({
            'Osobní číslo': emp.personalNumber || '',
            'Příjmení': emp.lastName,
            'Jméno': emp.firstName,
            'Kategorie zaměstnance': emp.category || '',
            'Nákladové středisko – číslo': emp.costNumber || '',
            'Nákladové středisko – popis': emp.costNumberDesc || '',
            'Kategorie školení': training?.categoryName || '',
            'Název školení': training?.name || '',
            'Datum absolvování': fmt(emp.completionDate),
            'Datum platné do': fmt(emp.expirationDate),
            'Perioda (měsíce)': training?.periodicityMonths ?? '',
            'Platné': emp.validityStatus === 'Platné' ? 'A' : 'N',
        }));

        const ws = xlsx.utils.json_to_sheet(data);
        ws['!cols'] = [
            { wch: 14 }, { wch: 20 }, { wch: 16 }, { wch: 20 },
            { wch: 24 }, { wch: 28 }, { wch: 22 }, { wch: 30 },
            { wch: 18 }, { wch: 16 }, { wch: 18 }, { wch: 8 },
        ];

        const wb = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(wb, ws, "Záznamy o školení");

        const safeName = (training?.name || 'export').replace(/[/\\?%*:|"<>]/g, '-');
        const dateStr = new Date().toISOString().split('T')[0];
        xlsx.writeFile(wb, `${safeName}_${dateStr}.xlsx`);
    };

    if (!trainingId) return null;

    const isFiltered = searchQuery || filterStatus !== "Vše" || selectedWorkcenters.size > 0;

    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-black/40 backdrop-blur-sm overflow-hidden" onClick={onClose}>
            {/* Modal Container */}
            <div
                className="relative w-full max-w-6xl h-full max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header Section */}
                <div className="flex items-start justify-between px-6 py-5 border-b border-gray-200" style={{ background: "linear-gradient(135deg, #0054A6 0%, #003d7a 100%)", borderTopLeftRadius: "1rem", borderTopRightRadius: "1rem" }}>
                    <div className="pr-4">
                        {loading ? (
                            <div className="space-y-2">
                                <div className="h-4 bg-white/20 animate-pulse w-24 rounded"></div>
                                <div className="h-6 bg-white/20 animate-pulse w-64 rounded"></div>
                            </div>
                        ) : (
                            <>
                                <span className="inline-block bg-white/20 text-blue-100 text-xs font-semibold px-2 py-1 rounded mb-2">
                                    {training?.categoryName}
                                </span>
                                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                                    {training?.name}
                                </h2>
                                <div className="text-blue-200 mt-1 text-sm flex gap-4 font-medium">
                                    <span>Školitel: <strong className="text-white font-semibold">Autorizovaný lektor ZF</strong></span>
                                    <span>Perioda: <strong className="text-white font-semibold">{training?.periodicityMonths} měsíců</strong></span>
                                </div>
                            </>
                        )}
                    </div>

                    <button
                        onClick={onClose}
                        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Toolbar */}
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-sm font-medium text-gray-500">
                            Seznam zaměstnanců a platnost školení:
                            {!loading && (
                                <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
                                    {isFiltered
                                        ? `${filteredEmployees.length} z ${employees.length}`
                                        : `${employees.length}`
                                    }
                                </span>
                            )}
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleExportExcel}
                                disabled={loading || filteredEmployees.length === 0}
                                className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:bg-green-50 hover:text-green-700 hover:border-green-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                            >
                                <Download size={16} />
                                Export Excel
                            </button>
                            <button
                                onClick={() => setShowAddModal(true)}
                                disabled={loading}
                                className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                                style={{ backgroundColor: "#0054A6" }}
                            >
                                <Plus size={16} />
                                Přidat záznam
                            </button>
                        </div>
                    </div>

                    {/* Filters Row */}
                    {!loading && (
                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <div className="relative flex-1">
                                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Vyhledat zaměstnance..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                            <div className="flex items-center gap-2 sm:w-auto">
                                <Filter size={15} className="text-gray-400" />
                                <select
                                    value={filterStatus}
                                    onChange={e => setFilterStatus(e.target.value as any)}
                                    className="rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-8 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="Vše">Všechny statusy</option>
                                    <option value="Platné">Platné</option>
                                    <option value="Neplatné">Propadlé</option>
                                    <option value="Blíží se expirace">Blíží se expirace</option>
                                </select>
                                <div ref={workcenterDropdownRef} className="relative flex items-center gap-2">
                                    <Building2 size={15} className="text-gray-400" />
                                    <button
                                        type="button"
                                        onClick={() => setIsWorkcenterDropdownOpen(!isWorkcenterDropdownOpen)}
                                        className="rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-8 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-left min-w-[150px]"
                                    >
                                        {selectedWorkcenters.size === 0 ? "Všechna střediska" : `Vybráno: ${selectedWorkcenters.size}`}
                                    </button>
                                    {isWorkcenterDropdownOpen && (
                                        <div className="absolute top-full mt-1 left-0 max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg z-[60] min-w-[200px]">
                                            {workcenters.map(wc => (
                                                <button
                                                    key={wc}
                                                    type="button"
                                                    onClick={() => {
                                                        const newSet = new Set(selectedWorkcenters);
                                                        if (newSet.has(wc)) {
                                                            newSet.delete(wc);
                                                        } else {
                                                            newSet.add(wc);
                                                        }
                                                        setSelectedWorkcenters(newSet);
                                                    }}
                                                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 transition-colors text-left text-sm"
                                                >
                                                    <span className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition-all ${selectedWorkcenters.has(wc) ? "border-blue-600 bg-blue-600" : "border-gray-300 bg-white"}`}>
                                                        {selectedWorkcenters.has(wc) && <Check size={10} strokeWidth={3} className="text-white" />}
                                                    </span>
                                                    <span className="text-gray-700">{wc}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Data Table */}
                <div className="flex-1 overflow-y-auto bg-white p-6 custom-scrollbar rounded-b-2xl">
                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse"></div>
                            ))}
                        </div>
                    ) : (
                        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                            <table className="w-full text-left border-collapse min-w-[700px]">
                                <thead>
                                    <tr className="border-b border-gray-200 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        <th className="px-4 py-4">Os. číslo</th>
                                        <th className="px-4 py-4">Příjmení</th>
                                        <th className="px-4 py-4">Jméno</th>
                                        <th className="px-4 py-4">Nákladové středisko</th>
                                        <th className="px-4 py-4">Nákladové středisko popis</th>
                                        <th className="px-4 py-4">Absolvováno</th>
                                        <th className="px-4 py-4">Platnost do</th>
                                        <th className="px-4 py-4 text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredEmployees.map((emp) => (
                                        <tr key={emp.personalNumber} className="transition-colors hover:bg-blue-50/40">
                                            <td className="px-4 py-3">
                                                <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono font-semibold text-blue-700">
                                                    {emp.personalNumber || '—'}
                                                </code>
                                            </td>
                                            <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                                                {emp.lastName}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700">
                                                {emp.firstName}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {emp.costNumber || '—'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {emp.costNumberDesc || '—'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700 font-medium">
                                                {emp.completionDate ? new Date(emp.completionDate).toLocaleDateString("cs-CZ") : '—'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700 font-medium">
                                                {emp.expirationDate ? new Date(emp.expirationDate).toLocaleDateString("cs-CZ") : '—'}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <StatusBadge status={emp.validityStatus} />
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredEmployees.length === 0 && (
                                        <tr>
                                            <td colSpan={8} className="py-12 text-center text-sm text-gray-400">
                                                Nenalezeny žádné záznamy pro dané filtry.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Vnořený Modal */}
            {showAddModal && (
                <AddTrainingRecordModalV2
                    trainingId={trainingId}
                    periodicityMonths={training?.periodicityMonths || 0}
                    isLegalOrExternal={!!(training?.isLegal || training?.isExternal)}
                    employees={employees}
                    onClose={() => setShowAddModal(false)}
                    onSaved={() => {
                        setShowAddModal(false);
                        loadDetail();
                    }}
                />
            )}
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    if (status === 'Platné') {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                <CheckCircle size={14} /> Platné
            </span>
        );
    }
    if (status === 'Neplatné') {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">
                <AlertTriangle size={14} /> Propadlé
            </span>
        );
    }
    if (status === 'Blíží se expirace') {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
                <Clock size={14} /> Expiruje
            </span>
        );
    }
    return null;
}
