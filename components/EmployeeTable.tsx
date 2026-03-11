"use client";

import { useState, useEffect } from "react";
import { Eye } from "lucide-react";
import { Employee } from "@/types/employee";
import StatusBadge from "./StatusBadge";

interface EmployeeTableProps {
    employees: Employee[];
    onViewDetail: (personalNumber: string) => void;
}

export default function EmployeeTable({
    employees,
    onViewDetail,
}: EmployeeTableProps) {
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => {
        setIsMounted(true);
    }, []);

    function formatDate(dateStr: string | null): string {
        if (!dateStr || !isMounted) return "—";
        const d = new Date(dateStr);
        return d.toLocaleDateString("cs-CZ", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    }

    return (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-[0.9rem]">
                    <thead>
                        <tr className="border-b border-gray-200 bg-gray-50/80">
                            <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                Osobní číslo
                            </th>
                            <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                Jméno
                            </th>
                            <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                Příjmení
                            </th>
                            <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                Oddělení
                            </th>
                            <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                Středisko
                            </th>
                            <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                Nástup
                            </th>
                            <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                Stav
                            </th>
                            <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                Prací program
                            </th>
                            <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                                Akce
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {employees.map((emp) => (
                            <tr
                                key={emp.id}
                                className="transition-colors hover:bg-blue-50/40"
                            >
                                <td className="whitespace-nowrap px-5 py-3.5">
                                    <code className="rounded bg-gray-100 px-2 py-0.5 text-xs font-mono font-semibold text-blue-700">
                                        {emp.personalNumber}
                                    </code>
                                </td>
                                <td className="whitespace-nowrap px-5 py-3.5 text-gray-700">
                                    {emp.firstName}
                                </td>
                                <td className="whitespace-nowrap px-5 py-3.5 font-semibold text-gray-900">
                                    {emp.lastName}
                                </td>
                                <td className="whitespace-nowrap px-5 py-3.5 text-gray-600">
                                    {emp.department}
                                </td>
                                <td className="whitespace-nowrap px-5 py-3.5 text-gray-600">
                                    {emp.costCenter}
                                </td>
                                <td className="whitespace-nowrap px-5 py-3.5 text-gray-500 tabular-nums">
                                    {formatDate(emp.hiringDate)}
                                </td>
                                <td className="whitespace-nowrap px-5 py-3.5">
                                    <StatusBadge isActive={emp.isActive} />
                                </td>
                                <td className="whitespace-nowrap px-5 py-3.5 text-gray-700 font-medium">
                                    {emp.hasWashingProgram ? (
                                        <span className="inline-flex items-center rounded-md bg-sky-50 px-2 py-1 text-xs font-medium text-sky-700 ring-1 ring-inset ring-sky-600/20">Ano</span>
                                    ) : (
                                        <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">Ne</span>
                                    )}
                                </td>
                                <td className="whitespace-nowrap px-5 py-3.5 text-right">
                                    <button
                                        onClick={() => onViewDetail(emp.personalNumber)}
                                        className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium text-blue-600 transition-all hover:bg-blue-50 hover:text-blue-700 active:scale-95"
                                    >
                                        <Eye size={15} />
                                        Detail
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
