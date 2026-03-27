"use client";

import { useState, useEffect, useMemo } from "react";
import { Employee } from "@/types/employee";
import PersonList from "@/components/PersonList";
import AddMedicalModal from "@/components/AddMedicalModal";
import { Plus, Download, Loader2 } from "lucide-react";
import * as xlsx from "xlsx";
import { getApiUrl } from "@/lib/constants";

interface MedicalType {
    id: string;
    name: string;
}

interface MedicalSummaryItem {
    personalNumber: string;
    examTypeId: string;
    status: "valid" | "expired" | "expiring_soon";
}

interface MedicalClientProps {
    employees: Employee[];
}

export default function MedicalClient({ employees }: MedicalClientProps) {
    const [modalOpen, setModalOpen] = useState(false);

    const [types, setTypes] = useState<MedicalType[]>([]);
    const [summary, setSummary] = useState<MedicalSummaryItem[]>([]);

    // Filters
    const [filterTypeId, setFilterTypeId] = useState<string>("Vše");
    const [filterStatus, setFilterStatus] = useState<string>("Vše");

    // Export state
    const [exporting, setExporting] = useState(false);

    const handleExport = async () => {
        try {
            setExporting(true);
            
            const data = filteredEmployees.map(emp => {
                const record = summary.find(s => s.personalNumber === emp.personalNumber && s.examTypeId === filterTypeId);
                const typeName = types.find(t => t.id === filterTypeId)?.name || "Všechny prohlídky";
                
                let currentStatus = "Neproškolen";
                if (record) {
                    if (record.status === "valid") currentStatus = "Platné";
                    else if (record.status === "expiring_soon") currentStatus = "Blíží se expirace";
                    else currentStatus = "Neplatné";
                }

                return {
                    'Příjmení a jméno': `${emp.lastName} ${emp.firstName}`,
                    'Osobní číslo': emp.personalNumber || '',
                    'Oddělení': emp.department || '',
                    'Název prohlídky': typeName,
                    'Stav': currentStatus
                };
            });

            const ws = xlsx.utils.json_to_sheet(data.length > 0 ? data : [{ 'Informace': 'Žádná data neodpovídají zvolenému filtru.' }]);
            
            if (data.length > 0) {
                ws['!cols'] = [
                    { wch: 25 },
                    { wch: 15 },
                    { wch: 25 },
                    { wch: 30 },
                    { wch: 18 }
                ];
            }

            const wb = xlsx.utils.book_new();
            xlsx.utils.book_append_sheet(wb, ws, "Lékařské prohlídky");
            
            const fileName = `lekarske_prohlidky_${new Date().toISOString().split('T')[0]}.xlsx`;
            xlsx.writeFile(wb, fileName);
            
        } catch (error) {
            console.error("Export selhal:", error);
            alert("Export do Excelu se nezdařil.");
        } finally {
            setExporting(false);
        }
    };

    useEffect(() => {
        const apiUrl = getApiUrl();
        // Fetch types
        fetch(`${apiUrl}/medical-types`)
            .then(res => res.json())
            .then(data => {
                if (data.success) setTypes(data.data);
            })
            .catch(() => {});

        // Fetch summary
        fetch(`${apiUrl}/medical/summary`)
            .then(res => res.json())
            .then(data => {
                if (data.success) setSummary(data.data);
            })
            .catch(() => {});
    }, []);

    const filteredEmployees = useMemo(() => {
        return employees.filter(emp => {
            const userRecords = summary.filter(s => s.personalNumber === emp.personalNumber);
            const matchesType = filterTypeId === "Vše" || userRecords.some(r => r.examTypeId === filterTypeId);
            
            if (!matchesType && filterTypeId !== "Vše") return false;

            let currentStatus = "Neproškolen";
            if (filterTypeId !== "Vše") {
                const typeRecord = userRecords.find(r => r.examTypeId === filterTypeId);
                if (typeRecord) {
                    if (typeRecord.status === "valid") currentStatus = "Platné";
                    else if (typeRecord.status === "expiring_soon") currentStatus = "Blíží se expirace";
                    else if (typeRecord.status === "expired") currentStatus = "Neplatné";
                }
            } else if (userRecords.length > 0) {
                if (userRecords.some(r => r.status === "expired")) currentStatus = "Neplatné";
                else if (userRecords.some(r => r.status === "expiring_soon")) currentStatus = "Blíží se expirace";
                else currentStatus = "Platné";
            }

            if (filterStatus !== "Vše") {
                if (filterStatus === "Neplatné") return currentStatus === "Neplatné" || currentStatus === "Neproškolen";
                return currentStatus === filterStatus;
            }
            return true;
        });
    }, [employees, filterTypeId, filterStatus, summary]);

    return (
        <>
            <PersonList
                employees={filteredEmployees}
                basePath="/medical"
                title="Lékařské prohlídky"
                description="Evidence lékařských prohlídek zaměstnanců — vstupní, periodické, mimořádné."
                icon={
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                    </svg>
                }
                actionButton={
                    <div className="flex items-center justify-end gap-2 shrink-0">
                        <button
                            onClick={handleExport}
                            disabled={exporting}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed shrink-0 whitespace-nowrap cursor-pointer"
                        >
                            {exporting ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <Download size={16} />
                            )}
                            Excel
                        </button>
                        <button
                            onClick={() => setModalOpen(true)}
                            className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90 active:scale-95 cursor-pointer shrink-0 whitespace-nowrap"
                            style={{ backgroundColor: "#0054A6" }}
                        >
                            <Plus size={16} />
                            Přidat prohlídku
                        </button>
                    </div>
                }
                filterControls={
                    <div className="flex items-center gap-2 w-full justify-end flex-nowrap overflow-hidden">
                        <select
                            value={filterTypeId}
                            onChange={(e) => {
                                setFilterTypeId(e.target.value);
                                if (e.target.value === "Vše") setFilterStatus("Vše");
                            }}
                            className="flex-1 w-[290px] shrink rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-8 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm transition-colors text-ellipsis overflow-hidden whitespace-nowrap"
                        >
                            <option value="Vše">Všechny prohlídky</option>
                            {types.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            disabled={filterTypeId === "Vše"}
                            className="flex-1 w-[150px] shrink rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-8 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-50 disabled:text-gray-400 shadow-sm transition-colors text-ellipsis overflow-hidden whitespace-nowrap"
                        >
                            <option value="Vše">Všechny statusy</option>
                            <option value="Platné">Platné</option>
                            <option value="Neplatné">Neplatné / Chybí</option>
                            <option value="Blíží se expirace">Expirující</option>
                        </select>
                    </div>
                }
            />

            {modalOpen && (
                <AddMedicalModal
                    employees={employees}
                    onClose={() => setModalOpen(false)}
                    onSuccess={() => setModalOpen(false)}
                />
            )}
        </>
    );
}
