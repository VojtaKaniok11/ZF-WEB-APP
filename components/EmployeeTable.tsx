"use client";

import { useState, useEffect } from "react";
import { Employee } from "@/types/employee";

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

    // Column definitions: label, width hint, alignment
    const thClass = "px-2.5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-500 whitespace-nowrap";
    const tdBase = "px-2.5 py-2.5 whitespace-nowrap text-sm";

    return (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-[0.82rem]">
                    <thead>
                        <tr className="border-b border-gray-200 bg-gray-50/80">
                            {/* Osobní číslo */}
                            <th className={thClass} style={{ width: "90px" }}>Os. číslo</th>
                            {/* Příjmení */}
                            <th className={thClass} style={{ width: "140px" }}>Příjmení</th>
                            {/* Jméno */}
                            <th className={thClass} style={{ width: "120px" }}>Jméno</th>
                            {/* Kategorie */}
                            <th className={thClass} style={{ width: "110px" }}>Kategorie</th>
                            {/* Kmenové středisko */}
                            <th className={thClass} style={{ width: "110px" }}>Kmen. středisko číslo</th>
                            {/* Kmenové středisko popis */}
                            <th className={thClass} style={{ width: "160px" }}>Kmen. středisko popis</th>
                            {/* Nákladové číslo */}
                            <th className={thClass} style={{ width: "110px" }}>Nákladové číslo</th>
                            <th className={thClass} style={{ width: "160px" }}>Nákladové středisko popis</th>
                            {/* Stav */}
                            <th className={thClass} style={{ width: "80px" }}>Stav</th>
                            {/* Prací program */}
                            <th className={thClass} style={{ width: "80px" }}>Prací progr.</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {employees.map((emp) => (
                            <tr
                                key={emp.id}
                                onClick={() => onViewDetail(emp.personalNumber)}
                                className="cursor-pointer transition-colors hover:bg-blue-50/60 group"
                                title={`Otevřít profil: ${emp.firstName} ${emp.lastName}`}
                            >
                                {/* Osobní číslo */}
                                <td className={tdBase}>
                                    <code className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-mono font-semibold text-blue-700 group-hover:bg-blue-100">
                                        {emp.personalNumber || "—"}
                                    </code>
                                </td>

                                {/* Příjmení */}
                                <td className={`${tdBase} font-semibold text-gray-900`}>
                                    {emp.lastName || "—"}
                                </td>

                                {/* Jméno */}
                                <td className={`${tdBase} text-gray-700`}>
                                    {emp.firstName || "—"}
                                </td>

                                {/* Kategorie (z DB) */}
                                <td className={`${tdBase} text-gray-600`}>
                                    {emp.category || <span className="text-gray-300">—</span>}
                                </td>

                                {/* Kmenové středisko číslo = workcenter */}
                                <td className={`${tdBase} text-gray-600 tabular-nums`}>
                                    {emp.workcenter || <span className="text-gray-300">—</span>}
                                </td>

                                {/* Kmenové středisko popis = workcenterName (z STREDISKO_POPIS dle kmen. čísla) */}
                                <td className={`${tdBase} text-gray-600`}>
                                    {emp.workcenterName || <span className="text-gray-300">—</span>}
                                </td>

                                {/* Nákladové číslo (z DB) */}
                                <td className={`${tdBase} text-gray-600 tabular-nums`}>
                                    {emp.costNumber || <span className="text-gray-300">—</span>}
                                </td>

                                {/* Nákladové středisko popis */}
                                <td className={`${tdBase} text-gray-600`}>
                                    {emp.costNumberDesc || <span className="text-gray-300">—</span>}
                                </td>

                                {/* Stav */}
                                <td className={tdBase}>
                                    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium ring-1 ring-inset ${
                                        emp.isActive
                                            ? "bg-green-50 text-green-700 ring-green-600/20"
                                            : "bg-red-50 text-red-600 ring-red-600/20"
                                    }`}>
                                        {emp.isActive ? "Aktivní" : "Neaktivní"}
                                    </span>
                                </td>

                                {/* Prací program */}
                                <td className={tdBase}>
                                    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium ring-1 ring-inset ${
                                        emp.hasWashingProgram
                                            ? "bg-blue-50 text-blue-700 ring-blue-600/20"
                                            : "bg-gray-50 text-gray-500 ring-gray-500/10"
                                    }`}>
                                        {emp.hasWashingProgram ? "Ano" : "Ne"}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
