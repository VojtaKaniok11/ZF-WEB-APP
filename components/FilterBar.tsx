"use client";

import { Search, SlidersHorizontal } from "lucide-react";

interface FilterBarProps {
    search: string;
    department: string;
    departments: string[];
    wp: string;
    workcenter: string;
    onSearchChange: (value: string) => void;
    onDepartmentChange: (value: string) => void;
    onWpChange: (value: string) => void;
    onWorkcenterChange: (value: string) => void;
    onSubmit: () => void;
}

export default function FilterBar({
    search,
    department,
    departments,
    wp,
    workcenter,
    onSearchChange,
    onDepartmentChange,
    onWpChange,
    onWorkcenterChange,
    onSubmit,
}: FilterBarProps) {
    return (
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3 text-sm font-medium text-gray-500">
                <SlidersHorizontal size={16} />
                Filtry
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4 lg:grid-cols-3">
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
                    {departments.map((dept) => (
                        <option key={dept} value={dept}>
                            {dept}
                        </option>
                    ))}
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

                {/* Workcenter (Manual input for now, could be select) */}
                <div className="relative">
                    <input
                        type="text"
                        value={workcenter}
                        onChange={(e) => onWorkcenterChange(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") onSubmit();
                        }}
                        placeholder="Pracoviště..."
                        className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2.5 px-4 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                </div>
                
                {/* Submit button */}
                <button
                    onClick={onSubmit}
                    className="w-full rounded-lg bg-[#0054A6] py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-95 sm:col-span-4 lg:col-span-1"
                >
                    Filtrovat
                </button>
            </div>
        </div>
    );
}
