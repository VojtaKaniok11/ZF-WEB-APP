"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getIluoRecordsForEmployee } from "@/lib/mock-iluo";
import { getEmployeeDetail } from "@/lib/mock-data";
import type { IluoLevel } from "@/types/iluo";

function IluoBadge({ level }: { level: IluoLevel }) {
    const labels: Record<IluoLevel, string> = {
        I: "I – Začátečník",
        L: "L – Zácvik",
        U: "U – Samostatný pracovník",
        O: "O – Expert",
    };
    return (
        <span className={`iluo-badge-${level} inline-flex items-center rounded-full px-3 py-1 text-xs font-bold`}>
            {labels[level]}
        </span>
    );
}

function ProgressBar({ current, target }: { current: IluoLevel; target: IluoLevel }) {
    const order: IluoLevel[] = ["I", "L", "U", "O"];
    const currentIdx = order.indexOf(current);
    const targetIdx = order.indexOf(target);
    const progress = targetIdx > 0 ? ((currentIdx + 1) / (targetIdx + 1)) * 100 : 100;

    return (
        <div className="flex items-center gap-2">
            <div className="h-2 w-20 rounded-full bg-gray-200">
                <div
                    className="h-2 rounded-full transition-all"
                    style={{
                        width: `${Math.min(progress, 100)}%`,
                        backgroundColor: progress >= 100 ? "#047857" : "#0054A6",
                    }}
                />
            </div>
            <span className="text-xs text-gray-400">{Math.round(progress)}%</span>
        </div>
    );
}

export default function IluoDetailPage() {
    const params = useParams();
    const personalNumber = params.personalNumber as string;
    const employee = getEmployeeDetail(personalNumber);
    const records = getIluoRecordsForEmployee(personalNumber);

    if (!employee) {
        return (
            <div className="mx-auto max-w-5xl px-4 py-12 text-center">
                <p className="text-gray-500">Zaměstnanec nenalezen.</p>
                <Link href="/iluo" className="mt-4 inline-block text-sm text-blue-600 hover:underline">← Zpět</Link>
            </div>
        );
    }

    function formatDate(d: string | null): string {
        if (!d) return "—";
        return new Date(d).toLocaleDateString("cs-CZ", { day: "2-digit", month: "2-digit", year: "numeric" });
    }

    // Group by work center
    const grouped = records.reduce((acc, r) => {
        if (!acc[r.workCenterName]) acc[r.workCenterName] = [];
        acc[r.workCenterName].push(r);
        return acc;
    }, {} as Record<string, typeof records>);

    return (
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
            <Link href="/iluo" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-[#0054A6]">
                <ArrowLeft size={16} /> Zpět na seznam ILUO
            </Link>

            <div className="mb-8 flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-violet-200 text-2xl font-bold text-violet-700">
                    {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{employee.firstName} {employee.lastName}</h1>
                    <p className="mt-0.5 text-sm text-gray-500">{employee.personalNumber} · {employee.department} · {employee.position}</p>
                </div>
            </div>

            {/* ILUO Legend */}
            <div className="mb-6 flex flex-wrap gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 mr-2 self-center">Legenda:</span>
                <IluoBadge level="I" />
                <IluoBadge level="L" />
                <IluoBadge level="U" />
                <IluoBadge level="O" />
            </div>

            {/* Grouped by workcenter */}
            {Object.entries(grouped).map(([wcName, skills]) => (
                <div key={wcName} className="mb-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-200 px-5 py-4" style={{ backgroundColor: "#0054A6" }}>
                        <h2 className="text-base font-semibold text-white">{wcName}</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-50/80">
                                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Dovednost</th>
                                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Kategorie</th>
                                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Aktuální</th>
                                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Cíl</th>
                                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Progres</th>
                                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Hodnocení</th>
                                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Hodnotitel</th>
                                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Další</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {skills.map((r, idx) => (
                                    <tr key={idx} className="transition-colors hover:bg-blue-50/40">
                                        <td className="px-5 py-3 font-medium text-gray-900">{r.skillName}</td>
                                        <td className="px-5 py-3">
                                            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">{r.category}</span>
                                        </td>
                                        <td className="px-5 py-3"><IluoBadge level={r.currentLevel} /></td>
                                        <td className="px-5 py-3"><IluoBadge level={r.targetLevel} /></td>
                                        <td className="px-5 py-3"><ProgressBar current={r.currentLevel} target={r.targetLevel} /></td>
                                        <td className="px-5 py-3 tabular-nums text-gray-600">{formatDate(r.assessmentDate)}</td>
                                        <td className="px-5 py-3 text-gray-600">{r.assessorName}</td>
                                        <td className="px-5 py-3 tabular-nums text-gray-600">{formatDate(r.nextReviewDate)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}
        </div>
    );
}
