"use client";

import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";

interface Props {
    onClose: () => void;
    onSaved: () => void;
}

interface Category {
    ID: number;
    Name: string;
}

export default function AddNewTrainingModalV2({ onClose, onSaved }: Props) {
    const [categories, setCategories] = useState<Category[]>([]);
    
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [categoryId, setCategoryId] = useState<number | "">("");
    const [periodicityMonths, setPeriodicityMonths] = useState<number | "">(12);

    const [loadingCats, setLoadingCats] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        fetch("/api/trainings-v2/categories")
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setCategories(data.data);
                    if (data.data.length > 0) {
                        setCategoryId(data.data[0].ID);
                    }
                }
                setLoadingCats(false);
            })
            .catch(err => {
                console.error(err);
                setLoadingCats(false);
            });
    }, []);

    const handleSave = async () => {
        if (!name.trim()) {
            setError("Zadejte název školení.");
            return;
        }
        if (categoryId === "") {
            setError("Zvolte kategorii.");
            return;
        }
        if (periodicityMonths === "" || isNaN(periodicityMonths) || periodicityMonths < 0) {
            setError("Zadejte platnost školení v měsících (0 a více).");
            return;
        }

        setSaving(true);
        setError("");

        try {
            const res = await fetch("/api/trainings-v2", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    description,
                    categoryId,
                    periodicityMonths
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div
                className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col pointer-events-auto"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200" style={{ background: "linear-gradient(135deg, #0054A6 0%, #003d7a 100%)", borderTopLeftRadius: "1rem", borderTopRightRadius: "1rem" }}>
                    <div>
                        <h2 className="text-lg font-bold text-white">Založit nové školení v katalogu</h2>
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

                    {/* Category */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Kategorie <span className="text-red-500">*</span></label>
                        {loadingCats ? (
                            <div className="w-full bg-gray-100 animate-pulse rounded-lg h-10 border border-gray-300"></div>
                        ) : (
                            <select
                                value={categoryId}
                                onChange={(e) => setCategoryId(parseInt(e.target.value))}
                                className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2.5 px-3 text-sm text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            >
                                <option value="" disabled>Vyberte kategorii...</option>
                                {categories.map(c => (
                                    <option key={c.ID} value={c.ID}>{c.Name}</option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Name */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Název školení <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Zadejte název školení"
                            className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2.5 px-3 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>
                    
                    {/* Periodicity */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Platnost školení (v měsících) <span className="text-red-500">*</span></label>
                        <input
                            type="number"
                            min="0"
                            value={periodicityMonths}
                            onChange={(e) => setPeriodicityMonths(e.target.value ? parseInt(e.target.value) : "")}
                            placeholder="Např. 12"
                            className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2.5 px-3 text-sm text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                        <p className="mt-1.5 text-xs text-gray-500">
                            Určuje po jaké době skončí platnost testu od absolvování. V případě jednorázového zadejte 0.
                        </p>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Popis školení</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Volitelný popis a bližší informace"
                            rows={3}
                            className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2.5 px-3 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                        ></textarea>
                    </div>
                    
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        disabled={saving}
                        className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                    >
                        Zrušit
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || loadingCats}
                        className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                        style={{ backgroundColor: "#0054A6" }}
                    >
                        {saving && <Loader2 size={15} className="animate-spin" />}
                        {saving ? 'Ukládá se...' : 'Vytvořit školení v katalogu'}
                    </button>
                </div>
            </div>
        </div>
    );
}
