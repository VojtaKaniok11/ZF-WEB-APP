"use client";

import { useState } from "react";
import PersonList from "@/components/PersonList";
import AddTrainingModal from "@/components/AddTrainingModal";
import { Plus } from "lucide-react";
import { Employee } from "@/types/employee";

interface TrainingsClientProps {
    employees: Employee[];
}

export default function TrainingsClient({ employees }: TrainingsClientProps) {
    const [modalOpen, setModalOpen] = useState(false);

    return (
        <>
            <PersonList
                employees={employees}
                basePath="/trainings"
                title="Školení"
                description="Přehled školení zaměstnanců — BOZP, PO, odborná školení a certifikace."
                icon={
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a23.838 23.838 0 0 0-1.012 5.434c0 .043.007.085.01.127a23.95 23.95 0 0 0 5.502 1.397m-5.502-6.958a24.08 24.08 0 0 1 2.918-3.56M12 3.59a24.076 24.076 0 0 1 5.166 6.558m-10.332 0A23.953 23.953 0 0 1 12 8.59a23.953 23.953 0 0 1 5.166 1.558M12 3.59l-.004.014M12 3.59l.004.014M3.859 6.707a24.08 24.08 0 0 1 2.918-3.56" />
                    </svg>
                }
                actionButton={
                    <button
                        onClick={() => setModalOpen(true)}
                        className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90 active:scale-95 cursor-pointer"
                        style={{ backgroundColor: "#0054A6" }}
                    >
                        <Plus size={16} />
                        Přidat školení
                    </button>
                }
            />

            {modalOpen && (
                <AddTrainingModal
                    employees={employees}
                    onClose={() => setModalOpen(false)}
                    onSuccess={() => setModalOpen(false)}
                />
            )}
        </>
    );
}
