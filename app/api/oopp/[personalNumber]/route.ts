import { NextRequest, NextResponse } from "next/server";
import { getOoppRecordsForEmployee } from "@/lib/mock-oopp";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ personalNumber: string }> }
) {
    const { personalNumber } = await params;
    const decoded = decodeURIComponent(personalNumber);
    const data = getOoppRecordsForEmployee(decoded);
    return NextResponse.json({ success: true, data });
}
