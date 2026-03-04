import MedicalClient from "@/components/MedicalClient";
import { headers } from "next/headers";

export default async function MedicalPage() {
    // Get base URL for server-side fetch
    const host = (await headers()).get("host");
    const protocol = host?.includes("localhost") ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;

    // Server‑side fetch of employees
    const res = await fetch(`${baseUrl}/api/employees`, {
        cache: "no-store",
    });
    const json = (await res.json()) as { success: boolean; data: any };
    const employees = json.success ? json.data : [];

    return <MedicalClient employees={employees} />;
}
