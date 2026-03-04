import { NextRequest, NextResponse } from "next/server";
import { getPool, sql } from "@/lib/db";

/** GET — seznam OOPP pomůcek z katalogu (pro dropdown v modalu) */
export async function GET() {
    try {
        const db = await getPool();
        const result = await db.request().query(
            "SELECT ID, Name, Category FROM dbo.OOPP_ITEMS ORDER BY Category, Name"
        );
        return NextResponse.json({ success: true, data: result.recordset });
    } catch (err) {
        console.error("[GET /api/oopp]", err);
        return NextResponse.json({ success: false, data: [] }, { status: 500 });
    }
}

function genId(prefix: string): string {
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const rand = Math.random().toString(36).slice(2, 7);
    return `${prefix}-${datePart}-${rand}`;
}

/** POST — vytvoř výdej OOPP pro jednoho nebo více zaměstnanců */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        if (!body.ooppItemId?.trim())
            return NextResponse.json({ success: false, error: "Chybí výběr OOPP pomůcky." }, { status: 400 });
        if (!body.issueDate)
            return NextResponse.json({ success: false, error: "Chybí datum výdeje." }, { status: 400 });
        if (!body.attendeePersonalNumbers?.length)
            return NextResponse.json({ success: false, error: "Chybí seznam zaměstnanců." }, { status: 400 });

        const db = await getPool();
        const pns: string[] = body.attendeePersonalNumbers;

        for (const pn of pns) {
            const id = genId("ISS");
            const req = db.request();
            req.input("id", sql.NVarChar(50), id);
            req.input("itemId", sql.NVarChar(50), body.ooppItemId.trim());
            req.input("pn", sql.NVarChar(50), pn);
            req.input("issueDate", sql.Date, new Date(body.issueDate));
            req.input("nextDate", sql.Date, body.nextEntitlementDate ? new Date(body.nextEntitlementDate) : null);
            req.input("quantity", sql.Int, body.quantity ?? 1);
            req.input("size", sql.NVarChar(50), body.size?.trim() || null);
            req.input("notes", sql.NVarChar(500), body.notes?.trim() || null);
            await req.query(`
                INSERT INTO dbo.OOPP_ISSUES
                    (ID, OoppItemID, EmployeePersonalNumber, IssueDate, NextEntitlementDate, Quantity, Size, Notes)
                VALUES
                    (@id, @itemId, @pn, @issueDate, @nextDate, @quantity, @size, @notes)
            `);
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("[POST /api/oopp]", err);
        return NextResponse.json({ success: false, error: err.message ?? "Chyba serveru." }, { status: 500 });
    }
}
