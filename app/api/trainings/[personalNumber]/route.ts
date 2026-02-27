import { NextRequest, NextResponse } from "next/server";
import { getTrainingRecordsForEmployee } from "@/lib/mock-trainings";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ personalNumber: string }> }
) {
    const { personalNumber } = await params;
    const decoded = decodeURIComponent(personalNumber);
    const data = getTrainingRecordsForEmployee(decoded);
    return NextResponse.json({ success: true, data });
}
