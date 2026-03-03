"use client";

import { useState, useEffect } from "react";
import { Employee } from "@/types/employee";
import PersonList from "@/components/PersonList";

export default function IluoPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);

    useEffect(() => {
        fetch("/api/employees")
            .then((r) => r.json())
            .then((json) => { if (json.success) setEmployees(json.data); })
            .catch(() => { });
    }, []);

    return (
        <PersonList
            employees={employees}
            basePath="/iluo"
            title="ILUO – Matice dovedností"
            description="Hodnocení dovedností zaměstnanců: I (Začátečník) → L (Zácvik) → U (Samostatný pracovník) → O (Expert)."
            icon={
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                </svg>
            }
        />
    );
}
