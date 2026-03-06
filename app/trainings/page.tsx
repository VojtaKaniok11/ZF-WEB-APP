import TrainingsClient from "@/components/TrainingsClient";
import { headers } from "next/headers";

export default async function TrainingsPage() {
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

    return <TrainingsClient employees={employees} />;
}
