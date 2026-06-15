"use client";

import { useState, useMemo } from "react";
import { X, Search, Check, FileText, FileSpreadsheet, MapPin, User, Calendar, Clock } from "lucide-react";
import { TrainingV2 } from "./TrainingsClientV2";

interface EmployeeStatus {
    employeeId: number;
    firstName: string;
    lastName: string;
    personalNumber: string;
    department: string;
    workcenter: string;
    category: string;
    costNumber: string;
    costNumberDesc: string;
    hasCompleted: boolean;
    completionDate: string | null;
    expirationDate: string | null;
    validityStatus: 'Platné' | 'Neplatné' | 'Blíží se expirace';
    isLegalOrExternal: boolean;
    hiringDate: string | null;
}

interface Props {
    training: TrainingV2 | null;
    employees: EmployeeStatus[];
    onClose: () => void;
}

function pad(n: number) {
    return n.toString().padStart(2, "0");
}

// Pevné údaje dokumentu (pravý horní box prezenční listiny)
const DOC_DATUM = "15/01/2025";
const DOC_INDEX = "09";
const DOC_NUMBER = "19-021-FRYR02";

export default function AttendanceSheetModalV2({ training, employees, onClose }: Props) {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

    const [place, setPlace] = useState("");
    const [trainer, setTrainer] = useState("");
    const [date, setDate] = useState(todayStr);
    const [timeFrom, setTimeFrom] = useState(timeStr);
    const [timeTo, setTimeTo] = useState("");

    const [searchQuery, setSearchQuery] = useState("");
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [generating, setGenerating] = useState(false);
    const [generatingExcel, setGeneratingExcel] = useState(false);

    const filteredEmployees = useMemo(() => {
        if (!searchQuery.trim()) return employees;
        const s = searchQuery.toLowerCase();
        return employees.filter(emp =>
            emp.firstName.toLowerCase().includes(s) ||
            emp.lastName.toLowerCase().includes(s) ||
            (emp.personalNumber && emp.personalNumber.toLowerCase().includes(s))
        );
    }, [employees, searchQuery]);

    const allFilteredSelected = filteredEmployees.length > 0 && filteredEmployees.every(e => selectedIds.has(e.employeeId));

    const toggleOne = (id: number) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id); else next.add(id);
        setSelectedIds(next);
    };

    const toggleAllFiltered = () => {
        const next = new Set(selectedIds);
        if (allFilteredSelected) {
            filteredEmployees.forEach(e => next.delete(e.employeeId));
        } else {
            filteredEmployees.forEach(e => next.add(e.employeeId));
        }
        setSelectedIds(next);
    };

    const timeRange = timeTo ? `${timeFrom} - ${timeTo}` : timeFrom;
    const isValid = place.trim() !== "" && trainer.trim() !== "" && date !== "" && timeFrom !== "" && timeTo !== "" && selectedIds.size > 0;

    const formatDateCz = (iso: string) => {
        if (!iso) return "";
        const [y, m, d] = iso.split("-");
        return `${d}.${m}.${y}`;
    };

    const buildHtml = (selected: EmployeeStatus[], zfLogoUri: string) => {

        const MIN_ROWS = 19;
        const rows: string[] = [];
        for (let i = 0; i < Math.max(MIN_ROWS, selected.length); i++) {
            const emp = selected[i];
            const cell = "border:1px solid #000; padding:7px 6px; height:24px; font-size:10px; vertical-align:middle;";
            rows.push(`
                <tr>
                    <td style="${cell} text-align:center;">${i + 1}</td>
                    <td style="${cell} font-weight:600;">${emp ? escapeHtml(emp.lastName) : ""}</td>
                    <td style="${cell}">${emp ? escapeHtml(emp.firstName) : ""}</td>
                    <td style="${cell} text-align:center;">${emp ? escapeHtml(emp.personalNumber || "") : ""}</td>
                    <td style="${cell} text-align:center;">${emp ? escapeHtml(emp.workcenter || "") : ""}</td>
                    <td style="${cell}"></td>
                    <td style="${cell}"></td>
                </tr>
            `);
        }

        return `
        <div id="attendance-sheet" style="width:760px; padding:18px; font-family:Arial, sans-serif; color:#000; background:#fff;">
            <table style="width:100%; border-collapse:collapse; border:1px solid #000; table-layout:fixed;">
                <tr>
                    <td style="width:34%; border:1px solid #000; padding:0; vertical-align:top;">
                        <table style="width:100%; border-collapse:collapse; font-size:9px;">
                            <tr><td style="padding:3px 4px; width:45%; border-bottom:1px solid #ccc;">DATUM:</td><td style="padding:3px 4px; color:#c00; border-bottom:1px solid #ccc;">${escapeHtml(DOC_DATUM)}</td></tr>
                            <tr><td style="padding:3px 4px; border-bottom:1px solid #ccc;">INDEX:</td><td style="padding:3px 4px; color:#c00; border-bottom:1px solid #ccc;">${escapeHtml(DOC_INDEX)}</td></tr>
                            <tr><td style="padding:3px 4px; border-bottom:1px solid #ccc;">DOC #</td><td style="padding:3px 4px; color:#c00; border-bottom:1px solid #ccc;">${escapeHtml(DOC_NUMBER)}</td></tr>
                            <tr><td style="padding:3px 4px;">STRÁNKA:</td><td style="padding:3px 4px;">1 z 1</td></tr>
                        </table>
                    </td>
                    <td style="width:36%; border:1px solid #000; text-align:center; vertical-align:middle;">
                        <div style="font-size:15px; font-weight:bold;">PREZENČNÍ LISTINA</div>
                        <div style="font-size:15px; font-weight:bold;">ŠKOLENÍ</div>
                    </td>
                    <td style="width:30%; border:1px solid #000; padding:4px 8px; vertical-align:middle;">
                        <table style="width:100%; border-collapse:collapse;">
                            <tr>
                                <td style="width:46px; vertical-align:middle;">
                                    <img src="${zfLogoUri}" width="40" height="40" style="display:block;" alt="ZF" />
                                </td>
                                <td style="vertical-align:middle; padding-left:8px;">
                                    <div style="font-size:10px; font-weight:bold;">ZF Automotive Czech s.r.o.</div>
                                    <div style="font-size:10px;">ZF Aftermarket Frýdlant</div>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>

            <table style="width:100%; border-collapse:collapse; border:1px solid #000; border-top:none;">
                <tr>
                    <td style="padding:6px 8px; font-size:11px;">
                        <span style="color:#555;">Název / Téma školení</span>
                        <div style="font-size:13px; font-weight:bold; margin-top:3px; min-height:18px;">${escapeHtml(training?.name || "")}</div>
                    </td>
                    <td style="width:30%; border-left:1px solid #000; padding:6px 8px; font-size:11px; vertical-align:top;">
                        <span style="color:#555;">Evidenční číslo PL</span>
                        <div style="min-height:18px;"></div>
                    </td>
                </tr>
            </table>

            <table style="width:100%; border-collapse:collapse; border:1px solid #000; border-top:none; font-size:11px;">
                <tr>
                    <td style="width:34%; border-right:1px solid #000; padding:0; vertical-align:top;">
                        <table style="width:100%; border-collapse:collapse;">
                            <tr><td style="padding:6px 8px; width:35%; color:#333; border-bottom:1px solid #ccc;">Místo</td><td style="padding:6px 8px; font-weight:bold; border-bottom:1px solid #ccc;">${escapeHtml(place)}</td></tr>
                            <tr><td style="padding:6px 8px; color:#333; border-bottom:1px solid #ccc;">Datum</td><td style="padding:6px 8px; font-weight:bold; border-bottom:1px solid #ccc;">${escapeHtml(formatDateCz(date))}</td></tr>
                            <tr><td style="padding:6px 8px; color:#333; border-bottom:1px solid #ccc;">Čas</td><td style="padding:6px 8px; font-weight:bold; border-bottom:1px solid #ccc;">${escapeHtml(timeRange)}</td></tr>
                            <tr><td style="padding:6px 8px; color:#333; border-bottom:1px solid #ccc;">Školitel</td><td style="padding:6px 8px; font-weight:bold; border-bottom:1px solid #ccc;">${escapeHtml(trainer)}</td></tr>
                            <tr><td style="padding:6px 8px; color:#888; border-bottom:1px solid #ccc;">společnost</td><td style="padding:6px 8px; border-bottom:1px solid #ccc;"></td></tr>
                            <tr><td style="padding:12px 8px; color:#888;">podpis</td><td style="padding:12px 8px;"></td></tr>
                        </table>
                    </td>
                    <td style="padding:6px 8px; vertical-align:top;">
                        <span style="color:#333;">Program - osnova</span>
                    </td>
                </tr>
            </table>

            <table style="width:100%; border-collapse:collapse; border:1px solid #000; border-top:none;">
                <tr><td style="text-align:center; font-size:11px; font-weight:bold; padding:4px;">Obsahu školení jsem porozuměl/a a toto potvrzuji svým podpisem.</td></tr>
            </table>

            <table style="width:100%; border-collapse:collapse; border:1px solid #000; border-top:none; font-size:10px; table-layout:fixed;">
                <thead>
                    <tr style="background:#f0f0f0;">
                        <th style="border:1px solid #000; padding:4px; width:5%;">#</th>
                        <th style="border:1px solid #000; padding:4px; width:18%;">Příjmení</th>
                        <th style="border:1px solid #000; padding:4px; width:16%;">Jméno</th>
                        <th style="border:1px solid #000; padding:4px; width:13%;">Osobní číslo</th>
                        <th style="border:1px solid #000; padding:4px; width:11%;">Středisko</th>
                        <th style="border:1px solid #000; padding:4px; width:15%;">Čárový kód</th>
                        <th style="border:1px solid #000; padding:4px; width:22%;">Podpis - porozuměl školení</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows.join("")}
                </tbody>
            </table>

            <div style="margin-top:6px; font-size:8px; color:#888; display:flex; justify-content:space-between;">
                <span>1 z 1</span>
                <span>Skartační znak a doba uchování: S20</span>
            </div>
        </div>
        `;
    };

    const loadLogoDataUri = async (): Promise<string> => {
        try {
            const logoRes = await fetch("/ZF_logo_STD_Blue_3CC.svg.png");
            const logoBlob = await logoRes.blob();
            return await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.readAsDataURL(logoBlob);
            });
        } catch {
            return "";
        }
    };

    const handleGenerate = async () => {
        if (!isValid || generating) return;
        setGenerating(true);
        try {
            const selected = employees.filter(e => selectedIds.has(e.employeeId));

            // Load ZF logo as base64 so html2canvas renders it reliably offscreen
            const zfLogoUri = await loadLogoDataUri();

            const html = buildHtml(selected, zfLogoUri);

            const container = document.createElement("div");
            container.style.position = "fixed";
            container.style.left = "-10000px";
            container.style.top = "0";
            container.innerHTML = html;
            document.body.appendChild(container);

            const element = container.querySelector("#attendance-sheet") as HTMLElement | null;
            if (!element) {
                document.body.removeChild(container);
                setGenerating(false);
                return;
            }

            const html2pdfModule = await import("html2pdf.js");
            const html2pdf = html2pdfModule.default || html2pdfModule;
            const safeName = (training?.name || "skoleni").replace(/[/\\?%*:|"<>]/g, "-");

            await html2pdf()
                .set({
                    margin: 6,
                    filename: `Prezencni_listina_${safeName}_${date}.pdf`,
                    image: { type: "jpeg", quality: 0.98 },
                    html2canvas: { scale: 2, useCORS: true },
                    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
                })
                .from(element)
                .save();

            document.body.removeChild(container);
            onClose();
        } catch (err) {
            console.error("Chyba při generování PDF:", err);
            alert("Nepodařilo se vygenerovat PDF. Zkuste to prosím znovu.");
        } finally {
            setGenerating(false);
        }
    };

    const handleGenerateExcel = async () => {
        if (!isValid || generatingExcel) return;
        setGeneratingExcel(true);
        try {
            const selected = employees.filter(e => selectedIds.has(e.employeeId));
            const zfLogoUri = await loadLogoDataUri();

            const ExcelJSImport = await import("exceljs");
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const ExcelJS: any = (ExcelJSImport as any).default ?? ExcelJSImport;

            const workbook = new ExcelJS.Workbook();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const ws: any = workbook.addWorksheet("Prezenční listina", {
                pageSetup: {
                    paperSize: 9, // A4
                    orientation: "portrait",
                    fitToPage: true,
                    fitToWidth: 1,
                    fitToHeight: 0,
                    margins: { left: 0.3, right: 0.3, top: 0.3, bottom: 0.3, header: 0.2, footer: 0.2 },
                },
            });

            // Šířky sloupců A–G (kopíruje rozložení PDF tabulky)
            ws.columns = [
                { width: 9 },   // A  #
                { width: 20 },  // B  Příjmení
                { width: 16 },  // C  Jméno
                { width: 16 },  // D  Osobní číslo
                { width: 12 },  // E  Středisko
                { width: 16 },  // F  Čárový kód (stejně jako D - Osobní číslo)
                { width: 27 },  // G  Podpis (zmenšeno o ~10 %)
            ];

            const thin = { style: "thin", color: { argb: "FF000000" } };
            const box = { top: thin, left: thin, bottom: thin, right: thin };
            const RED = { argb: "FFCC0000" };
            const GREY = { argb: "FF888888" };
            const DARK = { argb: "FF333333" };

            const borderRange = (c1: number, r1: number, c2: number, r2: number) => {
                for (let r = r1; r <= r2; r++) {
                    for (let c = c1; c <= c2; c++) {
                        ws.getRow(r).getCell(c).border = box;
                    }
                }
            };

            // ---- Hlavička (řádky 1–4): metadata | název | logo ----
            const meta = [
                ["DATUM:", DOC_DATUM],
                ["INDEX:", DOC_INDEX],
                ["DOC #", DOC_NUMBER],
                ["STRÁNKA:", "1 z 1"],
            ];
            meta.forEach((m, i) => {
                const r = i + 1;
                ws.getCell(`A${r}`).value = m[0];
                ws.getCell(`A${r}`).font = { size: 10 };
                ws.getCell(`A${r}`).alignment = { vertical: "middle" };
                ws.getCell(`B${r}`).value = m[1];
                ws.getCell(`B${r}`).font = { size: 10, color: i < 3 ? RED : { argb: "FF000000" } };
                ws.getCell(`B${r}`).alignment = { vertical: "middle" };
                ws.getRow(r).height = 18;
            });

            ws.mergeCells("C1:E4");
            const titleCell = ws.getCell("C1");
            titleCell.value = "PREZENČNÍ LISTINA\nŠKOLENÍ";
            titleCell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
            titleCell.font = { bold: true, size: 16 };

            ws.mergeCells("F1:G4");
            const compCell = ws.getCell("F1");
            compCell.value = "ZF Automotive Czech s.r.o.\nZF Aftermarket Frýdlant";
            compCell.alignment = { horizontal: "left", vertical: "bottom", wrapText: true };
            compCell.font = { bold: true, size: 10 };

            if (zfLogoUri) {
                try {
                    // Logo ZF nad textem firmy (vlevo nahoře v pravém boxu)
                    const imgId = workbook.addImage({ base64: zfLogoUri, extension: "png" });
                    ws.addImage(imgId, { tl: { col: 5.1, row: 0.05 }, ext: { width: 36, height: 36 } });
                } catch { /* logo nepřidáno */ }
            }

            borderRange(1, 1, 2, 4);  // metadata box
            borderRange(3, 1, 5, 4);  // titul
            borderRange(6, 1, 7, 4);  // logo + firma

            // ---- Řádek 5: název školení + evidenční číslo ----
            ws.mergeCells("A5:E5");
            ws.getCell("A5").value = {
                richText: [
                    { font: { size: 10, color: GREY }, text: "Název / Téma školení\n" },
                    { font: { bold: true, size: 10 }, text: training?.name || "" },
                ],
            };
            ws.getCell("A5").alignment = { vertical: "middle", wrapText: true };
            ws.mergeCells("F5:G5");
            ws.getCell("F5").value = { richText: [{ font: { size: 10, color: GREY }, text: "Evidenční číslo PL" }] };
            ws.getCell("F5").alignment = { vertical: "top", wrapText: true };
            ws.getRow(5).height = 32;
            borderRange(1, 5, 5, 5);
            borderRange(6, 5, 7, 5);

            // ---- Řádky 6–11: informace (vlevo) + program (vpravo) ----
            const info: [string, string][] = [
                ["Místo", place],
                ["Datum", formatDateCz(date)],
                ["Čas", timeRange],
                ["Školitel", trainer],
                ["společnost", ""],
                ["podpis", ""],
            ];
            info.forEach((it, i) => {
                const r = 6 + i;
                ws.getCell(`A${r}`).value = it[0];
                ws.getCell(`A${r}`).font = { size: 10, color: i >= 4 ? GREY : DARK };
                ws.getCell(`A${r}`).alignment = { vertical: "middle" };
                ws.mergeCells(`B${r}:C${r}`);
                ws.getCell(`B${r}`).value = it[1];
                ws.getCell(`B${r}`).font = { size: 10, bold: i < 4 };
                ws.getCell(`B${r}`).alignment = { vertical: "middle" };
                ws.getRow(r).height = i === 5 ? 28 : 18;
            });
            ws.mergeCells("D6:G11");
            ws.getCell("D6").value = "Program - osnova";
            ws.getCell("D6").font = { size: 10, color: DARK };
            ws.getCell("D6").alignment = { vertical: "top", horizontal: "left", wrapText: true };
            borderRange(1, 6, 3, 11);
            borderRange(4, 6, 7, 11);

            // ---- Řádek 12: potvrzovací věta ----
            ws.mergeCells("A12:G12");
            ws.getCell("A12").value = "Obsahu školení jsem porozuměl/a a toto potvrzuji svým podpisem.";
            ws.getCell("A12").font = { bold: true, size: 11 };
            ws.getCell("A12").alignment = { horizontal: "center", vertical: "middle" };
            ws.getRow(12).height = 20;
            borderRange(1, 12, 7, 12);

            // ---- Řádek 13: hlavička tabulky ----
            const headers = ["#", "Příjmení", "Jméno", "Osobní číslo", "Středisko", "Čárový kód", "Podpis - porozuměl školení"];
            const hr = ws.getRow(13);
            headers.forEach((h, i) => {
                const cell = hr.getCell(i + 1);
                cell.value = h;
                cell.font = { bold: true, size: 10 };
                cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
                cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0F0F0" } };
                cell.border = box;
            });
            hr.height = 26;

            // ---- Datové řádky od řádku 14 ----
            const MIN_ROWS = 19;
            const firstDataRow = 14;
            const count = Math.max(MIN_ROWS, selected.length);
            for (let i = 0; i < count; i++) {
                const r = firstDataRow + i;
                const emp = selected[i];
                const row = ws.getRow(r);
                row.height = 26;
                for (let c = 1; c <= 7; c++) {
                    const cell = row.getCell(c);
                    cell.border = box;
                    const center = c === 1 || c === 4 || c === 5 || c === 6;
                    cell.alignment = { vertical: "middle", horizontal: center ? "center" : "left" };
                    if (c === 2) cell.font = { bold: true, size: 10 };
                    else if (c === 6) cell.font = { name: "Free 3 of 9", size: 11 }; // Code 39 barcode font
                    else cell.font = { size: 10 };
                }
                row.getCell(1).value = i + 1;
                if (emp) {
                    row.getCell(2).value = emp.lastName || "";
                    row.getCell(3).value = emp.firstName || "";
                    row.getCell(4).value = emp.personalNumber || "";
                    row.getCell(5).value = emp.workcenter || "";
                    // Čárový kód: =CONCATENATE("*";D<řádek>;"*") — odkaz na osobní číslo (sloupec D)
                    row.getCell(6).value = { formula: `CONCATENATE("*",D${r},"*")` };
                }
            }

            // ---- Patička ----
            const footRow = firstDataRow + count;
            ws.mergeCells(`A${footRow}:C${footRow}`);
            ws.getCell(`A${footRow}`).value = "1 z 1";
            ws.getCell(`A${footRow}`).font = { size: 8, color: GREY };
            ws.mergeCells(`D${footRow}:G${footRow}`);
            ws.getCell(`D${footRow}`).value = "Skartační znak a doba uchování: S20";
            ws.getCell(`D${footRow}`).font = { size: 8, color: GREY };
            ws.getCell(`D${footRow}`).alignment = { horizontal: "right" };

            const safeName = (training?.name || "skoleni").replace(/[/\\?%*:|"<>]/g, "-");
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `Prezencni_listina_${safeName}_${date}.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            onClose();
        } catch (err) {
            console.error("Chyba při generování Excelu:", err);
            alert("Nepodařilo se vygenerovat Excel. Zkuste to prosím znovu.");
        } finally {
            setGeneratingExcel(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div
                className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start justify-between px-6 py-5 border-b border-gray-200" style={{ background: "linear-gradient(135deg, #0054A6 0%, #003d7a 100%)", borderTopLeftRadius: "1rem", borderTopRightRadius: "1rem" }}>
                    <div className="pr-4">
                        <div className="flex items-center gap-2 text-blue-100 text-xs font-semibold mb-1">
                            <FileText size={14} /> PREZENČNÍ LISTINA
                        </div>
                        <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                            {training?.name}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 flex flex-col gap-5">
                    {/* Form fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
                                <MapPin size={14} className="text-gray-400" /> Místo <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={place}
                                onChange={e => setPlace(e.target.value)}
                                placeholder="Např. Školicí místnost A"
                                className="w-full rounded-lg border border-gray-300 bg-white py-2 px-3 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
                                <User size={14} className="text-gray-400" /> Školitel <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={trainer}
                                onChange={e => setTrainer(e.target.value)}
                                placeholder="Jméno školitele"
                                className="w-full rounded-lg border border-gray-300 bg-white py-2 px-3 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
                                <Calendar size={14} className="text-gray-400" /> Datum <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 bg-white py-2 px-3 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
                                <Clock size={14} className="text-gray-400" /> Čas od <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="time"
                                value={timeFrom}
                                onChange={e => setTimeFrom(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 bg-white py-2 px-3 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
                                <Clock size={14} className="text-gray-400" /> Čas do <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="time"
                                value={timeTo}
                                onChange={e => setTimeTo(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 bg-white py-2 px-3 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Employee selection */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-semibold text-gray-700">
                                Zaměstnanci na listinu <span className="text-red-500">*</span>
                                <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800">
                                    Vybráno: {selectedIds.size}
                                </span>
                            </label>
                        </div>

                        <div className="relative mb-2">
                            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Vyhledat zaměstnance..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>

                        <div className="rounded-xl border border-gray-200 overflow-hidden">
                            {filteredEmployees.length > 0 && (
                                <button
                                    type="button"
                                    onClick={toggleAllFiltered}
                                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 bg-gray-50/50"
                                >
                                    <span className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition-all ${allFilteredSelected ? "border-blue-600 bg-blue-600" : "border-gray-300 bg-white"}`}>
                                        {allFilteredSelected && <Check size={10} strokeWidth={3} className="text-white" />}
                                    </span>
                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                        Vybrat vše ({filteredEmployees.length})
                                    </span>
                                </button>
                            )}
                            <div className="max-h-56 overflow-y-auto custom-scrollbar">
                                {filteredEmployees.length === 0 ? (
                                    <div className="px-4 py-6 text-sm text-gray-400 text-center">Žádní zaměstnanci</div>
                                ) : (
                                    filteredEmployees.map(emp => (
                                        <button
                                            key={emp.employeeId}
                                            type="button"
                                            onClick={() => toggleOne(emp.employeeId)}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 transition-colors text-left"
                                        >
                                            <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border transition-all ${selectedIds.has(emp.employeeId) ? "border-blue-600 bg-blue-600" : "border-gray-300 bg-white"}`}>
                                                {selectedIds.has(emp.employeeId) && <Check size={12} strokeWidth={3} className="text-white" />}
                                            </span>
                                            <span className="flex-1 min-w-0">
                                                <span className="text-sm font-medium text-gray-900">{emp.lastName} {emp.firstName}</span>
                                                <span className="ml-2 text-xs text-gray-500">{emp.personalNumber || "—"}</span>
                                            </span>
                                            <StatusDot status={emp.validityStatus} />
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between gap-3 rounded-b-2xl">
                    <p className="text-xs text-gray-500">
                        {!isValid && "Vyplňte všechna pole a vyberte alespoň jednoho zaměstnance."}
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onClose}
                            className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-100 active:scale-95"
                        >
                            Zrušit
                        </button>
                        <button
                            onClick={handleGenerateExcel}
                            disabled={!isValid || generatingExcel || generating}
                            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                            style={{ backgroundColor: "#107C41" }}
                        >
                            <FileSpreadsheet size={16} />
                            {generatingExcel ? "Generuji..." : "Generace excelu"}
                        </button>
                        <button
                            onClick={handleGenerate}
                            disabled={!isValid || generating || generatingExcel}
                            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                            style={{ backgroundColor: "#0054A6" }}
                        >
                            <FileText size={16} />
                            {generating ? "Generuji..." : "Vygenerovat listinu"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatusDot({ status }: { status: string }) {
    const map: Record<string, string> = {
        'Platné': 'bg-emerald-500',
        'Neplatné': 'bg-red-500',
        'Blíží se expirace': 'bg-amber-500',
    };
    const color = map[status] || 'bg-gray-300';
    return <span className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${color}`} title={status} />;
}

function escapeHtml(str: string) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}
