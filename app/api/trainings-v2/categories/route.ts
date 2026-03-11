import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export async function GET() {
    try {
        const db = await getPool();
        const req = db.request();

        const result = await req.query(`
            SELECT ID, Name 
            FROM dbo.TRAINING_CATEGORIES
            ORDER BY Name
        `);

        return NextResponse.json({ success: true, data: result.recordset });
    } catch (err) {
        console.error("[GET /api/trainings-v2/categories]", err);
        return NextResponse.json({ success: false, message: "Chyba při načítání kategorií." }, { status: 500 });
    }
}
