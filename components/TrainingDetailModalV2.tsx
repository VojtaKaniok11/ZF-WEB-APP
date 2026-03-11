"use client";

import { useState, useEffect, useMemo } from "react";
import { X, Plus, AlertTriangle, CheckCircle, Clock, Search, Filter, Download } from "lucide-react";
import * as xlsx from "xlsx";
import { TrainingV2 } from "./TrainingsClientV2";
import AddTrainingRecordModalV2 from "./AddTrainingRecordModalV2";

interface EmployeeStatus {
    employeeId: number;
    firstName: string;
    lastName: string;
    personalNumber: string;
    department: string;
    hasCompleted: boolean;
    completionDate: string | null;
    expirationDate: string | null;
    validityStatus: 'Platné' | 'Neplatné' | 'Blíží se expirace' | 'Neproškolen';
    isLegalOrExternal: boolean;
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
    const [filterType, setFilterType] = useState<"Vše" | "Interní" | "Zákonné / Externí">("Vše");
    const [filterStatus, setFilterStatus] = useState<"Vše" | "Platné" | "Neplatné" | "Blíží se expirace" | "Neproškolen">("Vše");

    const loadDetail = () => {
        if (!trainingId) return;
        setLoading(true);
        fetch(`/api/trainings-v2/${trainingId}`)
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
        if (trainingId) {
            loadDetail();
        } else {
            setTraining(null);
            setEmployees([]);
        }
    }, [trainingId]);

    const filteredEmployees = useMemo(() => {
        let res = employees;

        if (searchQuery) {
            const s = searchQuery.toLowerCase();
            res = res.filter(emp =>
                emp.firstName.toLowerCase().includes(s) ||
                emp.lastName.toLowerCase().includes(s) ||
                (emp.personalNumber && emp.personalNumber.toLowerCase().includes(s))
            );
        }

        if (filterType !== "Vše") {
            if (filterType === "Interní") {
                res = res.filter(emp => emp.hasCompleted && !emp.isLegalOrExternal);
            } else if (filterType === "Zákonné / Externí") {
                res = res.filter(emp => emp.hasCompleted && emp.isLegalOrExternal);
            }
        }

        if (filterStatus !== "Vše") {
            res = res.filter(emp => emp.validityStatus === filterStatus);
        }

        return res;
    }, [employees, searchQuery, filterType, filterStatus]);

    const handleExportExcel = () => {
        if (filteredEmployees.length === 0) return;

        const data = filteredEmployees.map(emp => ({
            'Příjmení a jméno': `${emp.lastName} ${emp.firstName}`,
            'Osobní číslo': emp.personalNumber || '',
            'Oddělení': emp.department,
            'Datum absolvování': emp.completionDate ? new Date(emp.completionDate).toLocaleDateString('cs-CZ') : '',
            'Datum platnosti': emp.expirationDate ? new Date(emp.expirationDate).toLocaleDateString('cs-CZ') : '',
            'Zákonné / Externí': emp.hasCompleted ? (emp.isLegalOrExternal ? 'Ano' : 'Ne') : '',
            'Stav': emp.validityStatus
        }));

        const ws = xlsx.utils.json_to_sheet(data);
        const wscols = [
            { wch: 25 },
            { wch: 15 },
            { wch: 20 },
            { wch: 18 },
            { wch: 18 },
            { wch: 18 },
            { wch: 15 }
        ];
        ws['!cols'] = wscols;

        const wb = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(wb, ws, "Záznamy o školení");
        
        const fileName = `skoleni_${training?.name || 'export'}_${new Date().toISOString().split('T')[0]}.xlsx`;
        xlsx.writeFile(wb, fileName);
    };

    if (!trainingId) return null;

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
                                    placeholder="Vyhledat zaměstnance..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                            <div className="flex items-center gap-2 sm:w-auto">
                                <Filter size={15} className="text-gray-400" />
                                <select
                                    value={filterType}
                                    onChange={e => setFilterType(e.target.value as any)}
                                    className="rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-8 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="Vše">Všechny druhy</option>
                                    <option value="Interní">Pouze Interní</option>
                                    <option value="Zákonné / Externí">Pouze Zákonné / Externí</option>
                                </select>
                                <select
                                    value={filterStatus}
                                    onChange={e => setFilterStatus(e.target.value as any)}
                                    className="rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-8 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="Vše">Všechny statusy</option>
                                    <option value="Platné">Platné</option>
                                    <option value="Neplatné">Neplatné</option>
                                    <option value="Blíží se expirace">Blíží se expirace</option>
                                    <option value="Neproškolen">Neproškolen</option>
                                </select>
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
                                        <th className="px-6 py-4">Zaměstnanec</th>
                                        <th className="px-6 py-4 hidden sm:table-cell">Absolvováno</th>
                                        <th className="px-6 py-4 hidden md:table-cell">Platnost do</th>
                                        <th className="px-6 py-4 text-center">Druh školení</th>
                                        <th className="px-6 py-4 text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredEmployees.map((emp) => (
                                        <tr key={emp.employeeId} className="transition-colors hover:bg-blue-50/40">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-blue-200 text-xs font-bold text-blue-700">
                                                        {emp.lastName.charAt(0)}{emp.firstName.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-gray-900 text-sm">
                                                            {emp.firstName} {emp.lastName}
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <code className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-blue-700">
                                                                {emp.personalNumber || "N/A"}
                                                            </code>
                                                            <span className="text-xs text-gray-500 truncate max-w-[120px]">
                                                                {emp.department}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 hidden sm:table-cell text-sm text-gray-700 font-medium">
                                                {emp.completionDate ? new Date(emp.completionDate).toLocaleDateString("cs-CZ") : '—'}
                                            </td>
                                            <td className="px-6 py-4 hidden md:table-cell text-sm text-gray-700 font-medium">
                                                {emp.expirationDate ? new Date(emp.expirationDate).toLocaleDateString("cs-CZ") : '—'}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {emp.hasCompleted ? (
                                                    emp.isLegalOrExternal ? (
                                                        <span className="inline-flex items-center rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-600/20 whitespace-nowrap">
                                                            Zákonné / Externí
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center rounded-lg bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                                                            Interní
                                                        </span>
                                                    )
                                                ) : (
                                                    <span className="text-gray-400">—</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <StatusBadge status={emp.validityStatus} />
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredEmployees.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="py-12 text-center text-sm text-gray-400">
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
                <AlertTriangle size={14} /> Neplatné
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
    return (
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
            Neproškolen
        </span>
    );
}
