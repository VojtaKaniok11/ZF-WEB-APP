"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getMedicalRecordsForEmployee } from "@/lib/mock-medical";
import { getEmployeeDetail } from "@/lib/mock-data";
import ExpirationBadge from "@/components/ExpirationBadge";

export default function MedicalDetailPage() {
    const params = useParams();
    const personalNumber = params.personalNumber as string;
    const employee = getEmployeeDetail(personalNumber);
    const records = getMedicalRecordsForEmployee(personalNumber);

    if (!employee) {
        return (
            <div className="mx-auto max-w-5xl px-4 py-12 text-center">
                <p className="text-gray-500">Zaměstnanec nenalezen.</p>
                <Link href="/medical" className="mt-4 inline-block text-sm text-blue-600 hover:underline">← Zpět</Link>
            </div>
        );
    }

    function formatDate(d: string | null): string {
        if (!d) return "—";
        return new Date(d).toLocaleDateString("cs-CZ", { day: "2-digit", month: "2-digit", year: "numeric" });
    }

    return (
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
            <Link href="/medical" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-[#0054A6]">
                <ArrowLeft size={16} /> Zpět na seznam prohlídek
            </Link>

            <div className="mb-8 flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-rose-100 to-rose-200 text-lg font-bold text-rose-700">
                    {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{employee.firstName} {employee.lastName}</h1>
                    <p className="text-sm text-gray-500">{employee.personalNumber} · {employee.department} · {employee.position}</p>
                </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 px-5 py-4" style={{ backgroundColor: "#0054A6" }}>
                    <h2 className="text-base font-semibold text-white">🏥 Lékařské prohlídky ({records.length})</h2>
                </div>

                {records.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className="mb-3 text-4xl">🏥</div>
                        <p className="text-sm text-gray-400">Žádné záznamy o prohlídkách.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-50/80">
                                    <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Prohlídka</th>
                                    <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Kategorie</th>
                                    <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Datum</th>
                                    <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Další prohlídka</th>
                                    <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Lékař</th>
                                    <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Výsledek</th>
                                    <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Stav</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {records.map((r, idx) => (
                                    <tr key={idx} className="transition-colors hover:bg-blue-50/40">
                                        <td className="px-4 py-3 font-medium text-gray-900">{r.examTypeName}</td>
                                        <td className="px-4 py-3">
                                            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">{r.category}</span>
                                        </td>
                                        <td className="px-4 py-3 tabular-nums text-gray-600">{formatDate(r.examDate)}</td>
                                        <td className="px-4 py-3 tabular-nums text-gray-600">{formatDate(r.nextExamDate)}</td>
                                        <td className="px-4 py-3 text-gray-600">{r.doctorName}</td>
                                        <td className="px-4 py-3">
                                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${r.result === "Způsobilý" ? "bg-emerald-50 text-emerald-700" :
                                                    r.result === "Způsobilý s omezením" ? "bg-amber-50 text-amber-700" :
                                                        "bg-red-50 text-red-700"
                                                }`}>
                                                {r.result}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <ExpirationBadge status={r.status} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Notes section */}
                {records.some((r) => r.notes) && (
                    <div className="border-t border-gray-200 px-5 py-4">
                        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Poznámky</h3>
                        <ul className="space-y-1">
                            {records.filter((r) => r.notes).map((r, idx) => (
                                <li key={idx} className="text-sm text-gray-600">
                                    <span className="font-medium">{r.examTypeName}:</span> {r.notes}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}
