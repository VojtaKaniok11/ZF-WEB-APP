"use client";

import { useState } from "react";
import { X, AlertTriangle, Loader2, Trash2 } from "lucide-react";

interface Props {
    title: string;
    message: React.ReactNode;
    confirmLabel?: string;
    loading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

// Potvrzovací dialog pro nevratné smazání. Smazat lze až po zaškrtnutí,
// že si je uživatel vědom nevratnosti kroku.
export default function ConfirmDeleteModal({ title, message, confirmLabel = "Smazat", loading = false, onConfirm, onCancel }: Props) {
    const [acknowledged, setAcknowledged] = useState(false);

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onCancel}>
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-start gap-4 p-6">
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                        <AlertTriangle size={22} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                        <div className="mt-1.5 text-sm text-gray-600">{message}</div>
                    </div>
                    <button onClick={onCancel} className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <div className="px-6 pb-4">
                    <label className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={acknowledged}
                            onChange={(e) => setAcknowledged(e.target.checked)}
                            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                        />
                        <span className="text-sm font-medium text-red-800">
                            Beru na vědomí, že tento krok je nevratný a smazaná data nelze obnovit.
                        </span>
                    </label>
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4 rounded-b-2xl">
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
                    >
                        Zrušit
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={!acknowledged || loading}
                        className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
