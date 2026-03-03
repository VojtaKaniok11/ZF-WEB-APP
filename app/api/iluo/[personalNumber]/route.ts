import { NextRequest, NextResponse } from "next/server";
import { getPool, sql } from "@/lib/db";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ personalNumber: string }> }
) {
    try {
        const { personalNumber } = await params;
        const pn = decodeURIComponent(personalNumber);

        const db = await getPool();
        const req = db.request();
        req.input("pn", sql.VarChar(10), pn);

        // JOIN: EMPLOYEES → ILUO_RECORDS → WORKCENTERS (HR)
        // Každý záznam v ILUO_RECORDS je Level pro daný Workcenter
        const result = await req.query(`
            SELECT
                a.ID                                        AS assessmentId,
                s.ID                                        AS skillId,
                s.Name                                      AS skillName,
                s.Category                                  AS category,
                w.ID                                        AS workCenterId,
                w.WCName                                    AS workCenterName,
                a.Level                                     AS currentLevel,
                a.TargetLevel                               AS targetLevel,
                CONVERT(varchar(10), a.AssessmentDate, 23)  AS assessmentDate,
                CONVERT(varchar(10), a.NextReviewDate, 23)  AS nextReviewDate,
                ISNULL(a.AssessorName, '—')                 AS assessorName,
                ISNULL(a.Notes, '')                         AS notes
            FROM dbo.ILUO_ASSESSMENTS a
            JOIN dbo.ILUO_SKILLS s ON s.ID = a.SkillID
            JOIN dbo.WORKCENTERS w ON w.ID = s.WorkCenterID
            WHERE a.EmployeePersonalNumber = @pn
            ORDER BY a.AssessmentDate DESC
        `);

        const records = result.recordset.map((row: Record<string, unknown>) => ({
            assessmentId: row.assessmentId as string,
            skillId: row.skillId as string,
            skillName: row.skillName as string,
            workCenterId: row.workCenterId as string,
            workCenterName: row.workCenterName as string,
            category: (row.category as string) || "Výrobní",
            currentLevel: (row.currentLevel as string) as "I" | "L" | "U" | "O",
            targetLevel: (row.targetLevel as string) as "I" | "L" | "U" | "O",
            assessmentDate: row.assessmentDate as string,
            assessorName: row.assessorName as string,
            nextReviewDate: row.nextReviewDate as string || null,
            notes: row.notes as string,
        }));

        return NextResponse.json({ success: true, data: records });
    } catch (err) {
        console.error("[GET /api/iluo/[pn]]", err);
        return NextResponse.json({ success: false, data: [] }, { status: 500 });
    }
}
