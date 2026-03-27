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
    const [departments, setDepartments] = useState<string[]>([]);

    // Filters (initialized from URL query params)
    const [search, setSearch] = useState(searchParams.get("search") ?? "");
    const [department, setDepartment] = useState(searchParams.get("dept") ?? "");
    const [wp, setWp] = useState(searchParams.get("wp") ?? "");
    const [workcenter, setWorkcenter] = useState(searchParams.get("wc") ?? "");

    // Modals
    const [showAddModal, setShowAddModal] = useState(false);

    /* ---- Data fetching ---- */

    // Fetch Departments once
    useEffect(() => {
        const apiUrl = getApiUrl();
        fetch(`${apiUrl}/employees/departments`)
            .then(res => res.json())
            .then(res => { if (res.success) setDepartments(res.data); })
            .catch(() => {});
    }, []);

    const fetchEmployees = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.set("search", search);
            if (department) params.set("dept", department);
            if (wp) params.set("wp", wp);
            if (workcenter) params.set("wc", workcenter);

            const qs = params.toString();
            const apiUrl = getApiUrl();
            const res = await fetch(`${apiUrl}/employees${qs ? `?${qs}` : ""}`);
            const result = await res.json();

            if (result.success) {
                setEmployees(result.data);
            }
        } catch {
            // silent for now
        } finally {
            setIsLoading(false);
        }
    }, [search, department, wp, workcenter]);

    // Apply URL params
    const syncUrl = useCallback(() => {
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (department) params.set("dept", department);
        if (wp) params.set("wp", wp);
        if (workcenter) params.set("wc", workcenter);

        const qs = params.toString();
        const newUrl = qs ? `/?${qs}` : "/";

        if (window.location.search !== (qs ? `?${qs}` : "")) {
            router.push(newUrl, { scroll: false });
        }
    }, [search, department, wp, workcenter, router]);

    // Initial load and URL sync
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchEmployees();
            syncUrl();
        }, 150); // Small debounce to avoid flashing while typing fast
        return () => clearTimeout(timer);
    }, [fetchEmployees, syncUrl]);

    // Handlers
    const handleSearchChange = (val: string) => setSearch(val);
    const handleDepartmentChange = (val: string) => setDepartment(val);
    const handleWpChange = (val: string) => setWp(val);
    const handleWorkcenterChange = (val: string) => setWorkcenter(val);

    /* ---- Save new employee ---- */
    async function handleSaveEmployee(data: NewEmployeePayload) {
        const apiUrl = getApiUrl();
        const res = await fetch(`${apiUrl}/employees`, {
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
        router.push(`/employee/profile?pn=${personalNumber}`);
    }

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
                    departments={departments}
                    wp={wp}
                    workcenter={workcenter}
                    onSearchChange={handleSearchChange}
                    onDepartmentChange={handleDepartmentChange}
                    onWpChange={handleWpChange}
                    onWorkcenterChange={handleWorkcenterChange}
                    onSubmit={() => fetchEmployees()}
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

                <AddEmployeeModal
                    isOpen={showAddModal}
                    onClose={() => setShowAddModal(false)}
                    onSave={handleSaveEmployee}
                />
            </div>
        </div>
    );
}
