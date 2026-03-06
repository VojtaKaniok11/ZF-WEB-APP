import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import ExpirationBadge from "@/components/ExpirationBadge";
import type { IluoLevel } from "@/types/iluo";
import type { EmployeeDetail } from "@/types/employee";
import type { EmployeeTrainingRecord } from "@/types/training";
import type { EmployeeMedicalRecord } from "@/types/medical";
import type { EmployeeOoppRecord } from "@/types/oopp";
import type { EmployeeIluoRecord } from "@/types/iluo";

import { headers } from "next/headers";

export default async function EmployeeProfilePage({ params }: { params: Promise<{ personalNumber: string }> }) {
    const { personalNumber: pnRaw } = await params;

    // Safety check for 'undefined' string or empty param
    if (!pnRaw || pnRaw === 'undefined') {
        return (
            <div className="mx-auto max-w-5xl px-4 py-12 text-center">
                <p className="text-gray-500">Neplatné osobní číslo.</p>
                <Link href="/" className="mt-4 inline-block text-sm text-blue-600 hover:underline">← Zpět na přehled</Link>
            </div>
        );
    }

    const personalNumber = encodeURIComponent(pnRaw);

    // Get base URL for server-side fetch
    const host = (await headers()).get("host");
    const protocol = host?.includes("localhost") ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;

    // Server‑side fetch all related data
    const [empRes, trnRes, medRes, ooppRes, iluoRes] = await Promise.all([
        fetch(`${baseUrl}/api/employees/${personalNumber}`),
        fetch(`${baseUrl}/api/trainings/${personalNumber}`),
        fetch(`${baseUrl}/api/medical/${personalNumber}`),
        fetch(`${baseUrl}/api/oopp/${personalNumber}`),
        fetch(`${baseUrl}/api/iluo/${personalNumber}`),
    ]);

    const empJson = await empRes.json();
    if (!empJson.success) {
        return (
            <div className="mx-auto max-w-5xl px-4 py-12 text-center">
                <p className="text-gray-500">Zaměstnanec nenalezen.</p>
                <Link href="/" className="mt-4 inline-block text-sm text-blue-600 hover:underline">← Zpět na přehled</Link>
            </div>
        );
    }
    const employee: EmployeeDetail = empJson.data;

    const trnJson = await trnRes.json();
    const trainings: EmployeeTrainingRecord[] = trnJson.success ? trnJson.data : [];

    const medJson = await medRes.json();
    const medicals: EmployeeMedicalRecord[] = medJson.success ? medJson.data : [];

    const ooppJson = await ooppRes.json();
    const oopp: EmployeeOoppRecord[] = ooppJson.success ? ooppJson.data : [];

    const iluoJson = await iluoRes.json();
    const iluo: EmployeeIluoRecord[] = iluoJson.success ? iluoJson.data : [];


    function formatDate(d: string | null): string {
        if (!d) return "—";
        return new Date(d).toLocaleDateString("cs-CZ", { day: "2-digit", month: "2-digit", year: "numeric" });
    }

    return (
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
            <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-[#0054A6]">
                <ArrowLeft size={16} /> Zpět na přehled zaměstnanců
            </Link>

            {/* ─── Employee header card ─── */}
            <div className="mb-8 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="px-6 py-5" style={{ background: "linear-gradient(135deg, #0054A6 0%, #003d7a 100%)" }}>
                    <div className="flex items-center gap-5">
                        <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full bg-white/20 text-2xl font-bold text-white ring-4 ring-white/30">
                            {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                        </div>
                        <div className="text-white">
                            <h1 className="text-2xl font-bold">{employee.firstName} {employee.lastName}</h1>
                            <p className="mt-1 text-sm text-blue-100">{employee.position} · {employee.department}</p>
                            <div className="mt-2.5 flex flex-wrap items-center gap-3">
                                <code className="rounded bg-white/20 px-2 py-0.5 text-xs font-mono">{employee.personalNumber}</code>
                                <StatusBadge isActive={employee.isActive} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Basic info grid */}
                <div className="grid grid-cols-2 gap-4 border-t border-gray-200 px-6 py-5 sm:grid-cols-4">
                    <InfoItem label="Email" value={employee.email} />
                    <InfoItem label="Telefon" value={employee.phone} />
                    <InfoItem label="Nadřízený" value={employee.managerName} />
                    <InfoItem label="Úroveň" value={employee.level} />
                    <InfoItem label="Uživatel" value={employee.userName} />
                </div>
            </div>

            {/* ─── Dashboard cards grid ─── */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* 📋 Školení */}
                <DashboardCard
                    title="Školení"
                    count={trainings.length}
                    linkHref={`/trainings/${employee.personalNumber}`}
                    linkLabel="Zobrazit vše"
                    isEmpty={trainings.length === 0}
                    emptyMessage="Žádné záznamy o školení."
                >
                    <div className="space-y-2.5">
                        {trainings.slice(0, 4).map((t, idx) => (
                            <div key={idx} className="flex items-center justify-between rounded-xl bg-gray-50 px-3.5 py-2.5 shadow-sm">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <div className="text-sm font-medium text-gray-900">{t.trainingName}</div>
                                        <code className="rounded bg-gray-200 px-1.5 py-0.5 text-[10px] text-gray-600">{t.trainingId}</code>
                                    </div>
                                    <div className="text-[13px] text-gray-500">{formatDate(t.completedDate)}</div>
                                </div>
                                <ExpirationBadge status={t.status} />
                            </div>
                        ))}
                    </div>
                </DashboardCard>

                {/* 🏥 Lékařské prohlídky */}
                <DashboardCard
                    title="Lékařské prohlídky"
                    count={medicals.length}
                    linkHref={`/medical/${employee.personalNumber}`}
                    linkLabel="Zobrazit vše"
                    isEmpty={medicals.length === 0}
                    emptyMessage="Žádné záznamy o prohlídkách."
                >
                    <div className="space-y-2.5">
                        {medicals.slice(0, 4).map((m, idx) => (
                            <div key={idx} className="flex items-center justify-between rounded-xl bg-gray-50 px-3.5 py-2.5 shadow-sm">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <div className="text-sm font-medium text-gray-900">{m.examTypeName}</div>
                                        <code className="rounded bg-gray-200 px-1.5 py-0.5 text-[10px] text-gray-600">{m.examTypeId}</code>
                                    </div>
                                    <div className="text-[13px] text-gray-500">{formatDate(m.examDate)} · {m.result}</div>
                                </div>
                                <ExpirationBadge status={m.status} />
                            </div>
                        ))}
                    </div>
                </DashboardCard>

                {/* 🛡️ OOPP */}
                <DashboardCard
                    title="OOPP"
                    count={oopp.length}
                    linkHref={`/oopp/${employee.personalNumber}`}
                    linkLabel="Zobrazit vše"
                    isEmpty={oopp.length === 0}
                    emptyMessage="Žádné záznamy o výdejích."
                >
                    <div className="space-y-2.5">
                        {oopp.slice(0, 4).map((o, idx) => (
                            <div key={idx} className="flex items-center justify-between rounded-xl bg-gray-50 px-3.5 py-2.5 shadow-sm">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <div className="text-sm font-medium text-gray-900">{o.ooppItemName}</div>
                                        <code className="rounded bg-gray-200 px-1.5 py-0.5 text-[10px] text-gray-600">{o.ooppItemId}</code>
                                    </div>
                                    <div className="text-[13px] text-gray-500">{formatDate(o.lastIssueDate)} · {o.size || ""} {o.quantity} ks</div>
                                </div>
                                <ExpirationBadge status={o.status} />
                            </div>
                        ))}
                    </div>
                </DashboardCard>

                {/* 📊 ILUO */}
                <DashboardCard
                    title="ILUO"
                    count={iluo.length}
                    linkHref={`/iluo/${employee.personalNumber}`}
                    linkLabel="Zobrazit vše"
                    isEmpty={iluo.length === 0}
                    emptyMessage="Žádné ILUO hodnocení."
                >
                    <div className="space-y-2.5">
                        {iluo.slice(0, 5).map((i, idx) => (
                            <div key={idx} className="flex items-center justify-between rounded-xl bg-gray-50 px-3.5 py-2.5 shadow-sm">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <div className="text-sm font-medium text-gray-900">{i.skillName}</div>
                                        <code className="rounded bg-gray-200 px-1.5 py-0.5 text-[10px] text-gray-600">{i.skillId}</code>
                                    </div>
                                    <div className="text-[13px] text-gray-500">{i.workCenterName}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <IluoBadge level={i.currentLevel} />
                                    <span className="text-[13px] text-gray-400">→</span>
                                    <IluoBadge level={i.targetLevel} />
                                </div>
                            </div>
                        ))}
                    </div>
                </DashboardCard>
            </div>
        </div>
    );
}

function IluoBadge({ level }: { level: IluoLevel }) {
    const labels: Record<IluoLevel, string> = { I: "I", L: "L", U: "U", O: "O" };
    return (
        <span className={`iluo-badge-${level} inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold`}>{labels[level]}</span>
    );
}

function InfoItem({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex flex-col gap-1">
            <span className="text-[13px] font-semibold uppercase tracking-wider text-gray-400">{label}</span>
            <span className="text-sm font-medium text-gray-900">{value || "—"}</span>
        </div>
    );
}

function DashboardCard({
    title,
    count,
    linkHref,
    linkLabel,
    isEmpty,
    emptyMessage,
    children,
}: {
    title: string;
    count: number;
    linkHref: string;
    linkLabel: string;
    isEmpty: boolean;
    emptyMessage: string;
    children: React.ReactNode;
}) {
    return (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3.5">
                <h3 className="text-base font-bold text-gray-900">
                    {title} <span className="ml-1 text-[13px] font-normal text-gray-400">({count})</span>
                </h3>
                <Link href={linkHref} className="text-[13px] font-medium text-[#0054A6] transition-colors hover:underline">
                    {linkLabel} →
                </Link>
            </div>
            <div className="px-5 py-4">
                {isEmpty ? (
                    <p className="py-5 text-center text-sm text-gray-500">{emptyMessage}</p>
                ) : (
                    children
                )}
            </div>
        </div>
    );
}
