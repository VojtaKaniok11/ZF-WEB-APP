"use client";

import { useEffect, useState } from "react";
import MedicalClient from "@/components/MedicalClient";
import { getApiUrl } from "@/lib/constants";
import { Employee } from "@/types/employee";

export default function MedicalPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const apiUrl = getApiUrl();
        fetch(`${apiUrl}/employees`)
            .then(res => res.json())
            .then(json => {
                if (json.success) setEmployees(json.data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <p className="text-gray-400">Načítám...</p>
            </div>
        );
    }

    return <MedicalClient employees={employees} />;
}
