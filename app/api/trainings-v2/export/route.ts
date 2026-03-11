import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import * as xlsx from "xlsx";

export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const filter = url.searchParams.get("filter") || "all";
        const categoryFilter = url.searchParams.get("category") || "Vše";
        
        const db = await getPool();
        const req = db.request();
        
        let queryCondition = "";
        if (filter === "expiring") {
            queryCondition += `
              AND (
                  lr.ExpirationDate < CAST(SYSDATETIME() AS DATE) OR
                  DATEDIFF(day, CAST(SYSDATETIME() AS DATE), lr.ExpirationDate) <= 30
              )
            `;
        }
        
        if (categoryFilter !== "Vše") {
            queryCondition += ` AND c.Name = @category`;
            req.input("category", categoryFilter);
        }

        const result = await req.query(`
            WITH LatestRecords AS (
                SELECT 
                    r.EmployeeID,
                    r.TrainingID,
                    r.CompletionDate,
                    r.ExpirationDate,
                    r.IsLegalOrExternal,
                    ROW_NUMBER() OVER(PARTITION BY r.EmployeeID, r.TrainingID ORDER BY r.CompletionDate DESC, r.ID DESC) as rn
                FROM dbo.TRAINING_RECORDS r
            )
            SELECT 
                e.FirstName,
                e.LastName,
                e.PersonalNumber,
                t.Name as TrainingName,
                c.Name as CategoryName,
                lr.CompletionDate,
                lr.ExpirationDate,
                CAST(ISNULL(lr.IsLegalOrExternal, 0) AS BIT) as IsLegalOrExternal,
                CASE
                    WHEN lr.ExpirationDate < CAST(SYSDATETIME() AS DATE) THEN 'Prošlé'
                    WHEN DATEDIFF(day, CAST(SYSDATETIME() AS DATE), lr.ExpirationDate) <= 30 THEN 'Blíží se expirace'
                    ELSE 'Platné'
                END as Status
            FROM LatestRecords lr
            JOIN dbo.EMPLOYEES e ON lr.EmployeeID = e.ID
            JOIN dbo.TRAININGS_CATALOG t ON lr.TrainingID = t.ID
            JOIN dbo.TRAINING_CATEGORIES c ON t.CategoryID = c.ID
            WHERE lr.rn = 1 AND e.IsActive = 1
            ${queryCondition}
            ORDER BY lr.ExpirationDate ASC, e.LastName, e.FirstName
        `);

        // Transform for Excel format
        const data = result.recordset.map(row => ({
    'Příjmení a jméno': `${row.LastName} ${row.FirstName}`,
    'Osobní číslo': row.PersonalNumber || '',
    'Název školení': row.TrainingName,
    'Kategorie': row.CategoryName,
    'Zákonné / Externí': row.IsLegalOrExternal ? 'Ano' : 'Ne',
    'Datum absolvování': row.CompletionDate ? new Date(row.CompletionDate).toLocaleDateString('cs-CZ') : '',
            'Datum platnosti': row.ExpirationDate ? new Date(row.ExpirationDate).toLocaleDateString('cs-CZ') : '',
            'Stav': row.Status
        }));

        const ws = xlsx.utils.json_to_sheet(data.length > 0 ? data : [{'Informace': 'Žádná data neodpovídají zvolenému filtru.'}]);
        
        // Auto-size columns (rough calculation)
        if (data.length > 0) {
            const wscols = [
                { wch: 25 }, // Příjmení a jméno
                { wch: 15 }, // Osobní číslo
                { wch: 40 }, // Název školení
                { wch: 20 }, // Kategorie
                { wch: 18 }, // Zákonné / Externí
                { wch: 18 }, // Datum absolvování
                { wch: 18 }, // Datum platnosti
                { wch: 18 }  // Stav
            ];
            ws['!cols'] = wscols;
        }

        const wb = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(wb, ws, "Katalog Školení");

        const buf = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });

        return new NextResponse(buf, {
            status: 200,
            headers: {
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition": `attachment; filename="skoleni_export_${filter}.xlsx"`
            }
        });

    } catch (err) {
        console.error("[GET /api/trainings-v2/export]", err);
        return NextResponse.json({ success: false, message: "Chyba při exportu dat pro Excel." }, { status: 500 });
    }
}
