import { NextRequest, NextResponse } from "next/server";
import { getPool, sql } from "@/lib/db";

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

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        
        const categoryId = parseInt(body.categoryId, 10);
        const name = body.name?.trim();
        const periodicityMonths = parseInt(body.periodicityMonths, 10);
        
        // Validation
        if (!name || isNaN(categoryId) || isNaN(periodicityMonths)) {
            return NextResponse.json({ success: false, message: "Chybí povinné údaje pro vytvoření školení." }, { status: 400 });
        }

        const db = await getPool();
        const req = db.request();

        req.input("catId", sql.Int, categoryId);
        req.input("name", sql.NVarChar, name);
        req.input("desc", sql.NVarChar, body.description || "");
        req.input("period", sql.Int, periodicityMonths);

        await req.query(`
            INSERT INTO dbo.TRAININGS_CATALOG (CategoryID, Name, Description, PeriodicityMonths)
            VALUES (@catId, @name, @desc, @period)
        `);

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("[POST /api/trainings-v2]", err);
        return NextResponse.json({ success: false, message: "Chyba při ukládání školení." }, { status: 500 });
    }
}
