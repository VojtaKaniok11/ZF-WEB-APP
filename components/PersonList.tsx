"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, ChevronRight } from "lucide-react";
import { Employee } from "@/types/employee";

interface PersonListProps {
    employees: Employee[];
    basePath: string; // e.g. "/trainings"
    title: string;
    description: string;
    icon: React.ReactNode;
    actionButton?: React.ReactNode;
    filterControls?: React.ReactNode;
}

export default function PersonList({
    employees,
    basePath,
    title,
    description,
    icon,
    actionButton,
    filterControls,
}: PersonListProps) {
    const [search, setSearch] = useState("");

    const filtered = useMemo(() => {
        if (!search) return employees;
        const s = search.toLowerCase();
        return employees.filter(
            (e) =>
                e.firstName.toLowerCase().includes(s) ||
                e.lastName.toLowerCase().includes(s) ||
                e.personalNumber.toLowerCase().includes(s) ||
                e.department.toLowerCase().includes(s)
        );
    }, [employees, search]);

    return (
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-8 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-lg shadow-blue-600/25" style={{ backgroundColor: "#0054A6" }}>
                    {icon}
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">{title}</h1>
                    <p className="text-sm text-gray-500">{description}</p>
                </div>
            </div>

            {/* Search */}
            <div className="mb-6 overflow-hidden rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Hledat zaměstnance podle jména, příjmení nebo osobního čísla..."
                        className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                </div>
            </div>

            {/* Count badge + optional action button */}
            <div className="mb-4 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                <div className="shrink-0">
                    <span className="whitespace-nowrap inline-flex items-center rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                        Nalezeno: {filtered.length} zaměstnanců
                    </span>
                </div>
                
                <div className="flex flex-wrap items-center xl:justify-end gap-2 xl:flex-nowrap overflow-hidden">
                    {filterControls && <div className="flex items-center w-full sm:w-auto overflow-hidden">{filterControls}</div>}
                    {actionButton && <div className="flex items-center gap-2 shrink-0">{actionButton}</div>}
                </div>
            </div>

            {/* List */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className="mb-3 text-4xl">🔍</div>
                        <p className="text-sm text-gray-400">
                            Žádní zaměstnanci nebyli nalezeni.
                        </p>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-100">
                        {filtered.map((emp) => (
                            <li key={emp.id}>
                                <Link
                                    href={`${basePath}/detail?pn=${emp.personalNumber}`}
                                    className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-blue-50/40"
                                >
                                    <div className="flex items-center gap-4">
                                        {/* Avatar placeholder */}
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-blue-200 text-sm font-bold text-blue-700">
                                            {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-semibold text-gray-900">
                                                    {emp.firstName} {emp.lastName}
                                                </span>
                                                <code className="rounded bg-gray-100 px-2 py-0.5 text-xs font-mono font-semibold text-blue-700">
                                                    {emp.personalNumber}
                                                </code>
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {emp.department} · {emp.workcenterName || "Bez pracoviště"}
                                            </div>
                                        </div>
                                    </div>
                                    <ChevronRight size={18} className="text-gray-300" />
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
