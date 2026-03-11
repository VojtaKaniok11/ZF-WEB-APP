"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { X, Search, Check, Loader2 } from "lucide-react";

interface EmployeeMin {
    employeeId: number;
    firstName: string;
    lastName: string;
    personalNumber: string;
    department: string;
}

interface Props {
    trainingId: number;
    periodicityMonths: number;
    employees: EmployeeMin[];
    onClose: () => void;
    onSaved: () => void;
}

export default function AddTrainingRecordModalV2({ trainingId, periodicityMonths, employees, onClose, onSaved }: Props) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedEmps, setSelectedEmps] = useState<EmployeeMin[]>([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Default to today
    const [completionDate, setCompletionDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [isLegalOrExternal, setIsLegalOrExternal] = useState(false);

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const wrapperRef = useRef<HTMLDivElement>(null);

    const filteredEmployees = useMemo(() => {
        if (!searchQuery.trim()) return employees;
        const s = searchQuery.toLowerCase();
        return employees.filter(emp => {
            const full = `${emp.lastName} ${emp.firstName} ${emp.personalNumber}`.toLowerCase();
            return full.includes(s);
        });
    }, [employees, searchQuery]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSave = async () => {
        if (selectedEmps.length === 0) {
            setError("Musíte vybrat alespoň jednoho zaměstnance.");
            return;
        }
        if (!completionDate) {
            setError("Zadejte datum absolvování.");
            return;
        }

        setSaving(true);
        setError("");

        try {
            const res = await fetch("/api/trainings-v2/records", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    employeeIds: selectedEmps.map(e => e.employeeId),
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

                <div className="p-6 space-y-6">
                    {error && (
                        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                            {error}
                        </div>
                    )}

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
                                                            const isSelected = selectedEmps.some(e => e.employeeId === emp.employeeId);
                                                            if (isSelected) {
                                                                setSelectedEmps(prev => prev.filter(e => e.employeeId !== emp.employeeId));
                                                            } else {
                                                                setSelectedEmps(prev => [...prev, emp]);
                                                            }
                                                            setSearchQuery("");
                                                        }}
                                                        className={`w-full text-left flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50 ${(selectedEmps.some(e => e.employeeId === emp.employeeId)) ? 'bg-blue-50/70' : ''}`}
                                                    >
                                                        <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border transition-all ${(selectedEmps.some(e => e.employeeId === emp.employeeId)) ? "border-blue-600 bg-blue-600" : "border-gray-300 bg-white"}`}>
                                                            {(selectedEmps.some(e => e.employeeId === emp.employeeId)) && <Check size={12} strokeWidth={3} className="text-white" />}
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
                                </div>
                            )}
                        </div>

                        {/* Selected Employees Chips */}
                        {selectedEmps.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                                {selectedEmps.map(emp => (
                                    <span key={emp.employeeId} className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                        {emp.firstName} {emp.lastName}
                                        <button 
                                            type="button" 
                                            onClick={() => setSelectedEmps(prev => prev.filter(e => e.employeeId !== emp.employeeId))}
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

                    {/* Legal/External Switch */}
                    <div className="relative z-30 pt-2">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative flex items-center justify-center">
                                <input
                                    type="checkbox"
                                    checked={isLegalOrExternal}
                                    onChange={(e) => setIsLegalOrExternal(e.target.checked)}
                                    className="peer sr-only"
                                />
                                <div className="h-6 w-11 rounded-full bg-gray-200 transition-colors peer-checked:bg-blue-600 peer-focus:ring-2 peer-focus:ring-blue-500/30"></div>
                                <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5"></div>
                            </div>
                            <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">
                                Zákonné / Externí školení
                            </span>
                        </label>
                        <p className="mt-1.5 pl-14 text-xs text-gray-500">
                            Zaškrtnutím označíte, že je toto školení vyžadováno zákonem, nebo probíhá přes externí subjekt.
                        </p>
                    </div>

                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4 rounded-b-2xl">
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
                        style={{ backgroundColor: "#0054A6" }}
                    >
                        {saving && <Loader2 size={15} className="animate-spin" />}
                        {saving ? 'Ukládání...' : 'Uložit záznam'}
                    </button>
                </div>
            </div>
        </div>
    );
}
