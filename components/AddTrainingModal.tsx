"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { X, Search, Check, UserCheck, Loader2 } from "lucide-react";
import { Employee } from "@/types/employee";

interface NewTrainingSessionInput {
    trainingName: string;
    category: string;
    completedDate: string;
    expirationDate: string;
    trainerName: string;
    status: "valid" | "expired";
    attendeePersonalNumbers: string[];
}

const CATEGORIES = ["BOZP", "PO", "Odborné", "Vstupní", "Legislativní", "Ostatní"] as const;
const STATUS_OPTIONS = [
    { value: "valid", label: "Platné" },
    { value: "expired", label: "Neplatné" },
] as const;

interface AddTrainingModalProps {
    employees: Employee[];
    onClose: () => void;
    onSuccess: () => void;
}

export default function AddTrainingModal({ employees, onClose, onSuccess }: AddTrainingModalProps) {
    const router = useRouter();
    // Form fields
    const [trainingName, setTrainingName] = useState("");
    const [category, setCategory] = useState<typeof CATEGORIES[number]>("BOZP");
    const [completedDate, setCompletedDate] = useState("");
    const [expirationDate, setExpirationDate] = useState("");
    const [trainerName, setTrainerName] = useState("");
    const [status, setStatus] = useState<"valid" | "expired">("valid");

    // Employee selection
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<Set<string>>(new Set());

    // Errors & loading
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitted, setSubmitted] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

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
            // Odznačit všechny viditelné
            setSelected((prev) => {
                const next = new Set(prev);
                filtered.forEach((e) => next.delete(e.personalNumber));
                return next;
            });
        } else {
            // Zaškrtnout všechny viditelné
            setSelected((prev) => {
                const next = new Set(prev);
                filtered.forEach((e) => next.add(e.personalNumber));
                return next;
            });
        }
    }

    function validate() {
        const e: Record<string, string> = {};
        if (!trainingName.trim()) e.trainingName = "Název školení je povinný.";
        if (!completedDate) e.completedDate = "Datum absolvování je povinné.";
        if (!expirationDate) e.expirationDate = "Datum expirace je povinné.";
        if (!trainerName.trim()) e.trainerName = "Jméno školitele je povinné.";
        if (selected.size === 0) e.employees = "Vyberte alespoň jednoho zaměstnance.";
        return e;
    }

    async function handleSubmit() {
        const e = validate();
        setErrors(e);
        if (Object.keys(e).length > 0) return;

        const input: NewTrainingSessionInput = {
            trainingName: trainingName.trim(),
            category,
            completedDate,
            expirationDate,
            trainerName: trainerName.trim(),
            status,
            attendeePersonalNumbers: Array.from(selected),
        };

        setIsSaving(true);
        try {
            const res = await fetch("/api/trainings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(input),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Chyba při ukládání.");
            router.refresh();
            window.dispatchEvent(new Event("training-added"));
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
        // Backdrop
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200" style={{ background: "linear-gradient(135deg, #0054A6 0%, #003d7a 100%)" }}>
                    <div>
                        <h2 className="text-lg font-bold text-white">Přidat školení</h2>
                        <p className="text-sm text-blue-200 mt-0.5">Vyplňte detaily a vyberte proškolené zaměstnance</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Scrollable body */}
                <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

                    {/* Submit error */}
                    {errors.submit && (
                        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                            {errors.submit}
                        </div>
                    )}

                    {/* Success state */}
                    {submitted && (
                        <div className="flex flex-col items-center justify-center py-10 gap-3">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                                <Check size={32} className="text-emerald-600" />
                            </div>
                            <p className="text-base font-semibold text-gray-900">Školení bylo úspěšně přidáno!</p>
                            <p className="text-sm text-gray-500">Záznam byl uložen pro {selected.size} zaměstnanc{selected.size === 1 ? "e" : "ů"}.</p>
                        </div>
                    )}

                    {!submitted && (
                        <>
                            {/* Form fields */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                {/* Název školení */}
                                <div className="sm:col-span-2">
                                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                                        Název školení <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={trainingName}
                                        onChange={(e) => setTrainingName(e.target.value)}
                                        placeholder="Např. ZF PS Basic, BOZP – Periodické školení..."
                                        className={`w-full rounded-xl border px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${errors.trainingName ? "border-red-400 bg-red-50" : "border-gray-300 bg-gray-50 focus:border-blue-500 focus:bg-white"}`}
                                    />
                                    {errors.trainingName && <p className="mt-1 text-xs text-red-500">{errors.trainingName}</p>}
                                </div>

                                {/* Kategorie */}
                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">Kategorie</label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value as typeof CATEGORIES[number])}
                                        className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    >
                                        {CATEGORIES.map((c) => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Školitel */}
                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                                        Školitel <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={trainerName}
                                        onChange={(e) => setTrainerName(e.target.value)}
                                        placeholder="Jméno školitele"
                                        className={`w-full rounded-xl border px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${errors.trainerName ? "border-red-400 bg-red-50" : "border-gray-300 bg-gray-50 focus:border-blue-500 focus:bg-white"}`}
                                    />
                                    {errors.trainerName && <p className="mt-1 text-xs text-red-500">{errors.trainerName}</p>}
                                </div>

                                {/* Datum absolvování */}
                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                                        Datum absolvování <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={completedDate}
                                        onChange={(e) => setCompletedDate(e.target.value)}
                                        className={`w-full rounded-xl border px-4 py-2.5 text-sm text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${errors.completedDate ? "border-red-400 bg-red-50" : "border-gray-300 bg-gray-50 focus:border-blue-500 focus:bg-white"}`}
                                    />
                                    {errors.completedDate && <p className="mt-1 text-xs text-red-500">{errors.completedDate}</p>}
                                </div>

                                {/* Datum expirace */}
                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                                        Expirace <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={expirationDate}
                                        onChange={(e) => setExpirationDate(e.target.value)}
                                        className={`w-full rounded-xl border px-4 py-2.5 text-sm text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${errors.expirationDate ? "border-red-400 bg-red-50" : "border-gray-300 bg-gray-50 focus:border-blue-500 focus:bg-white"}`}
                                    />
                                    {errors.expirationDate && <p className="mt-1 text-xs text-red-500">{errors.expirationDate}</p>}
                                </div>

                                {/* Stav */}
                                <div className="sm:col-span-2">
                                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">Stav</label>
                                    <div className="flex gap-3">
                                        {STATUS_OPTIONS.map((opt) => (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => setStatus(opt.value)}
                                                className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${status === opt.value
                                                    ? opt.value === "valid"
                                                        ? "border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500/20"
                                                        : "border-red-400 bg-red-50 text-red-600 ring-2 ring-red-400/20"
                                                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                                                    }`}
                                            >
                                                <span className={`h-2.5 w-2.5 rounded-full ${status === opt.value ? (opt.value === "valid" ? "bg-emerald-500" : "bg-red-400") : "bg-gray-300"}`} />
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Employee selector */}
                            <div>
                                <div className="mb-2 flex items-center justify-between">
                                    <label className="text-sm font-semibold text-gray-700">
                                        Proškolení zaměstnanci <span className="text-red-500">*</span>
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

                                {/* Search inside employee list */}
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

                                {/* Employee list */}
                                <div className={`overflow-y-auto rounded-xl border ${errors.employees ? "border-red-400" : "border-gray-200"} bg-white`} style={{ maxHeight: "260px" }}>
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
                                                            {/* Checkbox */}
                                                            <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border transition-all ${isSelected ? "border-blue-600 bg-blue-600" : "border-gray-300 bg-white"}`}>
                                                                {isSelected && <Check size={12} strokeWidth={3} className="text-white" />}
                                                            </span>
                                                            {/* Avatar */}
                                                            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-blue-200 text-xs font-bold text-blue-700">
                                                                {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
                                                            </span>
                                                            {/* Info */}
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

                {/* Footer */}
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
                            {isSaving ? "Ukládám..." : "Přidat školení"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
