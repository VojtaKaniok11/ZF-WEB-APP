"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { getApiUrl } from "@/lib/constants";

interface Props {
    onClose: () => void;
    onSaved: () => void;
}

export default function CreateOoppItemModal({ onClose, onSaved }: Props) {
    const [name, setName] = useState("");
    const [category, setCategory] = useState("");

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const handleSave = async () => {
        if (!name.trim()) {
            setError("Zadejte název OOPP položky.");
            return;
        }
        if (!category.trim()) {
            setError("Zadejte kategorii (např. Obuv, Oděvy, Ochrana zraku).");
            return;
        }

        setSaving(true);
        setError("");
        const apiUrl = getApiUrl();
        try {
            const res = await fetch(`${apiUrl}/oopp/items`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    category
                })
            });

            const text = await res.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (parseError) {
                throw new Error(`Server nevrátil platný JSON (Status: ${res.status}). Odezva: ${text.substring(0, 100)}`);
            }

            if (data.success) {
                onSaved();
            } else {
                setError(data.message || "Uložení se nezdařilo.");
                setSaving(false);
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Nastala chyba při komunikaci se serverem.");
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
                        <h2 className="text-lg font-bold text-white">Přidat novou OOPP do katalogu</h2>
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

                    {/* Name */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Název OOPP <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Zadejte název pomůcky"
                            className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2.5 px-3 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>

                    {/* Category */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Kategorie <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            placeholder="Např. Obuv, Oděvy, Rukavice..."
                            className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2.5 px-3 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
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
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                        style={{ backgroundColor: "#0054A6" }}
                    >
                        {saving && <Loader2 size={15} className="animate-spin" />}
                        {saving ? 'Ukládá se...' : 'Vytvořit OOPP'}
                    </button>
                </div>
            </div>
        </div>
    );
}
