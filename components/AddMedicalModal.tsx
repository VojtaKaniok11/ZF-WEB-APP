"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Search, Check, UserCheck, Loader2 } from "lucide-react";
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
    onClose: () => void;
    onSuccess: () => void;
}

export default function AddMedicalModal({ employees, onClose, onSuccess }: AddMedicalModalProps) {
    const router = useRouter();

    const [examTypes, setExamTypes] = useState<ExamType[]>([]);

    // Form fields
    const [examTypeName, setExamTypeName] = useState("");
    const [examDate, setExamDate] = useState("");
    const [nextExamDate, setNextExamDate] = useState("");
    const [doctorName, setDoctorName] = useState("");
    const [result, setResult] = useState<typeof RESULTS[number]>("Způsobilý");
    const [notes, setNotes] = useState("");

    // Employee selection
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<Set<string>>(new Set());

    // Errors
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitted, setSubmitted] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

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
            // Try to find the period by exact name match
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

    const filtered = useMemo(() => {
        if (!search.trim()) return employees;
        const s = search.toLowerCase();
        return employees.filter(
            (e) =>
                e.firstName.toLowerCase().includes(s) ||
                e.lastName.toLowerCase().includes(s) ||
                e.personalNumber.toLowerCase().includes(s) ||
                e.department.toLowerCase().includes(s)
        );
    }, [employees, search]);

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

    function validate() {
        const e: Record<string, string> = {};
        if (!examTypeName.trim()) e.examTypeName = "Druh prohlídky je povinný.";
        if (!examDate) e.examDate = "Datum vyšetření je povinné.";
        if (!doctorName.trim()) e.doctorName = "Jméno lékaře nebo klinika je povinné.";
        if (selected.size === 0) e.employees = "Vyberte alespoň jednoho zaměstnance.";
        return e;
    }

    async function handleSubmit() {
        const e = validate();
        setErrors(e);
        if (Object.keys(e).length > 0) return;

        // Try to identify if the typed name matches a known ID
        const matchedType = examTypes.find(t => t.name === examTypeName || t.id === examTypeName);

        const input = {
            examTypeName: examTypeName.trim(),
            examTypeId: matchedType?.id || null, // Send id if we matched, else null (backend will handle creating)
            examDate,
            nextExamDate,
            doctorName: doctorName.trim(),
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
            <div className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col">
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
                    {/* Error display */}
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
                                {/* Druh prohlídky - Volné psaní s nápovědou */}
                                <div className="sm:col-span-2">
                                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                                        Druh prohlídky <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        list="exam-types-list"
                                        value={examTypeName}
                                        onChange={(e) => setExamTypeName(e.target.value)}
                                        placeholder="Vyberte ze seznamu nebo napište vlastní typ..."
                                        className={`w-full rounded-xl border px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${errors.examTypeName ? "border-red-400 bg-red-50" : "border-gray-300 bg-gray-50 focus:border-blue-500 focus:bg-white"}`}
                                    />
                                    <datalist id="exam-types-list">
                                        {examTypes.map((t) => (
                                            <option key={t.id} value={t.name} />
                                        ))}
                                    </datalist>
                                    {errors.examTypeName && <p className="mt-1 text-xs text-red-500">{errors.examTypeName}</p>}
                                </div>

                                {/* Doktor/Klinika */}
                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                                        Lékař / zdravotní středisko <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={doctorName}
                                        onChange={(e) => setDoctorName(e.target.value)}
                                        placeholder="MUDr. Novák, Městská nemocnice..."
                                        className={`w-full rounded-xl border px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${errors.doctorName ? "border-red-400 bg-red-50" : "border-gray-300 bg-gray-50 focus:border-blue-500 focus:bg-white"}`}
                                    />
                                    {errors.doctorName && <p className="mt-1 text-xs text-red-500">{errors.doctorName}</p>}
                                </div>

                                {/* Výsledek */}
                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">Výsledek vyšetření</label>
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
                                        Ukončení platnosti (Expirace)
                                    </label>
                                    <input
                                        type="date"
                                        value={nextExamDate}
                                        onChange={(e) => setNextExamDate(e.target.value)}
                                        className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    />
                                    <p className="mt-1 text-[11px] text-gray-500">Auto-kalkulace na základě druhu (pokud má periodu)</p>
                                </div>

                                {/* Poznámka */}
                                <div className="sm:col-span-2">
                                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">Poznámka (nepovinné)</label>
                                    <input
                                        type="text"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Případná omezení a dieta..."
                                        className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    />
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
                                            {allFilteredSelected ? "Odznačit zobrazené" : "Vybrat zobrazené"}
                                        </button>
                                    )}
                                </div>

                                <div className="relative mb-3">
                                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Filtrovat podle jména, příjmení, os. čísla nebo oddělení..."
                                        className="w-full rounded-xl border border-gray-300 bg-gray-50 py-2.5 pl-9 pr-4 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    />
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
                                                                    {emp.personalNumber} · {emp.department}
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
