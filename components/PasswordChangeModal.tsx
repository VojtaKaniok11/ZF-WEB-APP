"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";

interface PasswordChangeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function PasswordChangeModal({ isOpen, onClose }: PasswordChangeModalProps) {
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const { changePassword } = useAuth();

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (newPassword !== confirmPassword) {
            setMessage({ type: "error", text: "Hesla se neshodují." });
            return;
        }

        if (newPassword.length < 4) {
            setMessage({ type: "error", text: "Heslo musí mít alespoň 4 znaky." });
            return;
        }

        setIsLoading(true);
        const result = await changePassword(newPassword);
        setIsLoading(false);

        if (result.success) {
            setMessage({ type: "success", text: "Heslo bylo úspěšně změněno." });
            setNewPassword("");
            setConfirmPassword("");
            setTimeout(onClose, 2000);
        } else {
            setMessage({ type: "error", text: result.message || "Chyba při změně hesla." });
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-md animate-in rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
                <div className="bg-[#0054A6] p-6 text-white rounded-t-2xl">
                    <h2 className="text-xl font-bold">Změna hesla</h2>
                    <p className="text-sm opacity-80 mt-1">Nastavte si nové přístupové heslo</p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {message && (
                        <div className={`p-4 rounded-xl text-sm font-medium ${message.type === "success" ? "bg-green-50 text-green-700 ring-1 ring-green-100" : "bg-red-50 text-red-700 ring-1 ring-red-100"}`}>
                            {message.text}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5 text-left">Nové heslo</label>
                            <input
                                type="password"
                                required
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="block w-full rounded-xl border-0 py-2.5 px-4 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-[#0054A6] sm:text-sm"
                                placeholder="••••••••"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5 text-left">Potvrzení hesla</label>
                            <input
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="block w-full rounded-xl border-0 py-2.5 px-4 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-[#0054A6] sm:text-sm"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-200 transition-colors"
                        >
                            Zrušit
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 rounded-xl bg-[#0054A6] px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-[#004285] transition-all active:scale-[0.98] disabled:opacity-50"
                        >
                            {isLoading ? "Ukládám..." : "Uložit změnu"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
