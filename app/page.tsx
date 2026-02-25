import { Suspense } from "react";
import EmployeesPage from "@/components/EmployeesPage";

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-gray-400">Načítám...</p>
        </div>
      }
    >
      <EmployeesPage />
    </Suspense>
  );
}
