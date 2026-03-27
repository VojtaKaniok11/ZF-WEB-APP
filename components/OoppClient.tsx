"use client";

import { useState, useEffect, useMemo } from "react";
import { Employee } from "@/types/employee";
import PersonList from "@/components/PersonList";
import AddOoppModal from "@/components/AddOoppModal";
import { Plus, Download, Loader2 } from "lucide-react";
import * as xlsx from "xlsx";
import { getApiUrl } from "@/lib/constants";

interface OoppItem {
    id: string;
    name: string;
    category: string;
}

interface OoppSummaryItem {
    personalNumber: string;
    ooppItemId: string;
    status: "issued" | "eligible" | "eligible_soon";
}

interface OoppClientProps {
    employees: Employee[];
}

export default function OoppClient({ employees }: OoppClientProps) {
    const [modalOpen, setModalOpen] = useState(false);
    const [items, setItems] = useState<OoppItem[]>([]);
    // Filters
    const [filterCategory, setFilterCategory] = useState<string>("Vše");
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        const apiUrl = getApiUrl();
        // Fetch all items to get categories
        fetch(`${apiUrl}/oopp/items`)
            .then(res => res.json())
            .then(data => { if (data.success) setItems(data.data); })
            .catch(() => {});

        // Fetch summary (if exists, or we could fetch general data)
        // For now, let's just use categories
    }, []);

    const categories = useMemo(() => {
        const cats = Array.from(new Set(items.map(i => i.category)));
        return cats.sort();
    }, [items]);

    const handleExport = async () => {
        try {
            setExporting(true);
            const data = employees.map(emp => ({
                'Příjmení a jméno': `${emp.lastName} ${emp.firstName}`,
                'Osobní číslo': emp.personalNumber || '',
                'Oddělení': emp.department || '',
                'Pracoviště': emp.workcenterName || ''
            }));

            const ws = xlsx.utils.json_to_sheet(data);
            const wb = xlsx.utils.book_new();
            xlsx.utils.book_append_sheet(wb, ws, "OOPP");
            xlsx.writeFile(wb, `oopp_export_${new Date().toISOString().split('T')[0]}.xlsx`);
        } catch (error) {
            console.error("Export failed:", error);
        } finally {
            setExporting(false);
        }
    };

    const filteredEmployees = useMemo(() => {
        if (filterCategory === "Vše") return employees;
        // In a real app, we'd filter by the summary data.
        return employees; 
    }, [employees, filterCategory]);

    return (
        <>
            <PersonList
                employees={filteredEmployees}
                basePath="/oopp"
                title="OOPP"
                description="Osobní ochranné pracovní prostředky — boty, rukavice, oděvy, ochrana zraku a sluchu."
                icon={
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                    </svg>
                }
                actionButton={
                    <div className="flex items-center gap-2">
                         <button
                            onClick={handleExport}
                            disabled={exporting}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-green-700 disabled:opacity-60 cursor-pointer"
                        >
                            {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                            Excel
                        </button>
                        <button
                            onClick={() => setModalOpen(true)}
                            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90 active:scale-95 cursor-pointer"
                            style={{ backgroundColor: "#0054A6" }}
                        >
                            <Plus size={16} />
                            Přidat výdej OOPP
                        </button>
                    </div>
                }
                filterControls={
                    <div className="flex items-center gap-2">
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-8 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm transition-colors"
                        >
                            <option value="Vše">Všechny kategorie</option>
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                }
            />

            {modalOpen && (
                <AddOoppModal
                    employees={employees}
                    onClose={() => setModalOpen(false)}
                    onSuccess={() => setModalOpen(false)}
                />
            )}
        </>
    );
}
