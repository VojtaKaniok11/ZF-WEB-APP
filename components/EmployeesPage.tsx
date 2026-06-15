"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import * as XLSX from "xlsx";

import { Employee } from "@/types/employee";

import PageHeader from "./PageHeader";
import ActionButtons from "./ActionButtons";
import FilterBar from "./FilterBar";
import EmployeeTable from "./EmployeeTable";
import { getApiUrl } from "@/lib/constants";


interface EmployeesPageProps {
    initialEmployees?: Employee[];
}

export default function EmployeesPage({ initialEmployees = [] }: EmployeesPageProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    /* ---- State ---- */
    const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
    const [isLoading, setIsLoading] = useState(initialEmployees.length === 0);

    // Filters
    const [search, setSearch] = useState(searchParams.get("search") ?? "");
    const [category, setCategory] = useState(searchParams.get("cat") ?? "");
    const [workcenter, setWorkcenter] = useState(searchParams.get("wc") ?? "");
    const [workcenterDesc, setWorkcenterDesc] = useState(searchParams.get("wcd") ?? "");
    const [active, setActive] = useState(searchParams.get("active") ?? "");
    const [isExporting, setIsExporting] = useState(false);

    /* ---- Data fetching ---- */
    const fetchEmployees = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.set("search", search);
            if (category) params.set("cat", category);
            if (workcenter) params.set("wc", workcenter);
            if (workcenterDesc) params.set("wcd", workcenterDesc);
            if (active) params.set("active", active);

            const qs = params.toString();
            const apiUrl = getApiUrl();
            const res = await fetch(`${apiUrl}/employees${qs ? `?${qs}` : ""}`);
            const result = await res.json();

            if (result.success && result.data) {
                setEmployees(result.data);
            } else {
                setEmployees([]);
            }
        } catch (error) {
            console.error("Error fetching employees:", error);
            setEmployees([]);
        } finally {
            setIsLoading(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, category, workcenter, workcenterDesc, active]);

    // Apply URL params
    const syncUrl = useCallback(() => {
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (category) params.set("cat", category);
        if (workcenter) params.set("wc", workcenter);
        if (workcenterDesc) params.set("wcd", workcenterDesc);
        if (active) params.set("active", active);

        const qs = params.toString();
        const newUrl = qs ? `/?${qs}` : "/";

        if (window.location.search !== (qs ? `?${qs}` : "")) {
            router.push(newUrl, { scroll: false });
        }
    }, [search, category, workcenter, workcenterDesc, active, router]);

    // Initial load and URL sync with debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchEmployees();
            syncUrl();
        }, 150);
        return () => clearTimeout(timer);
    }, [fetchEmployees, syncUrl]);



    /* ---- Export do Excelu ---- */
    async function handleExport() {
        setIsExporting(true);
        try {
            const apiUrl = getApiUrl();
            const res = await fetch(`${apiUrl}/employees/export`);
            const result = await res.json();
            if (!result.success || !result.data) return;

            const rows = result.data.map((emp: Record<string, unknown>) => ({
                "Os. číslo":                   emp.personalNumber ?? "",
                "Příjmení":                    emp.lastName ?? "",
                "Jméno":                       emp.firstName ?? "",
                "Kategorie":                   emp.category ?? "",
                "Kmen. středisko číslo":       emp.workcenter ?? "",
                "Kmen. středisko popis":       emp.department ?? "",
                "Nákladové číslo":             emp.costNumber ?? "",
                "Nákladové středisko popis":   emp.costNumberDesc ?? "",
                "Stav":                        emp.isActive ? "Aktivní" : "Neaktivní",
                "Prací program":               emp.hasWashingProgram ? "Ano" : "Ne",
            }));

            const ws = XLSX.utils.json_to_sheet(rows);
            ws["!cols"] = [
                { wch: 12 },  // Os. číslo
                { wch: 20 },  // Příjmení
                { wch: 18 },  // Jméno
                { wch: 14 },  // Kategorie
                { wch: 22 },  // Kmen. středisko číslo
                { wch: 28 },  // Kmen. středisko popis
                { wch: 18 },  // Nákladové číslo
                { wch: 28 },  // Nákladové středisko popis
                { wch: 12 },  // Stav
                { wch: 14 },  // Prací program
            ];
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Zaměstnanci");
            XLSX.writeFile(wb, `zamestnanci_${new Date().toISOString().slice(0, 10)}.xlsx`);
        } catch (error) {
            console.error("Export error:", error);
        } finally {
            setIsExporting(false);
        }
    }

    /* ---- Navigate to detail ---- */
    function handleViewDetail(personalNumber: string) {
        const params = new URLSearchParams();
        params.set("pn", personalNumber);
        if (search) params.set("search", search);
        if (category) params.set("cat", category);
        if (workcenter) params.set("wc", workcenter);
        if (workcenterDesc) params.set("wcd", workcenterDesc);
        if (active) params.set("active", active);

        router.push(`/employee/profile?${params.toString()}`);
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <PageHeader
                    title="Zaměstnanci"
                    description="Správa zaměstnanců a jejich informací."
                />

                <ActionButtons
                    count={isLoading ? undefined : employees.length}
                    onExport={handleExport}
                    isExporting={isExporting}
                />

                <FilterBar
                    search={search}
                    category={category}
                    workcenter={workcenter}
                    workcenterDesc={workcenterDesc}
                    active={active}
                    onSearchChange={setSearch}
                    onCategoryChange={setCategory}
                    onWorkcenterChange={setWorkcenter}
                    onWorkcenterDescChange={setWorkcenterDesc}
                    onActiveChange={setActive}
                />

                {/* Content area */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-20 shadow-sm">
                        <Loader2 size={36} className="animate-spin text-blue-500 mb-4" />
                        <p className="text-sm text-gray-500">Načítám data z databáze...</p>
                    </div>
                ) : employees.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-20 shadow-sm">
                        <div className="mb-3 text-4xl">👤</div>
                        <p className="text-sm text-gray-400">Žádní zaměstnanci nebyli nalezeni.</p>
                    </div>
                ) : (
                    <EmployeeTable
                        employees={employees}
                        onViewDetail={handleViewDetail}
                    />
                )}



            </div>
        </div>
    );
}
