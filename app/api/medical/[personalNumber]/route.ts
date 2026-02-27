import { NextRequest, NextResponse } from "next/server";
import { getMedicalRecordsForEmployee } from "@/lib/mock-medical";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ personalNumber: string }> }
) {
    const { personalNumber } = await params;
    const decoded = decodeURIComponent(personalNumber);
    const data = getMedicalRecordsForEmployee(decoded);
    return NextResponse.json({ success: true, data });
}
