"use client";

import { useState } from "react";
import Modal from "./Modal";
import { DEPARTMENTS } from "@/lib/constants";
import { NewEmployeePayload } from "@/types/employee";

interface AddEmployeeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: NewEmployeePayload) => Promise<void>;
}

const INITIAL_FORM: NewEmployeePayload = {
    personalNumber: "",
    firstName: "",
    lastName: "",
    department: "",
    costCenter: null,
    hiringDate: null,
    isActive: true,
};

export default function AddEmployeeModal({
    isOpen,
    onClose,
    onSave,
}: AddEmployeeModalProps) {
    const [form, setForm] = useState<NewEmployeePayload>({ ...INITIAL_FORM });
    const [error, setError] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    function handleClose() {
        setForm({ ...INITIAL_FORM });
        setError("");
        onClose();
    }

    async function handleSubmit() {
        // Client-side validation
        if (!form.personalNumber.trim()) {
            setError("Osobní číslo je povinné.");
            return;
        }
        if (!form.firstName.trim()) {
            setError("Jméno je povinné.");
            return;
        }
        if (!form.lastName.trim()) {
            setError("Příjmení je povinné.");
            return;
        }
        if (!form.department.trim()) {
            setError("Oddělení je povinné.");
            return;
        }

        setError("");
        setIsSaving(true);

        try {
            await onSave(form);
            setForm({ ...INITIAL_FORM });
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Chyba při ukládání."
            );
        } finally {
            setIsSaving(false);
        }
    }

    function updateField<K extends keyof NewEmployeePayload>(
        key: K,
        value: NewEmployeePayload[K]
    ) {
        setForm((prev) => ({ ...prev, [key]: value }));
        if (error) setError("");
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Přidat zaměstnance"
            footer={
                <>
                    <button
                        onClick={handleClose}
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                    >
                        Zrušit
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSaving}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isSaving ? "Ukládám..." : "Uložit"}
                    </button>
                </>
            }
        >
            {/* Error */}
            {error && (
                <div className="mb-4 rounded-lg border-l-4 border-red-500 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            <div className="space-y-4">
                {/* Row 1 */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                            Osobní číslo <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={form.personalNumber}
                            onChange={(e) => updateField("personalNumber", e.target.value)}
                            placeholder="např. CZ021"
                            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                            Středisko
                        </label>
                        <input
                            type="text"
                            value={form.costCenter ?? ""}
                            onChange={(e) =>
                                updateField("costCenter", e.target.value || null)
                            }
                            placeholder="např. 110001"
                            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>
                </div>

                {/* Row 2 */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                            Jméno <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={form.firstName}
                            onChange={(e) => updateField("firstName", e.target.value)}
                            placeholder="Jméno"
                            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                            Příjmení <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={form.lastName}
                            onChange={(e) => updateField("lastName", e.target.value)}
                            placeholder="Příjmení"
                            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>
                </div>

                {/* Row 3 */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                            Oddělení <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={form.department}
                            onChange={(e) => updateField("department", e.target.value)}
                            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        >
                            <option value="">Vyberte oddělení</option>
                            {DEPARTMENTS.map((dept) => (
                                <option key={dept} value={dept}>
                                    {dept}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                            Datum nástupu
                        </label>
                        <input
                            type="date"
                            value={form.hiringDate ?? ""}
                            onChange={(e) =>
                                updateField("hiringDate", e.target.value || null)
                            }
                            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>
                </div>

                {/* Row 4 */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                            Stav
                        </label>
                        <select
                            value={form.isActive ? "true" : "false"}
                            onChange={(e) =>
                                updateField("isActive", e.target.value === "true")
                            }
                            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        >
                            <option value="true">Aktivní</option>
                            <option value="false">Neaktivní</option>
                        </select>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
