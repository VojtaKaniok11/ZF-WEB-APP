import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export async function GET() {
    try {
        const db = await getPool();
        const result = await db.request().query("SELECT ID, Name, ValidityMonths, Category, Description FROM dbo.MEDICAL_EXAM_TYPES");
        return NextResponse.json({ success: true, data: result.recordset });
    } catch (err) {
        console.error("[GET /api/medical-types]", err);
        return NextResponse.json({ success: false, data: [] }, { status: 500 });
    }
}
