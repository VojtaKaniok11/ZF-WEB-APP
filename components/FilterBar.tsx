"use client";

import { Search, SlidersHorizontal } from "lucide-react";

const CATEGORY_OPTIONS = [
    { value: "11", label: "11 – Výroba" },
    { value: "12", label: "12 – Výroba" },
    { value: "31", label: "31 – Kancelář" },
    { value: "41", label: "41 – Kancelář" },
];

const ACTIVE_OPTIONS = [
    { value: "",    label: "Stav: Aktivní" },
    { value: "all", label: "Stav: Vše" },
    { value: "no",  label: "Stav: Neaktivní" },
];

interface FilterBarProps {
    search: string;
    category: string;
    workcenter: string;
    workcenterDesc: string;
    active: string;
    onSearchChange: (value: string) => void;
    onCategoryChange: (value: string) => void;
    onWorkcenterChange: (value: string) => void;
    onWorkcenterDescChange: (value: string) => void;
    onActiveChange: (value: string) => void;
}

const inputClass =
    "w-full rounded-lg border border-gray-300 bg-gray-50 py-2.5 px-4 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20";

export default function FilterBar({
    search,
    category,
    workcenter,
    workcenterDesc,
    active,
    onSearchChange,
    onCategoryChange,
    onWorkcenterChange,
    onWorkcenterDescChange,
    onActiveChange,
}: FilterBarProps) {
    return (
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3 text-sm font-medium text-gray-500">
                <SlidersHorizontal size={16} />
                Filtry
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">

                {/* 1. Jméno / Příjmení */}
                <div className="relative">
                    <Search
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Jméno nebo příjmení..."
                        className={`${inputClass} pl-10`}
                    />
                </div>

                {/* 2. Kategorie */}
                <select
                    value={category}
                    onChange={(e) => onCategoryChange(e.target.value)}
                    className={inputClass}
                >
                    <option value="">Kategorie: Vše</option>
                    {CATEGORY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>

                {/* 3. Kmenové středisko (číslo) */}
                <input
                    type="text"
                    value={workcenter}
                    onChange={(e) => onWorkcenterChange(e.target.value)}
                    placeholder="Kmen. středisko..."
                    className={inputClass}
                />

                {/* 4. Kmenové středisko popis (oddělení) */}
                <input
                    type="text"
                    value={workcenterDesc}
                    onChange={(e) => onWorkcenterDescChange(e.target.value)}
                    placeholder="Středisko popis..."
                    className={inputClass}
                />

                {/* 5. Stav */}
                <select
                    value={active}
                    onChange={(e) => onActiveChange(e.target.value)}
                    className={inputClass}
                >
                    {ACTIVE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>

            </div>
        </div>
    );
}
