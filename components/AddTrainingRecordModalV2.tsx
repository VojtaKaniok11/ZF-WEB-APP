"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { X, Search, Check, Loader2, Building2 } from "lucide-react";
import { getApiUrl } from "@/lib/constants";

interface EmployeeMin {
    employeeId: number;
    firstName: string;
    lastName: string;
    personalNumber: string;
    department: string;
    workcenter: string;
    hasCompleted?: boolean;
    expirationDate?: string | null;
}

interface Props {
    trainingId: number;
    periodicityMonths: number;
    isLegalOrExternal: boolean;
    employees: EmployeeMin[];
    onClose: () => void;
    onSaved: () => void;
}

export default function AddTrainingRecordModalV2({ trainingId, periodicityMonths, isLegalOrExternal, employees, onClose, onSaved }: Props) {
    const [loadedEmployees, setLoadedEmployees] = useState<EmployeeMin[]>(employees);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedWorkcenters, setSelectedWorkcenters] = useState<Set<string>>(new Set());
    const [workcenterSearch, setWorkcenterSearch] = useState("");
    const [selectedEmps, setSelectedEmps] = useState<EmployeeMin[]>([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isWorkcenterDropdownOpen, setIsWorkcenterDropdownOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    const [completionDate, setCompletionDate] = useState(() => new Date().toISOString().split('T')[0]);

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [showOverwriteWarning, setShowOverwriteWarning] = useState(false);
    const [warningEmployees, setWarningEmployees] = useState<EmployeeMin[]>([]);

    const wrapperRef = useRef<HTMLDivElement>(null);
    const workcenterWrapperRef = useRef<HTMLDivElement>(null);

    const workcenters = useMemo(() => {
        const wcs = new Set(loadedEmployees.map(e => e.workcenter).filter(Boolean));
        return Array.from(wcs).sort();
    }, [loadedEmployees]);

    const filteredWorkcenters = useMemo(() => {
        if (!workcenterSearch.trim()) return workcenters;
        const s = workcenterSearch.toLowerCase();
        return workcenters.filter(wc => wc.toLowerCase().includes(s));
    }, [workcenters, workcenterSearch]);

    const filteredEmployees = useMemo(() => {
        let result = loadedEmployees;

        if (selectedWorkcenters.size > 0) {
            result = result.filter(e => selectedWorkcenters.has(e.workcenter));
        }

        if (searchQuery.trim()) {
            const s = searchQuery.toLowerCase();
            result = result.filter(emp => {
                const full = `${emp.lastName} ${emp.firstName} ${emp.personalNumber}`.toLowerCase();
                return full.includes(s);
            });
        }

        return result;
    }, [loadedEmployees, searchQuery, selectedWorkcenters]);

    const allFilteredSelected = filteredEmployees.length > 0 &&
        filteredEmployees.every(e => selectedEmps.some(s => s.personalNumber === e.personalNumber));

    useEffect(() => {
        const loadEmployeesByStatus = async () => {
            try {
                setLoading(true);
                const res = await fetch(`${getApiUrl()}/trainings-v2/${trainingId}/employees-for-record`);
                const data = await res.json();
                if (data.success && data.employees) {
                    const mapped = data.employees.map((emp: any) => ({
                        employeeId: emp.employeeId,
                        firstName: emp.firstName,
                        lastName: emp.lastName,
                        personalNumber: emp.personalNumber,
                        department: emp.department,
                        workcenter: emp.workcenter,
                        hasCompleted: emp.hasCompleted,
                        expirationDate: emp.expirationDate ?? null,
                    }));
                    setLoadedEmployees(mapped);
                } else {
                    setLoadedEmployees(employees);
                }
            } catch (err) {
                console.error("Error loading employees by status:", err);
                setLoadedEmployees(employees);
            } finally {
                setLoading(false);
            }
        };

        loadEmployeesByStatus();
    }, [trainingId, employees]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
            if (workcenterWrapperRef.current && !workcenterWrapperRef.current.contains(event.target as Node)) {
                setIsWorkcenterDropdownOpen(false);
                setWorkcenterSearch("");
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleToggleSelectAll = () => {
        if (allFilteredSelected) {
            setSelectedEmps(prev => prev.filter(e => !filteredEmployees.some(f => f.personalNumber === e.personalNumber)));
        } else {
            setSelectedEmps(prev => {
                const toAdd = filteredEmployees.filter(f => !prev.some(e => e.personalNumber === f.personalNumber));
                return [...prev, ...toAdd];
            });
        }
    };

    const handleSave = async () => {
        if (selectedEmps.length === 0) {
            setError("Musíte vybrat alespoň jednoho zaměstnance.");
            return;
        }
        if (!completionDate) {
            setError("Zadejte datum absolvování.");
            return;
        }

        if (!showOverwriteWarning) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const alreadyValid = selectedEmps.filter(emp =>
                emp.hasCompleted && emp.expirationDate && new Date(emp.expirationDate) > today
            );
            if (alreadyValid.length > 0) {
                setWarningEmployees(alreadyValid);
                setShowOverwriteWarning(true);
                return;
            }
        }

        setSaving(true);
        setError("");
        const apiUrl = getApiUrl();

        try {
            const res = await fetch(`${apiUrl}/trainings-v2/records`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    employeeIds: selectedEmps.map(e => e.employeeId).filter(id => id),
                    attendeePersonalNumbers: selectedEmps.map(e => e.personalNumber).filter(pn => pn),
                    trainingId,
                    completionDate,
                    isLegalOrExternal
                })
            });

            const data = await res.json();
            if (data.success) {
                onSaved();
            } else {
                setError(data.message || "Uložení se nezdařilo.");
                setSaving(false);
            }
        } catch (err) {
            console.error(err);
            setError("Nastala chyba při komunikaci se serverem.");
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div
                className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col pointer-events-auto"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200" style={{ background: "linear-gradient(135deg, #0054A6 0%, #003d7a 100%)", borderTopLeftRadius: "1rem", borderTopRightRadius: "1rem" }}>
                    <div>
                        <h2 className="text-lg font-bold text-white">Přidat záznam o školení</h2>
                        <p className="text-sm text-blue-200 mt-0.5">Zvolte zaměstnance a datum absolvování</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    {error && (
                        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                            {error}
                        </div>
                    )}

                    {/* Workcenter Filter */}
                    <div ref={workcenterWrapperRef} className="relative">
                        <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                            Nákladové středisko
                        </label>
                        <button
                            type="button"
                            onClick={() => setIsWorkcenterDropdownOpen(!isWorkcenterDropdownOpen)}
                            className="w-full rounded-xl border border-gray-300 bg-gray-50 py-2.5 pl-9 pr-4 text-sm text-gray-900 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-left relative"
                        >
                            <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            {selectedWorkcenters.size === 0
                                ? "Všechna střediska"
                                : `Vybráno: ${selectedWorkcenters.size}`}
                        </button>
                        {isWorkcenterDropdownOpen && (
                            <div className="absolute top-full mt-1 left-0 right-0 rounded-xl border border-gray-200 bg-white shadow-lg z-[60] flex flex-col">
                                {/* Search input */}
                                <div className="p-2 border-b border-gray-100">
                                    <div className="relative">
                                        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            autoFocus
                                            placeholder="Hledat středisko..."
                                            value={workcenterSearch}
                                            onChange={e => setWorkcenterSearch(e.target.value)}
                                            onClick={e => e.stopPropagation()}
                                            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-1.5 pl-7 pr-3 text-sm text-gray-900 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400/50"
                                        />
                                    </div>
                                </div>
                                {/* Select All */}
                                {filteredWorkcenters.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const newSet = new Set(selectedWorkcenters);
                                            const allSelected = filteredWorkcenters.every(wc => newSet.has(wc));
                                            if (allSelected) {
                                                filteredWorkcenters.forEach(wc => newSet.delete(wc));
                                            } else {
                                                filteredWorkcenters.forEach(wc => newSet.add(wc));
                                            }
                                            setSelectedWorkcenters(newSet);
                                        }}
                                        className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors text-left border-b border-gray-100"
                                    >
                                        <span className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition-all ${filteredWorkcenters.every(wc => selectedWorkcenters.has(wc)) ? "border-blue-600 bg-blue-600" : "border-gray-300 bg-white"}`}>
                                            {filteredWorkcenters.every(wc => selectedWorkcenters.has(wc)) && <Check size={10} strokeWidth={3} className="text-white" />}
                                        </span>
                                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                            Vybrat vše ({filteredWorkcenters.length})
                                        </span>
                                    </button>
                                )}
                                {/* Scrollable list */}
                                <div className="max-h-44 overflow-y-auto custom-scrollbar">
                                    {filteredWorkcenters.length === 0 ? (
                                        <div className="px-4 py-3 text-sm text-gray-400 text-center">Žádné výsledky</div>
                                    ) : (
                                        filteredWorkcenters.map(wc => (
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
                                                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 transition-colors text-left"
                                            >
                                                <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border transition-all ${selectedWorkcenters.has(wc) ? "border-blue-600 bg-blue-600" : "border-gray-300 bg-white"}`}>
                                                    {selectedWorkcenters.has(wc) && <Check size={12} strokeWidth={3} className="text-white" />}
                                                </span>
                                                <span className="text-sm text-gray-700">{wc}</span>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Employee Typeahead */}
                    <div ref={wrapperRef} className="relative z-50">
                        <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                            Zaměstnanec <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Vyhledat jméno nebo osobní číslo..."
                                className="w-full rounded-xl border border-gray-300 bg-gray-50 py-2.5 pl-9 pr-4 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setIsDropdownOpen(true);
                                }}
                                onFocus={() => setIsDropdownOpen(true)}
                            />

                            {/* Dropdown Options */}
                            {isDropdownOpen && (
                                <div className="absolute top-full mt-1 left-0 right-0 max-h-56 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg z-[60]">
                                    {loading ? (
                                        <div className="p-4 text-center">
                                            <Loader2 size={18} className="inline animate-spin text-blue-500" />
                                        </div>
                                    ) : (
                                        <>
                                            {/* Select All Row */}
                                            {filteredEmployees.length > 0 && (
                                                <div className="sticky top-0 bg-gray-50 border-b border-gray-200">
                                                    <button
                                                        type="button"
                                                        onClick={handleToggleSelectAll}
                                                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 transition-colors"
                                                    >
                                                        <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border transition-all ${allFilteredSelected ? "border-blue-600 bg-blue-600" : "border-gray-300 bg-white"}`}>
                                                            {allFilteredSelected && <Check size={12} strokeWidth={3} className="text-white" />}
                                                        </span>
                                                        <span className="text-xs font-semibold text-gray-600">
                                                            Vybrat vše ({filteredEmployees.length})
                                                        </span>
                                                    </button>
                                                </div>
                                            )}

                                            {filteredEmployees.length === 0 ? (
                                                <div className="p-4 text-center text-sm text-gray-400">
                                                    Nenalezen žádný zaměstnanec.
                                                </div>
                                            ) : (
                                        <ul className="divide-y divide-gray-100">
                                            {filteredEmployees.map(emp => (
                                                <li key={emp.employeeId}>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const isSelected = selectedEmps.some(e => e.personalNumber === emp.personalNumber);
                                                            if (isSelected) {
                                                                setSelectedEmps(prev => prev.filter(e => e.personalNumber !== emp.personalNumber));
                                                            } else {
                                                                setSelectedEmps(prev => [...prev, emp]);
                                                            }
                                                        }}
                                                        className={`w-full text-left flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50 ${selectedEmps.some(e => e.personalNumber === emp.personalNumber) ? 'bg-blue-50/70' : ''}`}
                                                    >
                                                        <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border transition-all ${selectedEmps.some(e => e.personalNumber === emp.personalNumber) ? "border-blue-600 bg-blue-600" : "border-gray-300 bg-white"}`}>
                                                            {selectedEmps.some(e => e.personalNumber === emp.personalNumber) && <Check size={12} strokeWidth={3} className="text-white" />}
                                                        </span>
                                                        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-blue-200 text-xs font-bold text-blue-700">
                                                            {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
                                                        </span>
                                                        <span className="flex-1 min-w-0">
                                                            <span className="block text-sm font-medium text-gray-900 truncate">
                                                                {emp.firstName} {emp.lastName}
                                                            </span>
                                                            <span className="block text-xs text-gray-500 truncate">
                                                                {emp.personalNumber || 'N/A'} · {emp.department}
                                                            </span>
                                                        </span>
                                                    </button>
                                                </li>
                                            ))}
                                            </ul>
                                        )}
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Selected Employees Chips */}
                        {selectedEmps.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                                {selectedEmps.map(emp => (
                                    <span key={emp.employeeId} className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                        {emp.firstName} {emp.lastName}
                                        <button
                                            type="button"
                                            onClick={() => setSelectedEmps(prev => prev.filter(e => e.personalNumber !== emp.personalNumber))}
                                            className="ml-0.5 rounded-full bg-blue-100 p-0.5 text-blue-500 hover:bg-blue-200 hover:text-blue-700 transition-colors"
                                        >
                                            <X size={12} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Date Picker */}
                    <div className="relative z-40">
                        <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                            Datum absolvování <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            value={completionDate}
                            onChange={(e) => setCompletionDate(e.target.value)}
                            max={new Date().toISOString().split("T")[0]}
                            className="w-full rounded-xl border border-gray-300 bg-gray-50 py-2.5 px-4 text-sm text-gray-900 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                        <p className="mt-2 text-xs text-gray-500 leading-relaxed">
                            Platnost tohoto školení je <strong>{periodicityMonths} měsíců</strong>. Systém automaticky vypočítá datum expirace na základě data absolvování.
                        </p>
                    </div>
                </div>

                {/* Overwrite warning */}
                {showOverwriteWarning && (
                    <div className="mx-6 mb-2 rounded-xl border border-amber-200 bg-amber-50 p-4">
                        <p className="text-sm font-semibold text-amber-800 mb-2">
                            Pozor — následující zaměstnanci již mají platné školení:
                        </p>
                        <ul className="text-sm text-amber-700 mb-3 list-disc pl-4 space-y-0.5">
                            {warningEmployees.map(emp => (
                                <li key={emp.personalNumber}>
                                    {emp.firstName} {emp.lastName} ({emp.personalNumber})
                                </li>
                            ))}
                        </ul>
                        <p className="text-sm text-amber-700">
                            Opravdu chcete přepsat jejich záznamy novějším datem absolvování?
                        </p>
                    </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4 rounded-b-2xl">
                    {showOverwriteWarning && (
                        <button
                            onClick={() => { setShowOverwriteWarning(false); setWarningEmployees([]); }}
                            disabled={saving}
                            className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                        >
                            Zpět
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        disabled={saving}
                        className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                    >
                        Zrušit
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                        style={{ backgroundColor: showOverwriteWarning ? "#d97706" : "#0054A6" }}
                    >
                        {saving && <Loader2 size={15} className="animate-spin" />}
                        {saving ? 'Ukládání...' : showOverwriteWarning ? 'Přepsat a uložit' : 'Uložit záznam'}
                    </button>
                </div>
            </div>
        </div>
    );
}
