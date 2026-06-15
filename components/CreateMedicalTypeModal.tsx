"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { getApiUrl } from "@/lib/constants";

const PREDEFINED_TYPES = [
    { oznaceni: "AUDIOMETRIE",           nazev: "audiometrie - kontrola sluchu",                        fixedValidity: null },
    { oznaceni: "MANAŽER",               nazev: "manažerské prohlídky",                                  fixedValidity: null },
    { oznaceni: "PERIODIKA_2_ROKY",      nazev: "lékařská prohlídka periodická po 2 letech",             fixedValidity: 24   },
    { oznaceni: "PERIODIKA_4_ROKY",      nazev: "lékařská prohlídka periodická po 4 letech",             fixedValidity: 48   },
    { oznaceni: "PERIODIKA_6_LET",       nazev: "lékařská prohlídka periodická po 6 letech",             fixedValidity: 72   },
    { oznaceni: "PERIODIKA_2ROKY_EKG",   nazev: "lékařská prohlídka periodická po 2 letech + EKG",      fixedValidity: 24   },
    { oznaceni: "PERIOD_2_ROKY_EKG_50",  nazev: "lékařská prohlídka periodická po 2 letech + EKG 50+",  fixedValidity: 24   },
];

interface Props {
    onClose: () => void;
    onSaved: () => void;
}

export default function CreateMedicalTypeModal({ onClose, onSaved }: Props) {
    const [categorySelect, setCategorySelect] = useState("");
    const [categoryCustom, setCategoryCustom] = useState("");
    const [nameCustom, setNameCustom] = useState("");
    const [validityMonths, setValidityMonths] = useState<number | "">(12);
    const [facilitySelect, setFacilitySelect] = useState("Mediaperta s.r.o.");
    const [facilityCustom, setFacilityCustom] = useState("");
    const [description, setDescription] = useState("");

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const isJine = categorySelect === "__jine__";
    const pairedType = PREDEFINED_TYPES.find(p => p.oznaceni === categorySelect);
    const pairedName = pairedType?.nazev ?? "";
    const isValidityLocked = pairedType?.fixedValidity != null;

    const isFacilityJine = facilitySelect === "__jine__";
    const effectiveFacility = isFacilityJine ? facilityCustom : facilitySelect;

    const effectiveCategory = isJine ? categoryCustom : categorySelect;
    const effectiveName = isJine ? nameCustom : pairedName;

    const handleSave = async () => {
        if (!effectiveName.trim()) {
            setError("Zadejte název prohlídky.");
            return;
        }
        if (!effectiveCategory.trim()) {
            setError("Zadejte kategorii.");
            return;
        }
        if (validityMonths === "" || isNaN(validityMonths as number) || (validityMonths as number) < 0) {
            setError("Zadejte platnost v měsících (0 a více).");
            return;
        }
        if (!effectiveFacility.trim()) {
            setError("Zadejte lékařské zařízení.");
            return;
        }
        if (!description.trim()) {
            setError("Vyplňte poznámku.");
            return;
        }

        setSaving(true);
        setError("");
        const apiUrl = getApiUrl();
        try {
            const res = await fetch(`${apiUrl}/medical-types`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: effectiveName,
                    category: effectiveCategory,
                    validityMonths,
                    medicalFacility: effectiveFacility,
                    description
                })
            });

            const text = await res.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch {
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

    const selectClass = "w-full rounded-lg border border-gray-300 bg-gray-50 py-2.5 px-3 text-sm text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20";
    const inputClass = "w-full rounded-lg border border-gray-300 bg-gray-50 py-2.5 px-3 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div
                className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col pointer-events-auto"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between px-6 py-4 border-b border-gray-200"
                    style={{ background: "linear-gradient(135deg, #0054A6 0%, #003d7a 100%)", borderTopLeftRadius: "1rem", borderTopRightRadius: "1rem" }}
                >
                    <h2 className="text-lg font-bold text-white">Přidat novou prohlídku do katalogu</h2>
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

                    {/* Kategorie */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Kategorie (označení) <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={categorySelect}
                            onChange={(e) => {
                                const val = e.target.value;
                                setCategorySelect(val);
                                const found = PREDEFINED_TYPES.find(p => p.oznaceni === val);
                                if (found?.fixedValidity != null) setValidityMonths(found.fixedValidity);
                            }}
                            className={selectClass}
                        >
                            <option value="">— Vyberte kategorii —</option>
                            {PREDEFINED_TYPES.map(p => (
                                <option key={p.oznaceni} value={p.oznaceni}>{p.oznaceni}</option>
                            ))}
                            <option value="__jine__">Jiné...</option>
                        </select>
                        {isJine && (
                            <input
                                type="text"
                                value={categoryCustom}
                                onChange={(e) => setCategoryCustom(e.target.value)}
                                placeholder="Zadejte vlastní označení kategorie"
                                className={`mt-2 ${inputClass}`}
                                autoFocus
                            />
                        )}
                    </div>

                    {/* Název prohlídky — závislý na kategorii */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Název prohlídky <span className="text-red-500">*</span>
                        </label>
                        {isJine ? (
                            <input
                                type="text"
                                value={nameCustom}
                                onChange={(e) => setNameCustom(e.target.value)}
                                placeholder="Zadejte vlastní název prohlídky"
                                className={inputClass}
                            />
                        ) : (
                            <div className={`${selectClass} bg-gray-100 text-gray-500 cursor-not-allowed ${!pairedName ? "italic" : ""}`}>
                                {pairedName || "Automaticky doplněno po výběru kategorie"}
                            </div>
                        )}
                    </div>

                    {/* Platnost */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Platnost prohlídky (v měsících) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            min="0"
                            value={validityMonths}
                            onChange={(e) => setValidityMonths(e.target.value ? parseInt(e.target.value) : "")}
                            placeholder="Např. 12"
                            readOnly={isValidityLocked}
                            className={`${inputClass} ${isValidityLocked ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""}`}
                        />
                        <p className="mt-1.5 text-xs text-gray-500">
                            {isValidityLocked
                                ? `Platnost je pevně stanovena pro tento typ prohlídky (${validityMonths} měsíců).`
                                : "Určuje po jaké době skončí platnost prohlídky od absolvování. V případě jednorázové zadejte 0."
                            }
                        </p>
                    </div>

                    {/* Lékařské zařízení */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Lékařské zařízení <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={facilitySelect}
                            onChange={(e) => setFacilitySelect(e.target.value)}
                            className={selectClass}
                        >
                            <option value="Mediaperta s.r.o.">Mediaperta s.r.o.</option>
                            <option value="__jine__">Jiné...</option>
                        </select>
                        {isFacilityJine && (
                            <input
                                type="text"
                                value={facilityCustom}
                                onChange={(e) => setFacilityCustom(e.target.value)}
                                placeholder="Zadejte název lékařského zařízení"
                                className={`mt-2 ${inputClass}`}
                                autoFocus
                            />
                        )}
                    </div>

                    {/* Poznámka */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Poznámka <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Zadejte poznámku"
                            rows={3}
                            className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2.5 px-3 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
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
                        {saving ? "Ukládá se..." : "Vytvořit prohlídku"}
                    </button>
                </div>
            </div>
        </div>
    );
}
