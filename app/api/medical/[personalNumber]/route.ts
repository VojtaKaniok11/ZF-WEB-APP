import { NextRequest, NextResponse } from "next/server";
import { getPool, sql } from "@/lib/db";

function computeStatus(nextExamDate: Date | null, today: Date): "valid" | "expiring_soon" | "expired" {
    if (!nextExamDate) return "valid"; // jednorázová prohlídka (vstupní, výstupní)
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
                mt.ID                                           AS examTypeId,
                em.ID                                           AS recordId,
                mt.Name                                         AS examTypeName,
                mt.Category                                     AS category,
                CONVERT(varchar(10), em.ExamDate, 23)          AS examDate,
                CONVERT(varchar(10), em.NextExamDate, 23)      AS nextExamDate,
                ISNULL(em.Result, '')                          AS result,
                ISNULL(em.DoctorName, '')                      AS doctorName,
                ISNULL(em.Notes, '')                           AS notes,
                mt.ValidityMonths                              AS periodicityMonths
            FROM dbo.MEDICAL_EXAM_RECORDS em
            JOIN dbo.MEDICAL_EXAM_TYPES mt ON mt.ID = em.ExamTypeID
            WHERE em.EmployeePersonalNumber = @pn
            ORDER BY em.ExamDate DESC
        `);

        const records = result.recordset.map((row: Record<string, unknown>) => {
            const nextExamDate = row.nextExamDate ? new Date(row.nextExamDate as string) : null;
            if (nextExamDate) nextExamDate.setHours(0, 0, 0, 0);

            return {
                examTypeId: row.examTypeId,
                recordId: row.recordId,
                examTypeName: row.examTypeName,
                category: row.category ?? "Ostatní",
                examDate: row.examDate,
                nextExamDate: row.nextExamDate ?? null,
                result: row.result || "—",
                notes: row.notes || "",
                doctorName: row.doctorName || "—",
                status: computeStatus(nextExamDate, today),
            };
        });

        return NextResponse.json({ success: true, data: records });
    } catch (err) {
        console.error("[GET /api/medical/[pn]]", err);
        return NextResponse.json({ success: false, data: [] }, { status: 500 });
    }
}
