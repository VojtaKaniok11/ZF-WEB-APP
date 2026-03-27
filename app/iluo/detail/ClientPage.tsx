"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import type { EmployeeDetail } from "@/types/employee";
import type { IluoLevel } from "@/types/iluo";
import { getApiUrl } from "@/lib/constants";
import DetailTabs from "@/components/DetailTabs";

interface IluoRecord {
    assessmentId: string;
    skillId: string;
    skillName: string;
    workCenterId: string;
    workCenterName: string;
    category: string;
    currentLevel: IluoLevel;
    targetLevel: IluoLevel;
    assessmentDate: string;
    assessorName: string;
    nextReviewDate: string | null;
    notes: string;
}

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
                    style={{ width: `${Math.min(progress, 100)}%`, backgroundColor: progress >= 100 ? "#047857" : "#0054A6" }}
                />
            </div>
            <span className="text-xs text-gray-400">{Math.round(progress)}%</span>
        </div>
    );
}


export default function IluoDetailPage() {
    const searchParams = useSearchParams();
    const personalNumber = searchParams.get("pn");

    const [employee, setEmployee] = useState<EmployeeDetail | null>(null);
    const [records, setRecords] = useState<IluoRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    // Modal state
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
    const [printWorkCenterId, setPrintWorkCenterId] = useState("");
    const [printDateSince, setPrintDateSince] = useState("");

    // Change status state
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [statusForm, setStatusForm] = useState({
        assessmentId: "",
        newLevel: "I" as IluoLevel
    });

    useEffect(() => {
        if (!personalNumber) {
            setIsLoading(false);
            return;
        }
        const pn = encodeURIComponent(personalNumber);

        async function load() {
            setIsLoading(true);
            const apiUrl = getApiUrl();
            try {
                const [empRes, iluoRes] = await Promise.all([
                    fetch(`${apiUrl}/employees/${pn}`),
                    fetch(`${apiUrl}/iluo/${pn}`),
                ]);
                const empJson = await empRes.json();
                if (!empJson.success) { setNotFound(true); return; }
                setEmployee(empJson.data);

                const iluoJson = await iluoRes.json();
                if (iluoJson.success) setRecords(iluoJson.data);
            } catch {
                setNotFound(true);
            } finally {
                setIsLoading(false);
            }
        }

        load();
    }, [personalNumber]);

    function formatDate(d: string | null): string {
        if (!d) return "—";
        return new Date(d).toLocaleDateString("cs-CZ", { day: "2-digit", month: "2-digit", year: "numeric" });
    }

    const handlePrint = async () => {
        setIsPrintModalOpen(false);
        try {
            const html2pdfModule = await import("html2pdf.js");
            const html2pdf = html2pdfModule.default || html2pdfModule;
            const element = document.getElementById("pdf-content");
            if (!element) return;
            const opt: any = {
                margin: 5,
                filename: `kvalifikacni-karta-${employee?.personalNumber}.pdf`,
                image: { type: "jpeg" as const, quality: 0.98 },
                html2canvas: { scale: 3, useCORS: true },
                jsPDF: { unit: "mm", format: "a5", orientation: "landscape" as const }
            };
            await html2pdf().set(opt).from(element).save();
        } catch (error) {
            console.error("Chyba při tisku:", error);
        }
    };

    const handleChangeStatus = async () => {
        setIsSubmitting(true);
        const apiUrl = getApiUrl();
        try {
            const res = await fetch(`${apiUrl}/iluo/${personalNumber}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    assessmentId: statusForm.assessmentId,
                    newLevel: statusForm.newLevel,
                }),
            });
            if (res.ok) {
                const iluoRes = await fetch(`${apiUrl}/iluo/${personalNumber}`);
                const iluoJson = await iluoRes.json();
                if (iluoJson.success) setRecords(iluoJson.data);
                setIsStatusModalOpen(false);
            }
        } catch (error) {
            console.error("Chyba při změně stavu:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return (
        <div className="flex min-h-[60vh] items-center justify-center">
            <Loader2 size={32} className="animate-spin text-blue-500" />
        </div>
    );

    if (notFound || !employee) return (
        <div className="mx-auto max-w-5xl px-4 py-12 text-center">
            <p className="text-gray-500">Zaměstnanec nenalezen.</p>
            <Link href="/iluo" className="mt-4 inline-block text-sm text-blue-600 hover:underline">← Zpět</Link>
        </div>
    );

    const grouped = records.reduce((acc, r) => {
        if (!acc[r.workCenterName]) acc[r.workCenterName] = [];
        acc[r.workCenterName].push(r);
        return acc;
    }, {} as Record<string, IluoRecord[]>);

    return (
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
            <Link href={`/employee/profile?pn=${employee.personalNumber}`} className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-[#0054A6]">
                <ArrowLeft size={16} /> Zpět na profil zaměstnance
            </Link>

            <DetailTabs />

            <div className="mb-8 flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-violet-200 text-2xl font-bold text-violet-700">
                    {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{employee.firstName} {employee.lastName}</h1>
                    <p className="mt-0.5 text-sm text-gray-500">{employee.personalNumber} · {employee.department} · {employee.position} · {employee.workcenterName}</p>
                </div>
            </div>

            <div className="mb-6 flex flex-wrap justify-between items-end gap-4">
                <div className="flex flex-wrap gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 mr-2 self-center">Legenda:</span>
                    <IluoBadge level="I" />
                    <IluoBadge level="L" />
                    <IluoBadge level="U" />
                    <IluoBadge level="O" />
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => {
                            if (records.length > 0) {
                                setStatusForm({
                                    assessmentId: records[0].assessmentId,
                                    newLevel: records[0].currentLevel
                                });
                            }
                            setIsStatusModalOpen(true);
                        }}
                        className="flex items-center gap-2 rounded-xl border border-blue bg-white px-5 py-3 text-sm font-semibold text-[#0054A6] shadow-sm transition-all hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black cursor-pointer"
                    >
                        Změna stavu
                    </button>
                    <button
                        onClick={() => setIsPrintModalOpen(true)}
                        className="flex items-center gap-2 rounded-xl bg-[#0054A6] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-[#0054A6] focus:ring-offset-2 cursor-pointer"
                    >
                        Tisk PDF
                    </button>
                </div>
            </div>

            {records.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-16 shadow-sm">
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-bold text-blue-700">Člověk v zácviku bez záznamu</span>
                    <p className="text-sm text-gray-400 mt-3">Zaměstnanec zatím neabsolvoval žádné testy zručnosti.</p>
                </div>
            ) : (
                Object.entries(grouped).map(([wcName, skills]) => (
                    <div key={wcName} className="mb-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                        <div className="border-b border-gray-200 px-5 py-4" style={{ backgroundColor: "#0054A6" }}>
                            <h2 className="text-base font-semibold text-white">{wcName}</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-200 bg-gray-50/80">
                                        <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Pracoviště</th>
                                        <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Aktuální</th>
                                        <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Cíl</th>
                                        <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Progres</th>
                                        <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Hodnocení</th>
                                        <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Hodnotitel</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {skills.map((r, idx) => (
                                        <tr key={idx} className="transition-colors hover:bg-blue-50/40">
                                            <td className="px-5 py-3 font-medium text-gray-900">{r.workCenterName}</td>
                                            <td className="px-5 py-3"><IluoBadge level={r.currentLevel} /></td>
                                            <td className="px-5 py-3"><IluoBadge level={r.targetLevel} /></td>
                                            <td className="px-5 py-3"><ProgressBar current={r.currentLevel} target={r.targetLevel} /></td>
                                            <td className="px-5 py-3 tabular-nums text-gray-600">{formatDate(r.assessmentDate)}</td>
                                            <td className="px-5 py-3 text-gray-600">{r.assessorName}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))
            )}

            {/* Modals are simplified here for brevity, assuming standard logic */}
            {isPrintModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    {/* Print Modal Content... */}
                    <div className="bg-white p-6 rounded-2xl shadow-xl">
                        <h2 className="text-xl font-bold mb-4">Tisk PDF</h2>
                        <input type="number" placeholder="Středisko" value={printWorkCenterId} onChange={e => setPrintWorkCenterId(e.target.value)} className="border p-2 w-full mb-2" />
                        <input type="date" value={printDateSince} onChange={e => setPrintDateSince(e.target.value)} className="border p-2 w-full mb-4" />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setIsPrintModalOpen(false)} className="px-4 py-2 border rounded">Zrušit</button>
                            <button onClick={handlePrint} className="bg-blue-600 text-white px-4 py-2 rounded">Tisk</button>
                        </div>
                    </div>
                </div>
            )}

            {isStatusModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                   {/* Status Modal Content... */}
                    <div className="bg-white p-6 rounded-2xl shadow-xl">
                        <h2 className="text-xl font-bold mb-4">Změna stavu</h2>
                        <select value={statusForm.newLevel} onChange={e => setStatusForm({...statusForm, newLevel: e.target.value as IluoLevel})} className="border p-2 w-full mb-4">
                            <option value="I">I</option>
                            <option value="L">L</option>
                            <option value="U">U</option>
                            <option value="O">O</option>
                        </select>
                         <div className="flex justify-end gap-2">
                            <button onClick={() => setIsStatusModalOpen(false)} className="px-4 py-2 border rounded">Zrušit</button>
                            <button onClick={handleChangeStatus} className="bg-blue-600 text-white px-4 py-2 rounded">Uložit</button>
                        </div>
                    </div>
                </div>
            )}

            {/* PDF Template hidden */}
            <div id="pdf-content" className="hidden">
                {/* PDF content here if needed */}
            </div>
        </div>
    );
}
