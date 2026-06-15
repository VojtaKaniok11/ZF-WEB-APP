"use client";

import { Suspense, useEffect, useState } from "react";
import EmployeesPage from "@/components/EmployeesPage";
import { getApiUrl } from "@/lib/constants";
import { Employee } from "@/types/employee";

export default function Home() {
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    const apiUrl = getApiUrl();
    fetch(`${apiUrl}/employees`)
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data?.length > 0) {
          setEmployees(json.data);
        }
      })
      .catch((e) => {
        console.error("Error fetching employees:", e);
      });
  }, []);


  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-gray-400">Načítám...</p>
        </div>
      }
    >
      <EmployeesPage initialEmployees={employees} />
    </Suspense>
  );
}

