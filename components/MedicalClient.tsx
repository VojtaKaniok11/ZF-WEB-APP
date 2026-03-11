"use client";

import { useState, useEffect, useMemo } from "react";
import { Employee } from "@/types/employee";
import PersonList from "@/components/PersonList";
import AddMedicalModal from "@/components/AddMedicalModal";
import { Plus, Filter, Download, Loader2 } from "lucide-react";

interface MedicalType {
    ID: string;
    Name: string;
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
            const response = await fetch(`/api/medical/export?typeId=${encodeURIComponent(filterTypeId)}&status=${encodeURIComponent(filterStatus)}`);
            if (!response.ok) throw new Error("Chyba při stahování Excelu.");
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.style.display = "none";
            a.href = url;
            a.download = `lekarske_prohlidky_${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(a);
            a.click();
            
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error("Export selhal:", error);
            alert("Export do Excelu se nezdařil.");
        } finally {
            setExporting(false);
        }
    };
    


    useEffect(() => {
        // Fetch types
        fetch("/api/medical-types")
            .then(res => res.json())
            .then(data => {
                if (data.success) setTypes(data.data);
            });

        // Fetch summary
        fetch("/api/medical/summary")
            .then(res => res.json())
            .then(data => {
                if (data.success) setSummary(data.data);
            });
    }, []);

    const filteredEmployees = useMemo(() => {
        if (filterTypeId === "Vše" && filterStatus === "Vše") {
            return employees;
        }

        return employees.filter(emp => {
            // Find employee's status for the selected type
            // If filterTypeId is "Vše" but filterStatus is not (doesn't make much sense, but we can handle it)
            // Actually, we force filtering by status only if a type is selected, or we check ALL their exams?
            // Usually, "platné/neplatné" is tied to a SPECIFIC exam.

            // If no specific exam type is selected, we could arguably ignore the status filter or check overall status.
            // Let's assume you must pick a specific exam for status to matter, OR if no exam is picked, 'Platné' means ALL their exams are valid... this is complex.
            // Let's implement simpler logic: if filterTypeId !== "Vše", we look up that specific exam.

            if (filterTypeId !== "Vše") {
                const record = summary.find(s => s.personalNumber === emp.personalNumber && s.examTypeId === filterTypeId);
                let currentStatus = "Neproškolen"; // treating no record as not having it (invalid)
                if (record) {
                    if (record.status === "valid") currentStatus = "Platné";
                    else if (record.status === "expiring_soon") currentStatus = "Blíží se expirace";
                    else currentStatus = "Neplatné"; // expired
                }

                if (filterStatus !== "Vše") {
                    if (filterStatus === "Neplatné" && currentStatus === "Neproškolen") return true; // Neproškolen counts as Neplatné
                    return currentStatus === filterStatus;
                }

                // If only type is filtered, maybe show everyone, or only those who have it?
                // Let's show everyone, as the user wants to filter BY TYPE AND STATUS. If status="Vše", everyone passes.
                return true;
            }

            // If type==="Vše" but status is specific
            if (filterStatus !== "Vše") {
                // If someone wants "Platné", maybe they want employees where ALL exams are valid.
                // It's undefined behavior based on UI simplicity. Let's just return true if examType = "Vše"
                return true;
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
                                <option key={t.ID} value={t.ID}>{t.Name}</option>
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
