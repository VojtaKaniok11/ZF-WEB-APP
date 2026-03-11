import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export async function GET() {
    try {
        const db = await getPool();
        const todayStr = new Date().toISOString().split('T')[0];

        // Only return the LATEST record per exam type per employee
        // Compute status exactly like detail page
        const result = await db.request().query(`
            WITH RankedRecords AS (
                SELECT
                    em.EmployeePersonalNumber AS personalNumber,
                    em.ExamTypeID AS examTypeId,
                    CONVERT(varchar(10), em.NextExamDate, 23) AS nextExamDate,
                    ROW_NUMBER() OVER(PARTITION BY em.EmployeePersonalNumber, em.ExamTypeID ORDER BY em.ExamDate DESC) as rn
                FROM dbo.MEDICAL_EXAM_RECORDS em
            )
            SELECT 
                personalNumber, 
                examTypeId, 
                nextExamDate
            FROM RankedRecords
            WHERE rn = 1
        `);

        // Compute status for each
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const data = result.recordset.map(row => {
            const nextExamDate = row.nextExamDate ? new Date(row.nextExamDate) : null;
            if (nextExamDate) nextExamDate.setHours(0, 0, 0, 0);

            let status = "valid";
            if (nextExamDate) {
                const thirtyDays = new Date(today);
                thirtyDays.setDate(thirtyDays.getDate() + 30);
                if (nextExamDate < today) status = "expired";
                else if (nextExamDate <= thirtyDays) status = "expiring_soon";
            }

            return {
                personalNumber: row.personalNumber,
                examTypeId: row.examTypeId,
                status: status
            };
        });

        return NextResponse.json({ success: true, data });
    } catch (err) {
        console.error("[GET /api/medical/summary]", err);
        return NextResponse.json({ success: false, data: [] }, { status: 500 });
    }
}
