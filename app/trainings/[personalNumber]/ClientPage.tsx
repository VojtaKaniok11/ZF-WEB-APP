"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useState, useEffect, use } from "react";
import ExpirationBadge from "@/components/ExpirationBadge";
import type { EmployeeDetail } from "@/types/employee";
import type { EmployeeTrainingRecord } from "@/types/training";
import { getApiUrl } from "@/lib/constants";


export default function TrainingDetailPage({ params }: { params: Promise<{ personalNumber: string }> }) {
    const { personalNumber: pnRaw } = use(params);
    const personalNumber = pnRaw;

    const [employee, setEmployee] = useState<EmployeeDetail | null>(null);
    const [records, setRecords] = useState<EmployeeTrainingRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        if (!personalNumber) return;
        const pn = encodeURIComponent(personalNumber);

        async function load() {
            setIsLoading(true);
            try {
                const apiUrl = getApiUrl();
                const [empRes, trnRes] = await Promise.all([
                    fetch(`${apiUrl}/employees/${pn}`),
                    fetch(`${apiUrl}/trainings/${pn}`),
                ]);
                const empJson = await empRes.json();
                if (!empJson.success) { setNotFound(true); return; }
                setEmployee(empJson.data);

                const trnJson = await trnRes.json();
                if (trnJson.success) setRecords(trnJson.data);
            } catch {
                setNotFound(true);
            } finally {
                setIsLoading(false);
            }
        }

        load();

        // Po přidání školení z modalu znovu načteme záznamy
        function handleTrainingAdded() { load(); }
        window.addEventListener("training-added", handleTrainingAdded);
        return () => window.removeEventListener("training-added", handleTrainingAdded);
    }, [personalNumber]);

    function formatDate(d: string | null): string {
        if (!d) return "—";
        return new Date(d).toLocaleDateString("cs-CZ", { day: "2-digit", month: "2-digit", year: "numeric" });
    }

    if (isLoading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <Loader2 size={32} className="animate-spin text-blue-500" />
            </div>
        );
    }

    if (notFound || !employee) {
        return (
            <div className="mx-auto max-w-5xl px-4 py-12 text-center">
                <p className="text-gray-500">Zaměstnanec nenalezen.</p>
                <Link href="/trainings" className="mt-4 inline-block text-sm text-blue-600 hover:underline">
                    ← Zpět na seznam
                </Link>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
            {/* Back link */}
            <Link
                href="/trainings"
                className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-[#0054A6]"
            >
                <ArrowLeft size={16} />
                Zpět na seznam školení
            </Link>

            {/* Employee header */}
            <div className="mb-8 flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-blue-200 text-2xl font-bold text-blue-700">
                    {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {employee.firstName} {employee.lastName}
                    </h1>
                    <p className="mt-0.5 text-sm text-gray-500">
                        {employee.personalNumber} · {employee.department} · {employee.position} · {employee.workcenterName}
                    </p>
                </div>
            </div>

            {/* Training table */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 px-5 py-4" style={{ backgroundColor: "#0054A6" }}>
                    <h2 className="text-base font-semibold text-white">
                        Přehled školení ({records.length})
                    </h2>
                </div>

                {records.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <p className="text-sm text-gray-400">Žádné záznamy o školení.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-50/80">
                                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Školení</th>
                                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Kategorie</th>
                                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Datum</th>
                                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Expirace</th>
                                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Školitel</th>
                                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Stav</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {records.map((r, idx) => (
                                    <tr key={idx} className="transition-colors hover:bg-blue-50/40">
                                        <td className="px-5 py-3 font-medium text-gray-900">{r.trainingName}</td>
                                        <td className="px-5 py-3">
                                            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">{r.category}</span>
                                        </td>
                                        <td className="px-5 py-3 tabular-nums text-gray-600">{formatDate(r.completedDate)}</td>
                                        <td className="px-5 py-3 tabular-nums text-gray-600">{formatDate(r.expirationDate)}</td>
                                        <td className="px-5 py-3 text-gray-600">{r.trainerName}</td>
                                        <td className="px-5 py-3">
                                            <ExpirationBadge status={r.status} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
