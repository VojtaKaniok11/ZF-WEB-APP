import MedicalClient from "@/components/MedicalClient";

export default async function MedicalPage() {
    // Server‑side fetch of employees
    const res = await fetch("http://localhost:3000/api/employees", {
        cache: "no-store",
    });
    const json = (await res.json()) as { success: boolean; data: any };
    const employees = json.success ? json.data : [];

    return <MedicalClient employees={employees} />;
}
