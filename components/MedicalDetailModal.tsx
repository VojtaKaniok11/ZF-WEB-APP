"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { X, Plus, AlertTriangle, CheckCircle, Clock, Search, Filter, Download, Building2, ChevronDown, Trash2 } from "lucide-react";
import * as xlsx from "xlsx";
import AddMedicalModal from "./AddMedicalModal";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import { getApiUrl } from "@/lib/constants";
import { MedicalTypeV2 } from "./MedicalClient";
import { Employee } from "@/types/employee";

interface EmployeeStatus {
    firstName: string;
    lastName: string;
    personalNumber: string;
    department: string;
    costNumber: string;
    costNumberDesc: string;
    hasCompleted: boolean;
    completionDate: string | null;
    expirationDate: string | null;
    notes: string;
    validityStatus: 'Platné' | 'Neplatné' | 'Blíží se expirace' | 'Neproškolen' | 'superseded' | '0';
    hiringDate: string | null;
}

interface Props {
    typeId: string | null;
    employees: Employee[];
    onClose: () => void;
    onChanged?: () => void;
}

export default function MedicalDetailModal({ typeId, employees: allEmployees, onClose, onChanged }: Props) {
    const [medicalType, setMedicalType] = useState<MedicalTypeV2 | null>(null);
    const [employees, setEmployees] = useState<EmployeeStatus[]>([]);
    const [loading, setLoading] = useState(false);

    const [showAddModal, setShowAddModal] = useState(false);
    const [expandedNote, setExpandedNote] = useState<string | null>(null);
    const [confirmDeleteType, setConfirmDeleteType] = useState(false);
    const [recordToDelete, setRecordToDelete] = useState<EmployeeStatus | null>(null);
    const [deleting, setDeleting] = useState(false);

    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState<"Vše" | "Platné" | "Neplatné" | "Blíží se expirace" | "0">("Vše");
    const [selectedPns, setSelectedPns] = useState<Set<string>>(new Set());
    const [togglingActive, setTogglingActive] = useState(false);
    const [selectedCostNumbers, setSelectedCostNumbers] = useState<string[]>([]);
    const [isCostFilterOpen, setIsCostFilterOpen] = useState(false);
    const costFilterRef = useRef<HTMLDivElement>(null);

    const loadDetail = () => {
        if (!typeId) return;
        setLoading(true);
        const apiUrl = getApiUrl();
        fetch(`${apiUrl}/medical/types/${encodeURIComponent(typeId)}`)
            .then((res) => res.json())
            .then((data) => {
                if (data.success) {
                    setMedicalType(data.medicalType);
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
        setSelectedPns(new Set());
        if (typeId) {
            loadDetail();
        } else {
            setMedicalType(null);
            setEmployees([]);
        }
    }, [typeId]);

    const togglePn = (pn: string) => {
        setSelectedPns(prev => {
            const next = new Set(prev);
            if (next.has(pn)) next.delete(pn); else next.add(pn);
            return next;
        });
    };

    const handleSetActive = async (isActive: boolean) => {
        const pns = Array.from(selectedPns).filter(Boolean);
        if (pns.length === 0 || !typeId) return;
        setTogglingActive(true);
        try {
            const res = await fetch(`${getApiUrl()}/medical/records/set-active`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ examTypeId: typeId, personalNumbers: pns, isActive }),
            });
            const data = await res.json();
            if (data.success) {
                setSelectedPns(new Set());
                loadDetail();
            }
        } catch (err) {
            console.error("Set active error:", err);
        } finally {
            setTogglingActive(false);
        }
    };

    const handleDeleteType = async () => {
        if (!typeId) return;
        setDeleting(true);
        try {
            const res = await fetch(`${getApiUrl()}/medical/types/${encodeURIComponent(typeId)}`, { method: "DELETE" });
            const data = await res.json();
            if (data.success) {
                setConfirmDeleteType(false);
                onChanged?.();
                onClose();
            }
        } catch (err) {
            console.error("Delete type error:", err);
        } finally {
            setDeleting(false);
        }
    };

    const handleDeleteRecord = async () => {
        if (!typeId || !recordToDelete) return;
        setDeleting(true);
        try {
            const res = await fetch(`${getApiUrl()}/medical/types/${encodeURIComponent(typeId)}/records/${encodeURIComponent(recordToDelete.personalNumber)}`, { method: "DELETE" });
            const data = await res.json();
            if (data.success) {
                setRecordToDelete(null);
                loadDetail();
            }
        } catch (err) {
            console.error("Delete record error:", err);
        } finally {
            setDeleting(false);
        }
    };

    const uniqueCostNumbers = useMemo(() => {
        const seen = new Set<string>();
        const result: { costNumber: string; costNumberDesc: string }[] = [];
        for (const emp of employees) {
            if (emp.costNumber && !seen.has(emp.costNumber)) {
                seen.add(emp.costNumber);
                result.push({ costNumber: emp.costNumber, costNumberDesc: emp.costNumberDesc });
            }
        }
        return result.sort((a, b) => a.costNumber.localeCompare(b.costNumber));
    }, [employees]);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (costFilterRef.current && !costFilterRef.current.contains(e.target as Node)) {
                setIsCostFilterOpen(false);
            }
        }
        if (isCostFilterOpen) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isCostFilterOpen]);

    const filteredEmployees = useMemo(() => {
        let res = employees.filter(emp => emp.validityStatus !== 'Neproškolen');

        if (searchQuery) {
            const s = searchQuery.toLowerCase();
            res = res.filter(emp =>
                emp.firstName.toLowerCase().includes(s) ||
                emp.lastName.toLowerCase().includes(s) ||
                (emp.personalNumber && emp.personalNumber.toLowerCase().includes(s))
            );
        }

        if (filterStatus !== "Vše") {
            res = res.filter(emp => emp.validityStatus === filterStatus);
        }

        if (selectedCostNumbers.length > 0) {
            res = res.filter(emp => selectedCostNumbers.includes(emp.costNumber));
        }

        return res;
    }, [employees, searchQuery, filterStatus, selectedCostNumbers]);

    const handleExportExcel = () => {
        if (filteredEmployees.length === 0) return;

        // Osobní číslo zapíšeme jako číslo (ne text), pokud je to celé číslo.
        const pnValue = (pn: string) => (pn && /^\d+$/.test(pn) ? Number(pn) : pn || '');

        const data = filteredEmployees.map(emp => ({
            'Příjmení a jméno': `${emp.lastName} ${emp.firstName}`,
            'Osobní číslo': pnValue(emp.personalNumber),
            'Nákladové středisko – číslo': emp.costNumber || '',
            'Nákladové středisko – popis': emp.costNumberDesc || '',
            'Datum absolvování': emp.completionDate ? new Date(emp.completionDate).toLocaleDateString('cs-CZ') : '',
            'Datum platnosti': emp.expirationDate ? new Date(emp.expirationDate).toLocaleDateString('cs-CZ') : '',
            'Lékařské zařízení': medicalType?.medicalFacility || '',
            'Stav': emp.validityStatus === 'superseded' ? '—' : emp.validityStatus
        }));

        const ws = xlsx.utils.json_to_sheet(data);
        const wscols = [
            { wch: 25 },
            { wch: 15 },
            { wch: 24 },
            { wch: 28 },
            { wch: 18 },
            { wch: 18 },
            { wch: 30 },
            { wch: 15 }
        ];
        ws['!cols'] = wscols;

        const wb = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(wb, ws, "Záznamy o prohlídkách");
        
        const fileName = `prohlidky_${medicalType?.name || 'export'}_${new Date().toISOString().split('T')[0]}.xlsx`;
        xlsx.writeFile(wb, fileName);
    };

    if (!typeId) return null;

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
                                    {medicalType?.category}
                                </span>
                                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                                    {medicalType?.name}
                                </h2>
                                <div className="text-blue-200 mt-1 text-sm flex gap-4 font-medium">
                                    <span>Perioda: <strong className="text-white font-semibold">{medicalType?.validityMonths && medicalType.validityMonths > 0 ? `${medicalType.validityMonths} měsíců` : 'Jednorázově'}</strong></span>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setConfirmDeleteType(true)}
                            disabled={loading || !medicalType}
                            className="inline-flex items-center gap-2 rounded-lg bg-red-500/90 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-500 disabled:opacity-50 disabled:pointer-events-none"
                        >
                            <Trash2 size={15} />
                            Smazat
                        </button>
                        <button
                            onClick={onClose}
                            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-sm font-medium text-gray-500 flex items-center gap-2">
                            Seznam zaměstnanců a platnost prohlídek:
                            {!loading && (
                                <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-700/10">
                                    {filteredEmployees.length} {filteredEmployees.length === 1 ? "zaměstnanec" : filteredEmployees.length >= 2 && filteredEmployees.length <= 4 ? "zaměstnanci" : "zaměstnanců"}
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
                                    <option value="0">Neaktivní (0)</option>
                                </select>
                            </div>

                            {/* Cost center multi-select */}
                            <div className="relative" ref={costFilterRef}>
                                <button
                                    onClick={() => setIsCostFilterOpen(v => !v)}
                                    className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-3 text-sm text-gray-900 hover:border-blue-400 focus:outline-none whitespace-nowrap"
                                >
                                    <Building2 size={15} className="text-gray-400 flex-shrink-0" />
                                    <span>Nákl. středisko</span>
                                    {selectedCostNumbers.length > 0 && (
                                        <span className="inline-flex items-center justify-center rounded-full bg-blue-600 text-white text-[10px] font-bold min-w-[16px] h-4 px-1">
                                            {selectedCostNumbers.length}
                                        </span>
                                    )}
                                    <ChevronDown size={14} className={`text-gray-400 transition-transform flex-shrink-0 ${isCostFilterOpen ? "rotate-180" : ""}`} />
                                </button>

                                {isCostFilterOpen && (
                                    <div className="absolute top-full mt-1 right-0 z-50 w-72 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
                                        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gray-50">
                                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Filtr střediska</span>
                                            {selectedCostNumbers.length > 0 && (
                                                <button
                                                    onClick={() => setSelectedCostNumbers([])}
                                                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                                >
                                                    Zrušit výběr
                                                </button>
                                            )}
                                        </div>
                                        {uniqueCostNumbers.length === 0 ? (
                                            <p className="px-3 py-4 text-xs text-gray-400 text-center">Žádná data</p>
                                        ) : (
                                            <div className="max-h-60 overflow-y-auto">
                                                {uniqueCostNumbers.map(({ costNumber, costNumberDesc }) => (
                                                    <label
                                                        key={costNumber}
                                                        className="flex items-center gap-3 px-3 py-2.5 hover:bg-blue-50/50 cursor-pointer"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedCostNumbers.includes(costNumber)}
                                                            onChange={e => {
                                                                setSelectedCostNumbers(prev =>
                                                                    e.target.checked
                                                                        ? [...prev, costNumber]
                                                                        : prev.filter(c => c !== costNumber)
                                                                );
                                                            }}
                                                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0"
                                                        />
                                                        <div className="min-w-0">
                                                            <div className="text-sm font-semibold text-gray-900">{costNumber}</div>
                                                            {costNumberDesc && (
                                                                <div className="text-xs text-gray-500 truncate">{costNumberDesc}</div>
                                                            )}
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Hromadná akce: aktivace / deaktivace vybraných */}
                    {!loading && selectedPns.size > 0 && (
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5">
                            <span className="text-sm font-medium text-blue-800">
                                Vybráno {selectedPns.size} {selectedPns.size === 1 ? "zaměstnanec" : selectedPns.size <= 4 ? "zaměstnanci" : "zaměstnanců"}
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleSetActive(true)}
                                    disabled={togglingActive}
                                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
                                >
                                    <CheckCircle size={15} />
                                    Nastavit aktivní
                                </button>
                                <button
                                    onClick={() => handleSetActive(false)}
                                    disabled={togglingActive}
                                    className="inline-flex items-center gap-2 rounded-lg bg-gray-600 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-700 active:scale-95 disabled:opacity-50"
                                >
                                    Deaktivovat (0)
                                </button>
                                <button
                                    onClick={() => setSelectedPns(new Set())}
                                    disabled={togglingActive}
                                    className="rounded-lg px-2.5 py-2 text-sm font-medium text-gray-500 transition-colors hover:text-gray-700 disabled:opacity-50"
                                >
                                    Zrušit výběr
                                </button>
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
                            <table className="w-full text-left border-collapse min-w-[900px]">
                                <thead>
                                    <tr className="border-b border-gray-200 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        <th className="px-4 py-4 w-10">
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                checked={filteredEmployees.length > 0 && filteredEmployees.every(e => selectedPns.has(e.personalNumber))}
                                                ref={el => { if (el) el.indeterminate = filteredEmployees.some(e => selectedPns.has(e.personalNumber)) && !filteredEmployees.every(e => selectedPns.has(e.personalNumber)); }}
                                                onChange={(e) => {
                                                    const pns = filteredEmployees.map(emp => emp.personalNumber).filter(Boolean);
                                                    setSelectedPns(prev => {
                                                        const next = new Set(prev);
                                                        if (e.target.checked) pns.forEach(pn => next.add(pn));
                                                        else pns.forEach(pn => next.delete(pn));
                                                        return next;
                                                    });
                                                }}
                                            />
                                        </th>
                                        <th className="px-4 py-4">Zaměstnanec</th>
                                        <th className="px-4 py-4">Nákladové středisko</th>
                                        <th className="px-4 py-4">Nákl. středisko popis</th>
                                        <th className="px-4 py-4">Absolvováno</th>
                                        <th className="px-4 py-4">Platnost do</th>
                                        <th className="px-4 py-4">Poznámka</th>
                                        <th className="px-4 py-4 text-right">Status</th>
                                        <th className="px-4 py-4 text-right">Akce</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredEmployees.map((emp) => (
                                        <tr key={emp.personalNumber} className={`transition-colors hover:bg-blue-50/40 ${selectedPns.has(emp.personalNumber) ? "bg-blue-50/60" : ""}`}>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    checked={selectedPns.has(emp.personalNumber)}
                                                    disabled={!emp.personalNumber}
                                                    onChange={() => togglePn(emp.personalNumber)}
                                                />
                                            </td>
                                            <td className="px-4 py-3">
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
                                                        </div>
                                                    </div>
                                                </div>
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
                                            <td className="px-4 py-3 text-sm text-gray-600 max-w-[180px]">
                                                {emp.notes ? (
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="truncate">{emp.notes.length > 40 ? emp.notes.slice(0, 40) + "…" : emp.notes}</span>
                                                        {emp.notes.length > 40 && (
                                                            <button
                                                                onClick={() => setExpandedNote(emp.notes)}
                                                                className="flex-shrink-0 text-blue-500 hover:text-blue-700 text-xs font-semibold underline"
                                                            >
                                                                více
                                                            </button>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-300">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <StatusBadge status={emp.validityStatus} />
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    onClick={() => setRecordToDelete(emp)}
                                                    title="Smazat záznam zaměstnance"
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredEmployees.length === 0 && (
                                        <tr>
                                            <td colSpan={9} className="py-12 text-center text-sm text-gray-400">
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

            {/* Popup pro celou poznámku */}
            {expandedNote && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setExpandedNote(null)}>
                    <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Poznámka</h3>
                            <button onClick={() => setExpandedNote(null)} className="text-gray-400 hover:text-gray-600">
                                <X size={18} />
                            </button>
                        </div>
                        <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{expandedNote}</p>
                    </div>
                </div>
            )}

            {/* Vnořený Modal */}
            {showAddModal && (
                <AddMedicalModal
                    employees={allEmployees}
                    defaultTypeId={typeId}
                    defaultTypeName={medicalType?.name}
                    onClose={() => setShowAddModal(false)}
                    onSuccess={() => {
                        setShowAddModal(false);
                        loadDetail();
                    }}
                />
            )}

            {confirmDeleteType && (
                <ConfirmDeleteModal
                    title="Smazat celou prohlídku?"
                    message={
                        <>
                            Opravdu chcete smazat prohlídku <strong>{medicalType?.name}</strong> z katalogu?
                            Smažou se i všechny záznamy zaměstnanců s touto prohlídkou.
                        </>
                    }
                    confirmLabel="Smazat prohlídku"
                    loading={deleting}
                    onConfirm={handleDeleteType}
                    onCancel={() => setConfirmDeleteType(false)}
                />
            )}

            {recordToDelete && (
                <ConfirmDeleteModal
                    title="Smazat záznam zaměstnance?"
                    message={
                        <>
                            Opravdu smazat záznam o této prohlídce u <strong>{recordToDelete.firstName} {recordToDelete.lastName}</strong>
                            {recordToDelete.personalNumber ? ` (${recordToDelete.personalNumber})` : ""}?
                        </>
                    }
                    confirmLabel="Smazat záznam"
                    loading={deleting}
                    onConfirm={handleDeleteRecord}
                    onCancel={() => setRecordToDelete(null)}
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
    // Starší perioda téže prohlídky, nahrazená novějším záznamem jiné periody → jen pomlčka.
    if (status === 'superseded') {
        return <span className="text-gray-300" title="Nahrazeno novější prohlídkou (jiná perioda)">—</span>;
    }
    // Deaktivovaná prohlídka (LegacyIsActive = 0) – absolvovaná, ale neaktivní → "0".
    if (status === '0') {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/20">
                0
            </span>
        );
    }
    return null;
}
