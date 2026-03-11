import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import * as xlsx from "xlsx";

export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const typeId = url.searchParams.get("typeId") || "Vše";
        const status = url.searchParams.get("status") || "Vše";

        const db = await getPool();

        // 1. Fetch all active employees
        const empResult = await db.request().query(`
            SELECT FirstName, LastName, PersonalNumber, Department
            FROM dbo.EMPLOYEES
            WHERE IsActive = 1
            ORDER BY LastName, FirstName
        `);
        const employees = empResult.recordset;

        // 2. Fetch medical types
        const typesResult = await db.request().query("SELECT ID, Name FROM dbo.MEDICAL_EXAM_TYPES");
        const typesMap = new Map();
        typesResult.recordset.forEach((t: any) => typesMap.set(t.ID, t.Name));
        
        let targetTypeName = "Všechny prohlídky";
        if (typeId !== "Vše" && typesMap.has(typeId)) {
            targetTypeName = typesMap.get(typeId);
        }

        // 3. Fetch summary for the type, or all records
        const req = db.request();
        let summaryQuery = `
            WITH RankedRecords AS (
                SELECT
                    em.EmployeePersonalNumber AS personalNumber,
                    em.ExamTypeID AS examTypeId,
                    CONVERT(varchar(10), em.NextExamDate, 23) AS nextExamDate,
                    em.ExamDate,
                    em.Result,
                    ROW_NUMBER() OVER(PARTITION BY em.EmployeePersonalNumber, em.ExamTypeID ORDER BY em.ExamDate DESC, em.ID DESC) as rn
                FROM dbo.MEDICAL_EXAM_RECORDS em
            )
            SELECT personalNumber, examTypeId, nextExamDate, ExamDate, Result
            FROM RankedRecords
            WHERE rn = 1
        `;
        
        if (typeId !== "Vše") {
            summaryQuery += ` AND examTypeId = @typeId`;
            req.input("typeId", typeId);
        }

        const summaryResult = await req.query(summaryQuery);
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const thirtyDays = new Date(today);
        thirtyDays.setDate(thirtyDays.getDate() + 30);

        const summaryData = summaryResult.recordset.map((row: any) => {
            const nextExamDate = row.nextExamDate ? new Date(row.nextExamDate) : null;
            if (nextExamDate) nextExamDate.setHours(0, 0, 0, 0);

            let computedStatus = "Platné";
            if (nextExamDate) {
                if (nextExamDate < today) computedStatus = "Neplatné";
                else if (nextExamDate <= thirtyDays) computedStatus = "Blíží se expirace";
            }

            return {
                personalNumber: row.personalNumber,
                examTypeId: row.examTypeId,
                status: computedStatus,
                nextExamDate: row.nextExamDate,
                examDate: row.ExamDate ? new Date(row.ExamDate).toLocaleDateString("cs-CZ") : "",
                result: row.Result || ""
            };
        });

        const summaryMap = new Map(); // personalNumber -> map of examTypeId -> record
        summaryData.forEach((r: any) => {
            if (!summaryMap.has(r.personalNumber)) {
                summaryMap.set(r.personalNumber, new Map());
            }
            summaryMap.get(r.personalNumber).set(r.examTypeId, r);
        });

        let data = [];

        // Apply filtering similar to frontend
        for (const emp of employees) {
            if (typeId !== "Vše") {
                const record = summaryMap.has(emp.PersonalNumber) ? summaryMap.get(emp.PersonalNumber).get(typeId) : null;
                let currentStatus = "Neproškolen";
                if (record) {
                    currentStatus = record.status;
                }

                let include = true;
                if (status !== "Vše") {
                    if (status === "Neplatné" && (currentStatus === "Neproškolen" || currentStatus === "Neplatné")) {
                        include = true;
                    } else if (currentStatus === status) {
                        include = true;
                    } else {
                        include = false;
                    }
                }

                if (include) {
                    data.push({
                        'Příjmení a jméno': `${emp.LastName} ${emp.FirstName}`,
                        'Osobní číslo': emp.PersonalNumber || '',
                        'Oddělení': emp.Department || '',
                        'Název prohlídky': targetTypeName,
                        'Datum prohlídky': record ? record.examDate : '',
                        'Platnost do': record && record.nextExamDate ? new Date(record.nextExamDate).toLocaleDateString("cs-CZ") : '',
                        'Výsledek': record ? record.result : '',
                        'Stav': currentStatus
                    });
                }
            } else {
                // If Vše is selected. Currently frontend shows everyone if both are Vše.
                data.push({
                    'Příjmení a jméno': `${emp.LastName} ${emp.FirstName}`,
                    'Osobní číslo': emp.PersonalNumber || '',
                    'Oddělení': emp.Department || '',
                    'Stav prohlídek': 'Všechny (nefiltrováno)'
                });
            }
        }

        const ws = xlsx.utils.json_to_sheet(data.length > 0 ? data : [{'Informace': 'Žádná data neodpovídají zvolenému filtru.'}]);
        
        if (data.length > 0) {
            ws['!cols'] = [
                { wch: 25 },
                { wch: 15 },
                { wch: 25 },
                { wch: 30 },
                { wch: 18 },
                { wch: 18 },
                { wch: 20 },
                { wch: 18 }
            ];
        }

        const wb = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(wb, ws, "Lékařské prohlídky");

        const buf = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });

        return new NextResponse(buf, {
            status: 200,
            headers: {
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition": `attachment; filename="lekarske_prohlidky_export.xlsx"`
            }
        });

    } catch (err) {
        console.error("[GET /api/medical/export]", err);
        return NextResponse.json({ success: false, message: "Chyba při exportu dat pro Excel." }, { status: 500 });
    }
}
