import { NextRequest, NextResponse } from "next/server";
import { getPool, sql } from "@/lib/db";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const resolvedParams = await params;
        const trainingId = parseInt(resolvedParams.id, 10);

        if (isNaN(trainingId)) {
            return NextResponse.json({ success: false, message: "Neplatné ID školení." }, { status: 400 });
        }

        const db = await getPool();

        // 1. Získání detailu školení
        const reqDetail = db.request();
        reqDetail.input("tid", sql.Int, trainingId);
        const detailResult = await reqDetail.query(`
            SELECT 
                t.ID as id,
                t.Name as name,
                t.Description as description,
                t.PeriodicityMonths as periodicityMonths,
                c.Name as categoryName
            FROM dbo.TRAININGS_CATALOG t
            JOIN dbo.TRAINING_CATEGORIES c ON t.CategoryID = c.ID
            WHERE t.ID = @tid
        `);

        if (detailResult.recordset.length === 0) {
            return NextResponse.json({ success: false, message: "Školení nenalezeno." }, { status: 404 });
        }

        const training = detailResult.recordset[0];

        // 2. Získání všech aktivních zaměstnanců a jejich nejnovějšího záznamu o tomto školení
        const reqEmp = db.request();
        reqEmp.input("tid", sql.Int, trainingId);

        const empResult = await reqEmp.query(`
            SELECT 
                e.ID as employeeId,
                e.FirstName as firstName,
                e.LastName as lastName,
                ISNULL(e.PersonalNumber, '') as personalNumber,
                ISNULL(e.Department, '') as department,
                CAST(ISNULL(tr.HasCompleted, 0) AS BIT) as hasCompleted,
                tr.CompletionDate as completionDate,
                tr.ExpirationDate as expirationDate,
                CAST(ISNULL(tr.IsLegalOrExternal, 0) AS BIT) as isLegalOrExternal,
                CASE
                    WHEN tr.HasCompleted IS NULL THEN 'Neproškolen'
                    WHEN tr.ExpirationDate < CAST(SYSDATETIME() AS DATE) THEN 'Neplatné'
                    WHEN DATEDIFF(day, CAST(SYSDATETIME() AS DATE), tr.ExpirationDate) <= 30 THEN 'Blíží se expirace'
                    ELSE 'Platné'
                END as validityStatus
            FROM dbo.EMPLOYEES e
            OUTER APPLY (
                SELECT TOP 1 
                    1 as HasCompleted,
                    r.CompletionDate, 
                    r.ExpirationDate,
                    r.IsLegalOrExternal
                FROM dbo.TRAINING_RECORDS r
                WHERE r.EmployeeID = e.ID AND r.TrainingID = @tid
                ORDER BY r.CompletionDate DESC, r.ID DESC
            ) tr
            WHERE e.IsActive = 1
            ORDER BY e.LastName, e.FirstName
        `);

        return NextResponse.json({
            success: true,
            training: training,
            employees: empResult.recordset
        });

    } catch (err) {
        console.error("[GET /api/trainings-v2/[id]]", err);
        return NextResponse.json({ success: false, message: "Chyba při načítání detailu školení." }, { status: 500 });
    }
}
