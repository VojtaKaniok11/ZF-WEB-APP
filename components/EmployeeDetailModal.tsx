"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import Modal from "./Modal";
import StatusBadge from "./StatusBadge";
import { EmployeeDetail } from "@/types/employee";
import { getApiUrl } from "@/lib/constants";

interface EmployeeDetailModalProps {
    isOpen: boolean;
    personalNumber: string | null;
    onClose: () => void;
}

export default function EmployeeDetailModal({
    isOpen,
    personalNumber,
    onClose,
}: EmployeeDetailModalProps) {
    const [data, setData] = useState<EmployeeDetail | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!isOpen || !personalNumber) {
            setData(null);
            setError("");
            return;
        }

        async function fetchDetail() {
            setIsLoading(true);
            setError("");
            const apiUrl = getApiUrl();
            try {
                const res = await fetch(
                    `${apiUrl}/employees/${encodeURIComponent(personalNumber!)}`
                );
                const result = await res.json();

                if (result.success) {
                    setData(result.data);
                } else {
                    setError(result.message || "Chyba při načítání dat.");
                }
            } catch (err) {
                setError(
                    "Chyba při komunikaci se serverem: " +
                    (err instanceof Error ? err.message : "Neznámá chyba")
                );
            } finally {
                setIsLoading(false);
            }
        }

        fetchDetail();
    }, [isOpen, personalNumber]);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Detail zaměstnance"
            maxWidth="max-w-3xl"
            footer={
                <button
                    onClick={onClose}
                    className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700"
                >
                    Zavřít
                </button>
            }
        >
            {/* Loading */}
            {isLoading && (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <Loader2 size={32} className="animate-spin mb-3" />
                    <p className="text-sm">Načítám data...</p>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="rounded-lg border-l-4 border-red-500 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            {/* Content */}
            {data && !isLoading && (
                <div className="space-y-6">
                    {/* Základní informace */}
                    <DetailSection title="Základní informace">
                        <DetailGrid>
                            <DetailItem label="Osobní číslo" value={data.personalNumber} />
                            <DetailItem label="Jméno" value={data.firstName} />
                            <DetailItem label="Příjmení" value={data.lastName} />
                            <DetailItem label="Uživatelské jméno" value={data.userName} />
                        </DetailGrid>
                    </DetailSection>

                    {/* Kontaktní údaje */}
                    <DetailSection title="Kontaktní údaje">
                        <DetailGrid>
                            <DetailItem label="Email" value={data.email} />
                            <DetailItem label="Telefon" value={data.phone} />
                            <DetailItem label="Mobil" value={data.mobile} />
                        </DetailGrid>
                    </DetailSection>

                    {/* Pracovní údaje */}
                    <DetailSection title="Pracovní údaje">
                        <DetailGrid>
                            <DetailItem label="Oddělení" value={data.department} />
                            <DetailItem label="Pozice" value={data.position} />
                            <DetailItem label="Úroveň" value={data.level} />
                            <DetailItem
                                label="Stav"
                                value={<StatusBadge isActive={data.isActive} />}
                            />
                            <DetailItem label="Nadřízený" value={data.managerName} />
                        </DetailGrid>
                    </DetailSection>

                    {/* Historie pracovních pozic */}
                    <DetailSection title="Historie pracovních pozic">
                        {data.positionHistory && data.positionHistory.length > 0 ? (
                            <div className="space-y-3">
                                {data.positionHistory.map((item, idx) => (
                                    <div
                                        key={idx}
                                        className="rounded-lg border-l-4 border-blue-500 bg-gray-50 p-4"
                                    >
                                        <div className="font-semibold text-gray-900">
                                            {item.position || "Neznámá pozice"}
                                        </div>
                                        <div className="mt-1 flex flex-wrap gap-4 text-sm text-gray-500">
                                            <span className="font-medium text-gray-600">
                                                {item.department}
                                            </span>
                                            <span>
                                                {item.startDate} — {item.endDate}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400">Žádná historie pozic.</p>
                        )}
                    </DetailSection>
                </div>
            )}
        </Modal>
    );
}

/* ---- Sub‑components (local, not exported) ---- */

function DetailSection({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div>
            <h3 className="mb-3 border-b-2 border-blue-600 pb-2 text-sm font-bold uppercase tracking-wider text-gray-900">
                {title}
            </h3>
            {children}
        </div>
    );
}

function DetailGrid({ children }: { children: React.ReactNode }) {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    );
}

function DetailItem({
    label,
    value,
}: {
    label: string;
    value: React.ReactNode;
}) {
    return (
        <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-gray-400">{label}</span>
            <span className="text-sm font-medium text-gray-900">
                {value || "N/A"}
            </span>
        </div>
    );
}
