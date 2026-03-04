"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import type { EmployeeDetail } from "@/types/employee";
import type { IluoLevel } from "@/types/iluo";

interface IluoRecord {
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
    const params = useParams();
    const personalNumber = params.personalNumber as string;

    const [employee, setEmployee] = useState<EmployeeDetail | null>(null);
    const [records, setRecords] = useState<IluoRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    // Modal state
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
    const [printWorkCenterId, setPrintWorkCenterId] = useState("");
    const [printDateSince, setPrintDateSince] = useState("");

    useEffect(() => {
        if (!personalNumber) return;
        const pn = encodeURIComponent(personalNumber);

        async function load() {
            setIsLoading(true);
            try {
                const [empRes, iluoRes] = await Promise.all([
                    fetch(`/api/employees/${pn}`),
                    fetch(`/api/iluo/${pn}`),
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
            // Dynamický import pluginu pro vygenerování PDF až na základě akce (ušetří bundle velikost, zamezí SSR problémům)
            const html2pdfModule = await import("html2pdf.js");
            const html2pdf = html2pdfModule.default || html2pdfModule;

            const element = document.getElementById("pdf-content");
            if (!element) return;

            const opt = {
                margin: 5,
                filename: `kvalifikacni-karta-${employee?.personalNumber}.pdf`,
                image: { type: "jpeg", quality: 0.98 },
                html2canvas: { scale: 3, useCORS: true },
                jsPDF: { unit: "mm", format: "a5", orientation: "landscape" }
            };

            await html2pdf().set(opt).from(element).save();
        } catch (error) {
            console.error("Chyba při tisku:", error);
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

            <div className="mb-6 flex flex-wrap justify-between items-end gap-4">
                <div className="flex flex-wrap gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 mr-2 self-center">Legenda:</span>
                    <IluoBadge level="I" />
                    <IluoBadge level="L" />
                    <IluoBadge level="U" />
                    <IluoBadge level="O" />
                </div>

                <button
                    onClick={() => setIsPrintModalOpen(true)}
                    className="flex items-center gap-2 rounded-xl bg-[#0054A6] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-[#0054A6] focus:ring-offset-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0v3.396c0 .604.49 1.093 1.093 1.093h8.314c.604 0 1.093-.489 1.093-1.093V6.828Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 6.828a2.25 2.25 0 0 0-2.25-2.25h-1.5a2.25 2.25 0 0 0-2.25 2.25v3.396h6V6.828Z" />
                    </svg>
                    Tisk PDF
                </button>
            </div>

            {records.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-16 shadow-sm">
                    <p className="text-sm text-gray-400">Žádné záznamy ILUO.</p>
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

            {/* Modální dialog pro tisk */}
            {isPrintModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                        <h2 className="mb-6 text-xl font-bold text-gray-900">Tisk kvalifikační karty</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Zadejte číslo aktuálního střediska:
                                </label>
                                <input
                                    type="number"
                                    value={printWorkCenterId}
                                    onChange={(e) => setPrintWorkCenterId(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-800 focus:border-[#0054A6] focus:outline-none focus:ring-1 focus:ring-[#0054A6]"
                                    placeholder="např. 910"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Na akt. středisku od:
                                </label>
                                <input
                                    type="date"
                                    value={printDateSince}
                                    onChange={(e) => setPrintDateSince(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-800 focus:border-[#0054A6] focus:outline-none focus:ring-1 focus:ring-[#0054A6]"
                                />
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end gap-3">
                            <button
                                onClick={() => setIsPrintModalOpen(false)}
                                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
                            >
                                Zrušit
                            </button>
                            <button
                                onClick={handlePrint}
                                disabled={!printWorkCenterId || !printDateSince}
                                className={`rounded-lg px-6 py-2 text-sm font-medium text-white transition-all ${!printWorkCenterId || !printDateSince
                                    ? "cursor-not-allowed bg-gray-400"
                                    : "bg-[#0054A6] shadow-md hover:bg-blue-700"
                                    }`}
                            >
                                Tisk
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* SKRYTÁ PDF ŠABLONA (mimo vizuální oblast obrazovky) */}
            <div className="absolute left-[-9999px] top-0 pointer-events-none">
                <div id="pdf-content" className="w-[180mm] bg-[#fdfdfd] text-[#000000] pb-2">
                    {/* Sekce horní polovina karty */}
                    <div className="flex px-1 gap-5 mb-2 mt-2">
                        {/* Fotka Placeholder (zmenšená výška, rozšířená šířka pro lepší poměr) */}
                        <div className="w-[43mm] h-[55mm] bg-[#9ba3aa] flex items-center justify-center shrink-0 border border-[#9ca3af] ml-1">
                            {/* SVG siluety člověka */}
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-[18mm] h-[18mm] text-[#6b7280]">
                                <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
                            </svg>
                        </div>

                        {/* Pravý sloupec (Nadpis + Osobní údaje) */}
                        <div className="flex-1 flex flex-col pt-1">
                            {/* Horní hlavička / Tmavě zelený pruh vedle fotky */}
                            <div className="bg-[#2a7a58] px-3 h-10 flex items-center border-[#216146] mb-4">
                                <span className="text-[#000000] font-bold text-[22px] tracking-wide leading-none mb-6">Kvalifikační karta ILU</span>
                            </div>

                            {/* Jméno a údaje - striktně vycentrované flexboxy */}
                            <div className="flex-1 flex flex-col justify-start space-y-3 px-2">
                                <div className="flex items-center">
                                    <span className="w-[45mm] text-[#1c4d82] text-[13px] font-bold leading-none">Příjmení a jméno:</span>
                                    <span className="text-[#1c4d82] text-[20px] font-bold tracking-tight leading-none">{employee?.lastName} {employee?.firstName}</span>
                                </div>
                                <div className="flex items-center">
                                    <span className="w-[45mm] text-[#1c4d82] text-[13px] font-bold leading-none">Osobní číslo:</span>
                                    <span className="text-[#000000] font-bold text-[14px] leading-none">{employee?.personalNumber}</span>
                                </div>
                                <div className="flex items-center">
                                    <span className="w-[45mm] text-[#1c4d82] text-[13px] font-bold leading-none">Aktuální středisko:</span>
                                    <span className="text-[#000000] font-bold text-[14px] leading-none">{printWorkCenterId}</span>
                                </div>
                                <div className="flex items-center">
                                    <span className="w-[45mm] text-[#1c4d82] text-[13px] font-bold leading-none">Na akt. středisku od:</span>
                                    <span className="text-[#000000] font-bold text-[14px] leading-none">{printDateSince ? formatDate(printDateSince) : ""}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabulka pracovišť */}
                    <div className="mx-1 mt-1 border-t border-b border-[#9ca3af] pt-0 pb-[1mm]">
                        {/* Hlavička tabulky */}
                        <div className="bg-[#2a7a58] text-[#000000] text-[13px] px-2 h-9 flex items-center justify-between">
                            <span className="font-bold leading-none mb-2">označení a popis pracoviště</span>
                            <span className="font-bold leading-none w-[25mm] text-center mb-2">kvalifikace</span>
                        </div>

                        {/* Tělo tabulky */}
                        <div className="text-[12px] font-bold flex flex-col divide-y divide-[#d1d5db]">
                            {records.map((r, i) => (
                                <div key={i} className="flex items-center justify-between px-3 pt-[4px] pb-[6px] bg-[#fdfdfd]">
                                    <span className="uppercase text-[#1f2937] leading-none">{r.workCenterName}</span>
                                    <span className="uppercase text-[#1f2937] leading-none w-[25mm] text-center">{r.currentLevel}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Timestamp do rohu */}
                    <div className="text-right text-[9px] text-[#9ca3af] mt-2 pr-2">
                        Vytištěno: {new Date().toLocaleString("cs-CZ")}
                    </div>
                </div>
            </div>

        </div>
    );
}
