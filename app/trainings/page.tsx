import TrainingsClient from "@/components/TrainingsClient";

export default async function TrainingsPage() {
    // Server‑side fetch of employees
    const res = await fetch("http://localhost:3000/api/employees", {
        cache: "no-store",
    });
    const json = (await res.json()) as { success: boolean; data: any };
    const employees = json.success ? json.data : [];

    return <TrainingsClient employees={employees} />;
}
