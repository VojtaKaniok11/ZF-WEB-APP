import { NextRequest, NextResponse } from "next/server";
import { getEmployeeDetail } from "@/lib/mock-data";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ personalNumber: string }> }
) {
    const { personalNumber } = await params;
    const decodedPN = decodeURIComponent(personalNumber);
    const detail = getEmployeeDetail(decodedPN);

    if (!detail) {
        return NextResponse.json(
            { success: false, message: "Zaměstnanec nenalezen." },
            { status: 404 }
        );
    }

    return NextResponse.json({ success: true, data: detail });
}
