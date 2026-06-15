"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { X, Search, Check, UserCheck, Loader2, ChevronDown, Building2 } from "lucide-react";
import { Employee } from "@/types/employee";
import { getApiUrl } from "@/lib/constants";

const RESULTS = ["Způsobilý", "Nezpůsobilý", "Způsobilý s podmínkou"] as const;

interface ExamType {
    id: string;
    name: string;
    validityMonths: number;
    category: string;
    description: string | null;
}

interface AddMedicalModalProps {
    employees: Employee[];
    defaultTypeId?: string | null;
    defaultTypeName?: string;
    onClose: () => void;
    onSuccess: () => void;
}

export default function AddMedicalModal({ employees, defaultTypeId, defaultTypeName, onClose, onSuccess }: AddMedicalModalProps) {
    const router = useRouter();

    const [examTypes, setExamTypes] = useState<ExamType[]>([]);

    // Form fields
    const [examTypeName, setExamTypeName] = useState(defaultTypeName || "");
    const [isOtherType, setIsOtherType] = useState(false);
    const [examDate, setExamDate] = useState("");
    const [nextExamDate, setNextExamDate] = useState("");
    const [result, setResult] = useState<typeof RESULTS[number]>("Způsobilý");
    const [notes, setNotes] = useState("");

    // Employee selection
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<Set<string>>(new Set());

    // Cost center filter
    const [selectedCostNumbers, setSelectedCostNumbers] = useState<Set<string>>(new Set());
    const [isCostDropdownOpen, setIsCostDropdownOpen] = useState(false);
    const costDropdownRef = useRef<HTMLDivElement>(null);

    // Errors
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitted, setSubmitted] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Close cost dropdown on outside click
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (costDropdownRef.current && !costDropdownRef.current.contains(e.target as Node)) {
                setIsCostDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Effect to check if defaultTypeName is "other" or not in list
    useEffect(() => {
        if (defaultTypeName && examTypes.length > 0) {
            const exists = examTypes.some(t => t.name === defaultTypeName);
            if (!exists && defaultTypeName !== "") {
                setIsOtherType(true);
            }
        }
    }, [defaultTypeName, examTypes]);

    useEffect(() => {
        const apiUrl = getApiUrl();
        fetch(`${apiUrl}/medical-types`)
            .then(res => res.json())
            .then(json => {
                if (json.success) {
                    setExamTypes(json.data);
                }
            })
            .catch(() => { });
    }, []);

    // Auto-calculate next exam date
    useEffect(() => {
        if (examDate && examTypeName) {
            const type = examTypes.find(t => t.name === examTypeName || t.id === examTypeName);
            if (type && type.validityMonths > 0) {
                const date = new Date(examDate);
                date.setMonth(date.getMonth() + type.validityMonths);
                setNextExamDate(date.toISOString().split("T")[0]);
            } else {
                setNextExamDate("");
            }
        }
    }, [examDate, examTypeName, examTypes]);

    // Unique cost centers sorted by number
    const costCenters = useMemo(() => {
        const map = new Map<string, string>();
        employees.forEach(e => {
            if (e.costNumber && !map.has(e.costNumber)) {
                map.set(e.costNumber, e.costNumberDesc || "");
            }
        });
        return Array.from(map.entries())
            .map(([number, desc]) => ({ number, desc }))
            .sort((a, b) => a.number.localeCompare(b.number));
    }, [employees]);

    const filtered = useMemo(() => {
        let res = employees;

        if (selectedCostNumbers.size > 0) {
            res = res.filter(e => selectedCostNumbers.has(e.costNumber));
        }

        if (search.trim()) {
            const s = search.toLowerCase();
            res = res.filter(
                (e) =>
                    e.firstName.toLowerCase().includes(s) ||
                    e.lastName.toLowerCase().includes(s) ||
                    e.personalNumber.toLowerCase().includes(s) ||
                    e.department.toLowerCase().includes(s)
            );
        }

        return res;
    }, [employees, search, selectedCostNumbers]);

    function toggleEmployee(pn: string) {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(pn)) next.delete(pn);
            else next.add(pn);
            return next;
        });
    }

    function toggleAll() {
        if (filtered.every((e) => selected.has(e.personalNumber))) {
            setSelected((prev) => {
                const next = new Set(prev);
                filtered.forEach((e) => next.delete(e.personalNumber));
                return next;
            });
        } else {
            setSelected((prev) => {
                const next = new Set(prev);
                filtered.forEach((e) => next.add(e.personalNumber));
                return next;
            });
        }
    }

    function toggleCostNumber(cn: string) {
        setSelectedCostNumbers(prev => {
            const next = new Set(prev);
            if (next.has(cn)) next.delete(cn);
            else next.add(cn);
            return next;
        });
    }

    function validate() {
        const e: Record<string, string> = {};
        if (!examTypeName.trim()) e.examTypeName = "Druh prohlídky je povinný.";
        if (!examDate) e.examDate = "Datum vyšetření je povinné.";
        if (!nextExamDate) e.nextExamDate = "Datum expirace je povinné.";
        if (result === "Způsobilý s podmínkou" && !notes.trim()) {
            e.notes = "Při způsobilosti s podmínkou je poznámka povinná.";
        }
        if (selected.size === 0) e.employees = "Vyberte alespoň jednoho zaměstnance.";
        return e;
    }

    async function handleSubmit() {
        const e = validate();
        setErrors(e);
        if (Object.keys(e).length > 0) return;

        const matchedType = examTypes.find(t => t.name === examTypeName || t.id === examTypeName);

        const input = {
            examTypeName: examTypeName.trim(),
            examTypeId: matchedType?.id || null,
            examDate,
            nextExamDate,
            result,
            notes: notes.trim(),
            attendeePersonalNumbers: Array.from(selected),
        };

        setIsSaving(true);
        const apiUrl = getApiUrl();
        try {
            const res = await fetch(`${apiUrl}/medical`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(input),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Při ukládání došlo k chybě.");

            router.refresh();
            window.dispatchEvent(new Event("medical-added"));
            setSubmitted(true);
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 1200);
        } catch (err: any) {
            setErrors({ submit: err.message || "Něco se pokazilo. Zkuste to znovu." });
        } finally {
            setIsSaving(false);
        }
    }

    const allFilteredSelected = filtered.length > 0 && filtered.every((e) => selected.has(e.personalNumber));

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div
                className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200" style={{ background: "linear-gradient(135deg, #0054A6 0%, #003d7a 100%)" }}>
                    <div>
                        <h2 className="text-lg font-bold text-white">Přidat lékařskou prohlídku</h2>
                        <p className="text-sm text-blue-200 mt-0.5">Zadejte vyšetření pro vybrané zaměstnance</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
                    {errors.submit && (
                        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                            {errors.submit}
                        </div>
                    )}

                    {submitted && (
                        <div className="flex flex-col items-center justify-center py-10 gap-3">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                                <Check size={32} className="text-emerald-600" />
                            </div>
                            <p className="text-base font-semibold text-gray-900">Prohlídka byla úspěšně přidána!</p>
                            <p className="text-sm text-gray-500">Záznam byl uložen pro {selected.size} zaměstnanc{selected.size === 1 ? "e" : "ů"}.</p>
                        </div>
                    )}

                    {!submitted && (
                        <>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                {/* Druh prohlídky */}
                                <div className="sm:col-span-2">
                                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                                        Druh prohlídky <span className="text-red-500">*</span>
                                    </label>
                                    <div className="space-y-3">
                                        <select
                                            value={isOtherType ? "other" : examTypeName}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (val === "other") {
                                                    setIsOtherType(true);
                                                    setExamTypeName("");
                                                } else {
                                                    setIsOtherType(false);
                                                    setExamTypeName(val);
                                                }
                                            }}
                                            className={`w-full rounded-xl border px-4 py-2.5 text-sm text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${errors.examTypeName ? "border-red-400 bg-red-50" : "border-gray-300 bg-gray-50 focus:border-blue-500 focus:bg-white"}`}
                                        >
                                            <option value="" disabled>Vyberte druh prohlídky...</option>
                                            {examTypes.map((t) => (
                                                <option key={t.id} value={t.name}>{t.name}</option>
                                            ))}
                                            <option value="other">Jiné (vypsat vlastní)...</option>
                                        </select>

                                        {isOtherType && (
                                            <input
                                                type="text"
                                                value={examTypeName}
                                                onChange={(e) => setExamTypeName(e.target.value)}
                                                placeholder="Napište vlastní druh prohlídky..."
                                                className={`w-full rounded-xl border px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-colors animate-in fade-in slide-in-from-top-1 duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${errors.examTypeName ? "border-red-400 bg-red-50" : "border-gray-300 bg-gray-50 focus:border-blue-500 focus:bg-white"}`}
                                            />
                                        )}
                                    </div>
                                    {errors.examTypeName && <p className="mt-1 text-xs text-red-500">{errors.examTypeName}</p>}
                                </div>

                                {/* Výsledek */}
                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                                        Výsledek vyšetření <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={result}
                                        onChange={(e) => setResult(e.target.value as typeof RESULTS[number])}
                                        className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    >
                                        {RESULTS.map((r) => (
                                            <option key={r} value={r}>{r}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Datum vyšetření */}
                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                                        Datum vyšetření <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={examDate}
                                        onChange={(e) => setExamDate(e.target.value)}
                                        className={`w-full rounded-xl border px-4 py-2.5 text-sm text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${errors.examDate ? "border-red-400 bg-red-50" : "border-gray-300 bg-gray-50 focus:border-blue-500 focus:bg-white"}`}
                                    />
                                    {errors.examDate && <p className="mt-1 text-xs text-red-500">{errors.examDate}</p>}
                                </div>

                                {/* Datum expirace */}
                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                                        Ukončení platnosti (Expirace) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={nextExamDate}
                                        onChange={(e) => setNextExamDate(e.target.value)}
                                        className={`w-full rounded-xl border px-4 py-2.5 text-sm text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${errors.nextExamDate ? "border-red-400 bg-red-50" : "border-gray-300 bg-gray-50 focus:border-blue-500 focus:bg-white"}`}
                                    />
                                    {errors.nextExamDate && <p className="mt-1 text-xs text-red-500">{errors.nextExamDate}</p>}
                                    <p className="mt-1 text-[11px] text-gray-500">Auto-kalkulace na základě druhu (pokud má periodu)</p>
                                </div>

                                {/* Poznámka */}
                                <div className="sm:col-span-2">
                                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                                        Poznámka <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder={result === "Způsobilý s podmínkou" ? "Uveďte konkrétní podmínky způsobilosti..." : "Případná omezení a dieta..."}
                                        className={`w-full rounded-xl border px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${errors.notes ? "border-red-400 bg-red-50" : "border-gray-300 bg-gray-50 focus:border-blue-500 focus:bg-white"}`}
                                    />
                                    {errors.notes && <p className="mt-1 text-xs text-red-500">{errors.notes}</p>}
                                </div>
                            </div>

                            {/* Employee selector */}
                            <div>
                                <div className="mb-2 flex items-center justify-between">
                                    <label className="text-sm font-semibold text-gray-700">
                                        Prohlídku absolvovali <span className="text-red-500">*</span>
                                        {selected.size > 0 && (
                                            <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-blue-700/10">
                                                <UserCheck size={11} /> {selected.size} vybráno
                                            </span>
                                        )}
                                    </label>
                                    {filtered.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={toggleAll}
                                            className="text-xs font-medium text-blue-600 hover:underline"
                                        >
                                            {allFilteredSelected ? "Odznačit vše" : "Vybrat vše"}
                                        </button>
                                    )}
                                </div>

                                {/* Filters row */}
                                <div className="flex gap-2 mb-3">
                                    {/* Search */}
                                    <div className="relative flex-1">
                                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            placeholder="Jméno, příjmení, os. číslo..."
                                            className="w-full rounded-xl border border-gray-300 bg-gray-50 py-2.5 pl-9 pr-4 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        />
                                    </div>

                                    {/* Cost center dropdown */}
                                    <div className="relative shrink-0" ref={costDropdownRef}>
                                        <button
                                            type="button"
                                            onClick={() => setIsCostDropdownOpen(v => !v)}
                                            className={`flex items-center gap-2 rounded-xl border py-2.5 pl-3 pr-2.5 text-sm transition-colors focus:outline-none ${selectedCostNumbers.size > 0 ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-300 bg-gray-50 text-gray-700 hover:bg-white"}`}
                                        >
                                            <Building2 size={14} className="shrink-0" />
                                            <span>
                                                {selectedCostNumbers.size > 0
                                                    ? `NS: ${Array.from(selectedCostNumbers).join(", ")}`
                                                    : "Nákladové středisko"}
                                            </span>
                                            <ChevronDown size={13} className={`shrink-0 transition-transform ${isCostDropdownOpen ? "rotate-180" : ""}`} />
                                        </button>

                                        {isCostDropdownOpen && (
                                            <div className="absolute right-0 top-full z-10 mt-1 w-72 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
                                                {selectedCostNumbers.size > 0 && (
                                                    <div className="border-b border-gray-100 px-3 py-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedCostNumbers(new Set())}
                                                            className="text-xs font-medium text-red-500 hover:underline"
                                                        >
                                                            Zrušit výběr středisek
                                                        </button>
                                                    </div>
                                                )}
                                                <div className="max-h-52 overflow-y-auto py-1">
                                                    {costCenters.map(({ number, desc }) => {
                                                        const isChecked = selectedCostNumbers.has(number);
                                                        return (
                                                            <button
                                                                key={number}
                                                                type="button"
                                                                onClick={() => toggleCostNumber(number)}
                                                                className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors"
                                                            >
                                                                <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all ${isChecked ? "border-blue-600 bg-blue-600" : "border-gray-300 bg-white"}`}>
                                                                    {isChecked && <Check size={10} strokeWidth={3} className="text-white" />}
                                                                </span>
                                                                <span className="font-semibold text-gray-800 shrink-0">{number}</span>
                                                                {desc && <span className="text-gray-500 truncate">{desc}</span>}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className={`overflow-y-auto rounded-xl border ${errors.employees ? "border-red-400" : "border-gray-200"} bg-white`} style={{ maxHeight: "200px" }}>
                                    {filtered.length === 0 ? (
                                        <div className="flex items-center justify-center py-10 text-sm text-gray-400">
                                            Žádný zaměstnanec nenalezen.
                                        </div>
                                    ) : (
                                        <ul className="divide-y divide-gray-100">
                                            {filtered.map((emp) => {
                                                const isSelected = selected.has(emp.personalNumber);
                                                return (
                                                    <li key={emp.id}>
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleEmployee(emp.personalNumber)}
                                                            className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${isSelected ? "bg-blue-50/70" : "hover:bg-gray-50"}`}
                                                        >
                                                            <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border transition-all ${isSelected ? "border-blue-600 bg-blue-600" : "border-gray-300 bg-white"}`}>
                                                                {isSelected && <Check size={12} strokeWidth={3} className="text-white" />}
                                                            </span>
                                                            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-blue-200 text-xs font-bold text-blue-700">
                                                                {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
                                                            </span>
                                                            <span className="flex-1 min-w-0">
                                                                <span className="block text-sm font-medium text-gray-900 truncate">
                                                                    {emp.firstName} {emp.lastName}
                                                                </span>
                                                                <span className="block text-xs text-gray-500 truncate">
                                                                    {emp.personalNumber} · {emp.costNumber}{emp.costNumberDesc ? ` – ${emp.costNumberDesc}` : ""}
                                                                </span>
                                                            </span>
                                                        </button>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    )}
                                </div>
                                {errors.employees && <p className="mt-1 text-xs text-red-500">{errors.employees}</p>}
                            </div>
                        </>
                    )}
                </div>

                {!submitted && (
                    <div className="flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                        >
                            Zrušit
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isSaving}
                            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                            style={{ backgroundColor: "#0054A6" }}
                        >
                            {isSaving && <Loader2 size={15} className="animate-spin" />}
                            {isSaving ? "Ukládám..." : "Uložit prohlídku"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
