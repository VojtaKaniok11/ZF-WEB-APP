import { NextRequest, NextResponse } from "next/server";
import { getIluoRecordsForEmployee } from "@/lib/mock-iluo";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ personalNumber: string }> }
) {
    const { personalNumber } = await params;
    const decoded = decodeURIComponent(personalNumber);
    const data = getIluoRecordsForEmployee(decoded);
    return NextResponse.json({ success: true, data });
}
