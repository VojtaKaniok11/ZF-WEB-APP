"use client";

import { useState } from "react";
import { Employee } from "@/types/employee";
import PersonList from "@/components/PersonList";
import AddMedicalModal from "@/components/AddMedicalModal";
import { Plus } from "lucide-react";

interface MedicalClientProps {
    employees: Employee[];
}

export default function MedicalClient({ employees }: MedicalClientProps) {
    const [modalOpen, setModalOpen] = useState(false);

    return (
        <>
            <PersonList
                employees={employees}
                basePath="/medical"
                title="Lékařské prohlídky"
                description="Evidence lékařských prohlídek zaměstnanců — vstupní, periodické, mimořádné."
                icon={
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                    </svg>
                }
                actionButton={
                    <button
                        onClick={() => setModalOpen(true)}
                        className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90 active:scale-95 cursor-pointer"
                        style={{ backgroundColor: "#0054A6" }}
                    >
                        <Plus size={16} />
                        Přidat prohlídku
                    </button>
                }
            />

            {modalOpen && (
                <AddMedicalModal
                    employees={employees}
                    onClose={() => setModalOpen(false)}
                    onSuccess={() => setModalOpen(false)}
                />
            )}
        </>
    );
}
