import { NextRequest, NextResponse } from "next/server";
import { getPool, sql } from "@/lib/db";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ personalNumber: string }> }
) {
    try {
        const { personalNumber } = await params;
        const pn = decodeURIComponent(personalNumber);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const db = await getPool();
        const req = db.request();
        req.input("pn", sql.VarChar(10), pn);

        const result = await req.query(`
            SELECT
                iss.ID                                          AS issueId,
                i.ID                                            AS ooppItemId,
                i.Name                                          AS ooppItemName,
                i.Category                                      AS category,
                CONVERT(varchar(10), iss.IssueDate, 23)         AS assignedDate,
                CONVERT(varchar(10), iss.NextEntitlementDate, 23) AS returnedDate,
                iss.Quantity                                    AS quantity,
                ISNULL(iss.Size, '')                            AS assignment,
                ISNULL(iss.Notes, '')                           AS notes
            FROM dbo.OOPP_ISSUES iss
            JOIN dbo.OOPP_ITEMS i ON i.ID = iss.OoppItemID
            WHERE iss.EmployeePersonalNumber = @pn
            ORDER BY iss.IssueDate DESC
        `);

        const records = result.recordset.map((row: Record<string, unknown>) => {
            const assignedDate = row.assignedDate ? new Date(row.assignedDate as string) : null;
            const returnedDate = row.returnedDate ? new Date(row.returnedDate as string) : null; // we repurpose returnedDate alias for nextEntitlementDate

            // Stav: počítáme nárok dle data 
            let status: "issued" | "eligible_soon" | "eligible" = "issued";
            if (returnedDate) {
                const thirtyDays = new Date(today);
                thirtyDays.setDate(thirtyDays.getDate() + 30);
                if (returnedDate <= today) status = "eligible";
                else if (returnedDate <= thirtyDays) status = "eligible_soon";
                else status = "issued";
            }

            return {
                issueId: row.issueId as string,
                ooppItemId: row.ooppItemId as string,
                ooppItemName: row.ooppItemName as string,
                category: (row.category as string) || "Ostatní",
                lastIssueDate: assignedDate?.toISOString().split("T")[0] ?? "—",
                nextEntitlementDate: returnedDate ? returnedDate.toISOString().split("T")[0] : null,
                quantity: (row.quantity as number) || 1,
                size: (row.assignment as string) || null,
                notes: row.notes as string,
                status,
            };
        });

        return NextResponse.json({ success: true, data: records });
    } catch (err) {
        console.error("[GET /api/oopp/[pn]]", err);
        return NextResponse.json({ success: false, data: [] }, { status: 500 });
    }
}
