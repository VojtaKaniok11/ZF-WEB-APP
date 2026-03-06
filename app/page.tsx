import { Suspense } from "react";
import { headers } from "next/headers";
import EmployeesPage from "@/components/EmployeesPage";
import { Employee } from "@/types/employee";

export default async function Home() {
  const host = (await headers()).get("host");
  const protocol = host?.includes("localhost") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;

  const res = await fetch(`${baseUrl}/api/employees`, { cache: "no-store" });
  const json = (await res.json()) as { success: boolean; data: Employee[] };
  const initialEmployees = json.success ? json.data : [];

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-gray-400">Načítám...</p>
        </div>
      }
    >
      <EmployeesPage initialEmployees={initialEmployees} />
    </Suspense>
  );
}
