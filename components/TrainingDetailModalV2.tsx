"use client";

import { useState, useEffect } from "react";
import { X, Plus, AlertTriangle, CheckCircle, Clock } from "lucide-react";
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
                <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row items-center justify-between bg-gray-50 gap-4">
                    <p className="text-sm font-medium text-gray-500">
                        Seznam zaměstnanců a platnost školení:
                    </p>
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
                                        <th className="px-6 py-4 text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {employees.map((emp) => (
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
                                            <td className="px-6 py-4 text-right">
                                                <StatusBadge status={emp.validityStatus} />
                                            </td>
                                        </tr>
                                    ))}
                                    {employees.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="py-12 text-center text-sm text-gray-400">
                                                Žádní aktivní zaměstnanci k zobrazení.
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
