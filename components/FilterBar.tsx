"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { DEPARTMENTS } from "@/lib/constants";

interface FilterBarProps {
    search: string;
    department: string;
    status: string;
    wp: string;
    onSearchChange: (value: string) => void;
    onDepartmentChange: (value: string) => void;
    onStatusChange: (value: string) => void;
    onWpChange: (value: string) => void;
    onSubmit: () => void;
}

export default function FilterBar({
    search,
    department,
    status,
    wp,
    onSearchChange,
    onDepartmentChange,
    onStatusChange,
    onWpChange,
    onSubmit,
}: FilterBarProps) {
    return (
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3 text-sm font-medium text-gray-500">
                <SlidersHorizontal size={16} />
                Filtry
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                {/* Search */}
                <div className="relative">
                    <Search
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") onSubmit();
                        }}
                        placeholder="Hledat zaměstnance..."
                        className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                </div>

                {/* Department */}
                <select
                    value={department}
                    onChange={(e) => onDepartmentChange(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                    <option value="">Všechna oddělení</option>
                    {DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>
                            {dept}
                        </option>
                    ))}
                </select>

                {/* Status */}
                <select
                    value={status}
                    onChange={(e) => onStatusChange(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                    <option value="">Všichni</option>
                    <option value="true">Aktivní</option>
                    <option value="false">Neaktivní</option>
                </select>

                {/* Washing program */}
                <select
                    value={wp}
                    onChange={(e) => onWpChange(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                    <option value="">Prací program: Vše</option>
                    <option value="yes">Prací program: Ano</option>
                    <option value="no">Prací program: Ne</option>
                </select>
            </div>
        </div>
    );
}
