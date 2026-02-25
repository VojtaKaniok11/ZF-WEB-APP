"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getOoppRecordsForEmployee } from "@/lib/mock-oopp";
import { getEmployeeDetail } from "@/lib/mock-data";
import ExpirationBadge from "@/components/ExpirationBadge";

export default function OoppDetailPage() {
    const params = useParams();
    const personalNumber = params.personalNumber as string;
    const employee = getEmployeeDetail(personalNumber);
    const records = getOoppRecordsForEmployee(personalNumber);

    if (!employee) {
        return (
            <div className="mx-auto max-w-5xl px-4 py-12 text-center">
                <p className="text-gray-500">Zaměstnanec nenalezen.</p>
                <Link href="/oopp" className="mt-4 inline-block text-sm text-blue-600 hover:underline">← Zpět</Link>
            </div>
        );
    }

    function formatDate(d: string | null): string {
        if (!d) return "—";
        return new Date(d).toLocaleDateString("cs-CZ", { day: "2-digit", month: "2-digit", year: "numeric" });
    }

    return (
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
            <Link href="/oopp" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-[#0054A6]">
                <ArrowLeft size={16} /> Zpět na seznam OOPP
            </Link>

            <div className="mb-8 flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 text-lg font-bold text-indigo-700">
                    {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{employee.firstName} {employee.lastName}</h1>
                    <p className="text-sm text-gray-500">{employee.personalNumber} · {employee.department} · {employee.position}</p>
                </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 px-5 py-4" style={{ backgroundColor: "#0054A6" }}>
                    <h2 className="text-base font-semibold text-white">🛡️ OOPP výdeje ({records.length})</h2>
                </div>

                {records.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className="mb-3 text-4xl">🧤</div>
                        <p className="text-sm text-gray-400">Žádné záznamy o výdejích OOPP.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-50/80">
                                    <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Pomůcka</th>
                                    <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Kategorie</th>
                                    <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Vydáno</th>
                                    <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Další nárok</th>
                                    <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Ks</th>
                                    <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Velikost</th>
                                    <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Stav</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {records.map((r, idx) => (
                                    <tr key={idx} className="transition-colors hover:bg-blue-50/40">
                                        <td className="px-4 py-3 font-medium text-gray-900">{r.ooppItemName}</td>
                                        <td className="px-4 py-3">
                                            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">{r.category}</span>
                                        </td>
                                        <td className="px-4 py-3 tabular-nums text-gray-600">{formatDate(r.lastIssueDate)}</td>
                                        <td className="px-4 py-3 tabular-nums text-gray-600">{formatDate(r.nextEntitlementDate)}</td>
                                        <td className="px-4 py-3 text-center text-gray-600">{r.quantity}</td>
                                        <td className="px-4 py-3 text-gray-600">{r.size || "—"}</td>
                                        <td className="px-4 py-3">
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
