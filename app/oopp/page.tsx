import { headers } from "next/headers";
import { Employee } from "@/types/employee";
import OoppClient from "@/components/OoppClient";

export default async function OoppPage() {
    const host = (await headers()).get("host");
    const protocol = host?.includes("localhost") ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;

    const res = await fetch(`${baseUrl}/api/employees`, { cache: "no-store" });
    const json = (await res.json()) as { success: boolean; data: Employee[] };
    const employees = json.success ? json.data : [];

    return <OoppClient employees={employees} />;
}
