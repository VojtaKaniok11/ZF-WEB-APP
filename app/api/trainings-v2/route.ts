import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export async function GET() {
    try {
        const db = await getPool();
        const req = db.request();

        const result = await req.query(`
            SELECT 
                t.ID as id,
                t.Name as name,
                t.Description as description,
                t.PeriodicityMonths as periodicityMonths,
                c.ID as categoryId,
                c.Name as categoryName
            FROM dbo.TRAININGS_CATALOG t
            JOIN dbo.TRAINING_CATEGORIES c ON t.CategoryID = c.ID
            ORDER BY c.Name, t.Name
        `);

        return NextResponse.json({ success: true, data: result.recordset });
    } catch (err) {
        console.error("[GET /api/trainings-v2]", err);
        return NextResponse.json({ success: false, message: "Chyba při načítání katalogu." }, { status: 500 });
    }
}
