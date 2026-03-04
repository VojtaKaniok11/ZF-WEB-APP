import { NextRequest, NextResponse } from "next/server";
import { getPool, sql } from "@/lib/db";

/** Generuje unikátní nvarchar ID, např. "MED-20260304-abc12" */
function genId(prefix: string): string {
    const now = new Date();
    const datePart = now.toISOString().slice(0, 10).replace(/-/g, "");
    const rand = Math.random().toString(36).slice(2, 7);
    return `${prefix}-${datePart}-${rand}`;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        if (!body.examTypeName?.trim())
            return NextResponse.json({ success: false, error: "Chybí název nebo druh prohlídky." }, { status: 400 });
        if (!body.examDate)
            return NextResponse.json({ success: false, error: "Chybí datum prohlídky." }, { status: 400 });
        if (!body.attendeePersonalNumbers?.length)
            return NextResponse.json({ success: false, error: "Chybí seznam zaměstnanců." }, { status: 400 });

        const db = await getPool();

        // ── 1. Najdi nebo vytvoř ExamType ─────────────────────────────────
        // Sloupce: ID (nvarchar), Name, Description, ValidityMonths, Category
        let examTypeId: string = body.examTypeId ?? "";

        if (!examTypeId) {
            const findReq = db.request();
            findReq.input("name", sql.NVarChar(100), body.examTypeName.trim());
            const findRes = await findReq.query(`SELECT ID FROM dbo.MEDICAL_EXAM_TYPES WHERE Name = @name`);

            if (findRes.recordset.length > 0) {
                examTypeId = findRes.recordset[0].ID;
            } else {
                examTypeId = genId("MED");
                const insReq = db.request();
                insReq.input("id", sql.NVarChar(50), examTypeId);
                insReq.input("name", sql.NVarChar(100), body.examTypeName.trim());
                insReq.input("validity", sql.Int, 0);
                insReq.input("category", sql.NVarChar(50), "Ostatní");
                await insReq.query(`
                    INSERT INTO dbo.MEDICAL_EXAM_TYPES (ID, Name, ValidityMonths, Category)
                    VALUES (@id, @name, @validity, @category)
                `);
            }
        }

        // ── 2. Vlož záznam pro každého zaměstnance ────────────────────────
        // Sloupce: ID (nvarchar, NOT NULL, bez identity!), ExamTypeID, EmployeePersonalNumber,
        //          ExamDate (date), NextExamDate (date), DoctorName, Result, Notes, StatusOverride
        const pns: string[] = body.attendeePersonalNumbers;
        for (const pn of pns) {
            const recordId = genId("REC");
            const req = db.request();
            req.input("id", sql.NVarChar(50), recordId);
            req.input("typeId", sql.NVarChar(50), examTypeId);
            req.input("pn", sql.NVarChar(50), pn);
            req.input("examDate", sql.Date, new Date(body.examDate));
            req.input("nextExamDate", sql.Date, body.nextExamDate ? new Date(body.nextExamDate) : null);
            req.input("doctor", sql.NVarChar(100), body.doctorName?.trim() || null);
            req.input("result", sql.NVarChar(50), body.result?.trim() || "Způsobilý");
            req.input("notes", sql.NVarChar(500), body.notes?.trim() || null);
            await req.query(`
                INSERT INTO dbo.MEDICAL_EXAM_RECORDS
                    (ID, ExamTypeID, EmployeePersonalNumber, ExamDate, NextExamDate, DoctorName, Result, Notes)
                VALUES
                    (@id, @typeId, @pn, @examDate, @nextExamDate, @doctor, @result, @notes)
            `);
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("[POST /api/medical]", err);
        return NextResponse.json({ success: false, error: err.message ?? "Chyba serveru." }, { status: 500 });
    }
}
