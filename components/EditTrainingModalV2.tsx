"use client";

import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { getApiUrl } from "@/lib/constants";
import { TrainingV2 } from "./TrainingsClientV2";

interface Props {
    training: TrainingV2;
    onClose: () => void;
    onSaved: () => void;
}

interface Category {
    id: number;
    name: string;
}

export default function EditTrainingModalV2({ training, onClose, onSaved }: Props) {
    const [categories, setCategories] = useState<Category[]>([]);

    const [categoryId, setCategoryId] = useState<number | "">(training.categoryId || "");
    const [name, setName] = useState(training.name);
    const [isLegal, setIsLegal] = useState(training.isLegal);
    const [isExternal, setIsExternal] = useState(training.isExternal);
    const [periodicityMonths, setPeriodicityMonths] = useState<number | "">(training.periodicityMonths);
    const [trainerName, setTrainerName] = useState(training.trainerName || "");
    const [description, setDescription] = useState(training.description || "");

    const [loadingCats, setLoadingCats] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        fetch(`${getApiUrl()}/trainings-v2/categories`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setCategories(data.data);
                    // Pokud katalog vrátil kategorii jen názvem (categoryId chybí), dohledáme ID podle názvu.
                    if (!categoryId && training.categoryName) {
                        const match = data.data.find((c: Category) => c.name === training.categoryName);
                        if (match) setCategoryId(match.id);
                    }
                }
            })
            .catch(console.error)
            .finally(() => setLoadingCats(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const periodChanged = periodicityMonths !== "" && Number(periodicityMonths) !== training.periodicityMonths;

    const handleSave = async () => {
        if (!name.trim()) { setError("Zadejte název školení."); return; }
        if (categoryId === "") { setError("Zvolte kategorii."); return; }
        if (periodicityMonths === "" || isNaN(Number(periodicityMonths)) || Number(periodicityMonths) < 0) {
            setError("Zadejte platnost školení v měsících (0 a více).");
            return;
        }

        setSaving(true);
        setError("");
        try {
            const res = await fetch(`${getApiUrl()}/trainings-v2/${training.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    description,
                    categoryId,
                    periodicityMonths: Number(periodicityMonths),
                    isLegal,
                    isExternal,
                    trainerName
                })
            });
            const data = await res.json();
            if (data.success) {
                onSaved();
            } else {
                setError(data.message || "Uložení změn se nezdařilo.");
                setSaving(false);
            }
        } catch {
            setError("Nastala chyba při komunikaci se serverem.");
            setSaving(false);
        }
    };

    const inputClass = "w-full rounded-lg border border-gray-300 bg-gray-50 py-2.5 px-3 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20";

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div
                className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between px-6 py-4 border-b border-gray-200 rounded-t-2xl"
                    style={{ background: "linear-gradient(135deg, #0054A6 0%, #003d7a 100%)" }}
                >
                    <h2 className="text-lg font-bold text-white">Upravit školení v katalogu</h2>
                    <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-6 space-y-4 overflow-y-auto">
                    {error && (
                        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
                    )}

                    {/* 1. Kategorie */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Kategorie <span className="text-red-500">*</span></label>
                        {loadingCats ? (
                            <div className="w-full bg-gray-100 animate-pulse rounded-lg h-10 border border-gray-300" />
                        ) : (
                            <select value={categoryId} onChange={(e) => setCategoryId(parseInt(e.target.value))} className={inputClass}>
                                <option value="" disabled>Vyberte kategorii...</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        )}
                    </div>

                    {/* 2. Název */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Název školení <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Zadejte název školení"
                            className={inputClass}
                        />
                    </div>

                    {/* 3+4. Zákonné / Interní — side by side */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">Zákonné</label>
                            <select value={isLegal ? "1" : "0"} onChange={(e) => setIsLegal(e.target.value === "1")} className={inputClass}>
                                <option value="0">Nezákonné</option>
                                <option value="1">Zákonné</option>
                            </select>
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">Interní / Externí</label>
                            <select value={isExternal ? "1" : "0"} onChange={(e) => setIsExternal(e.target.value === "1")} className={inputClass}>
                                <option value="0">Interní</option>
                                <option value="1">Externí</option>
                            </select>
                        </div>
                    </div>

                    {/* 5. Perioda */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Perioda (měsíců) <span className="text-red-500">*</span></label>
                        <input
                            type="number"
                            min="0"
                            value={periodicityMonths}
                            onChange={(e) => setPeriodicityMonths(e.target.value ? parseInt(e.target.value) : "")}
                            placeholder="Např. 12"
                            className={inputClass}
                        />
                        <p className="mt-1 text-xs text-gray-500">Zadejte 0 pro jednorázové školení bez expirace.</p>
                        {periodChanged && (
                            <p className="mt-1 text-xs font-medium text-amber-600">
                                Změna periody přepočítá datum platnosti u všech zaměstnanců s tímto školením.
                            </p>
                        )}
                    </div>

                    {/* 6. Školitel */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Školitel</label>
                        <input
                            type="text"
                            value={trainerName}
                            onChange={(e) => setTrainerName(e.target.value)}
                            placeholder="Jméno školitele"
                            className={inputClass}
                        />
                    </div>

                    {/* 7. Poznámka */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Poznámka</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Volitelný popis a bližší informace"
                            rows={3}
                            className={`${inputClass} resize-none`}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4 rounded-b-2xl">
                    <button onClick={onClose} disabled={saving} className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
                        Zrušit
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || loadingCats}
                        className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                        style={{ backgroundColor: "#0054A6" }}
                    >
                        {saving && <Loader2 size={15} className="animate-spin" />}
                        {saving ? "Ukládá se..." : "Uložit změny"}
                    </button>
                </div>
            </div>
        </div>
    );
}
