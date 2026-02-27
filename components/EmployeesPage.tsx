"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Employee } from "@/types/employee";
import { NewEmployeePayload } from "@/types/employee";

import PageHeader from "./PageHeader";
import ActionButtons from "./ActionButtons";
import FilterBar from "./FilterBar";
import EmployeeTable from "./EmployeeTable";
import AddEmployeeModal from "./AddEmployeeModal";

export default function EmployeesPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    /* ---- State ---- */
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filters (initialized from URL query params)
    const [search, setSearch] = useState(searchParams.get("search") ?? "");
    const [department, setDepartment] = useState(
        searchParams.get("dept") ?? ""
    );
    const [status, setStatus] = useState(searchParams.get("status") ?? "");

    // Modals
    const [showAddModal, setShowAddModal] = useState(false);

    /* ---- Data fetching ---- */
    const fetchEmployees = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.set("search", search);
            if (department) params.set("dept", department);
            if (status) params.set("status", status);

            const qs = params.toString();
            const res = await fetch(`/api/employees${qs ? `?${qs}` : ""}`);
            const result = await res.json();

            if (result.success) {
                setEmployees(result.data);
            }
        } catch {
            // silent for now — could add toast
        } finally {
            setIsLoading(false);
        }
    }, [search, department, status]);

    // Initial load
    useEffect(() => {
        fetchEmployees();
    }, [fetchEmployees]);

    /* ---- Filter actions ---- */
    function applyFilters(newSearch?: string, newDept?: string, newStatus?: string) {
        const params = new URLSearchParams();
        const s = newSearch !== undefined ? newSearch : search;
        const d = newDept !== undefined ? newDept : department;
        const st = newStatus !== undefined ? newStatus : status;

        if (s) params.set("search", s);
        if (d) params.set("dept", d);
        if (st) params.set("status", st);

        const qs = params.toString();
        const newUrl = qs ? `/?${qs}` : "/";

        // Only push if the URL actually changed to avoid redundant history entries and loops
        if (window.location.search !== (qs ? `?${qs}` : "")) {
            router.push(newUrl, { scroll: false });
        }
    }

    // Direct handlers for filters
    const handleSearchChange = (val: string) => setSearch(val);
    const handleDepartmentChange = (val: string) => {
        setDepartment(val);
        applyFilters(search, val, status);
    };
    const handleStatusChange = (val: string) => {
        setStatus(val);
        applyFilters(search, department, val);
    };

    /* ---- Save new employee ---- */
    async function handleSaveEmployee(data: NewEmployeePayload) {
        const res = await fetch("/api/employees", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        const result = await res.json();

        if (!result.success) {
            throw new Error(result.message || "Chyba při ukládání.");
        }

        setShowAddModal(false);
        await fetchEmployees();
    }

    /* ---- Navigate to detail ---- */
    function handleViewDetail(personalNumber: string) {
        router.push(`/employee/${personalNumber}`);
    }

    /* ---- Render ---- */
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <PageHeader
                    title="Zaměstnanci"
                    description="Správa zaměstnanců a jejich informací."
                />

                <ActionButtons
                    onAdd={() => setShowAddModal(true)}
                    count={isLoading ? undefined : employees.length}
                />

                <FilterBar
                    search={search}
                    department={department}
                    status={status}
                    onSearchChange={handleSearchChange}
                    onDepartmentChange={handleDepartmentChange}
                    onStatusChange={handleStatusChange}
                    onSubmit={() => applyFilters()}
                />

                {/* Content area */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-20 shadow-sm">
                        <Loader2 size={36} className="animate-spin text-blue-500 mb-4" />
                        <p className="text-sm text-gray-500">
                            Načítám data z databáze...
                        </p>
                    </div>
                ) : employees.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-20 shadow-sm">
                        <div className="mb-3 text-4xl">👤</div>
                        <p className="text-sm text-gray-400">
                            Žádní zaměstnanci nebyli nalezeni.
                        </p>
                    </div>
                ) : (
                    <EmployeeTable
                        employees={employees}
                        onViewDetail={handleViewDetail}
                    />
                )}

                {/* Add modal */}
                <AddEmployeeModal
                    isOpen={showAddModal}
                    onClose={() => setShowAddModal(false)}
                    onSave={handleSaveEmployee}
                />
            </div>
        </div>
    );
}
