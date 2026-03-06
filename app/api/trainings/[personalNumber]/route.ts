import { NextRequest, NextResponse } from "next/server";
import { getPool, sql } from "@/lib/db";

function computeStatus(nextExamDate: Date | null, today: Date): "valid" | "expiring_soon" | "expired" {
    if (!nextExamDate) return "valid";
    const thirtyDays = new Date(today);
    thirtyDays.setDate(thirtyDays.getDate() + 30);
    if (nextExamDate < today) return "expired";
    if (nextExamDate <= thirtyDays) return "expiring_soon";
    return "valid";
}

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
        req.input("pn", sql.VarChar(20), pn);

        const result = await req.query(`
            SELECT
                r.ID                                            AS sessionId,
                t.ID                                            AS trainingId,
                t.Name                                          AS trainingName,
                c.Name                                          AS category,
                t.PeriodicityMonths                             AS periodicityMonths,
                CONVERT(varchar(10), r.CompletionDate, 23)      AS completedDate,
                CONVERT(varchar(10), r.ExpirationDate, 23)      AS expirationDate,
                'Autorizovaný lektor ZF'                        AS trainerName,
                ''                                              AS statusOverride,
                ''                                              AS notes
            FROM dbo.TRAINING_RECORDS r
            JOIN dbo.TRAININGS_CATALOG t ON t.ID = r.TrainingID
            JOIN dbo.TRAINING_CATEGORIES c ON c.ID = t.CategoryID
            JOIN dbo.EMPLOYEES e ON e.ID = r.EmployeeID
            WHERE e.PersonalNumber = @pn
            ORDER BY r.CompletionDate DESC, r.ID DESC
        `);

        const records = result.recordset.map((row) => {
            // PeriodicityMonths = 0 → jednorázové, bez expirace
            const expirationDate = row.periodicityMonths > 0 ? row.expirationDate : null;
            const expDate = expirationDate ? new Date(expirationDate) : null;
            if (expDate) expDate.setHours(0, 0, 0, 0);

            let status = computeStatus(expDate, today);
            // Je-li vyloženě zadané, že to nesplnil, dáme manuálně expired
            if (row.statusOverride && row.statusOverride.toLowerCase() !== "absolvoval") {
                status = "expired";
            }

            return {
                trainingId: row.trainingId,
                sessionId: row.sessionId,
                trainingName: row.trainingName,
                category: row.category,
                completedDate: row.completedDate,
                expirationDate,
                trainerName: row.trainerName || "—",
                notes: row.notes || "",
                status: status,
            };
        });

        return NextResponse.json({ success: true, data: records });
    } catch (err) {
        console.error("[GET /api/trainings/[pn]]", err);
        return NextResponse.json({ success: false, data: [] }, { status: 500 });
    }
}
