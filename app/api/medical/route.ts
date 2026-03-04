import { NextRequest, NextResponse } from "next/server";
import { getPool, sql } from "@/lib/db";

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
        let examTypeId = body.examTypeId;

        // 1. Pokud nemáme ID, nebo se jméno změnilo, zkusíme najít/vytvořit typ v číselníku
        if (!examTypeId || examTypeId === "") {
            const findReq = db.request();
            findReq.input("name", sql.NVarChar(100), body.examTypeName.trim());
            const findRes = await findReq.query("SELECT ID FROM dbo.MEDICAL_EXAM_TYPES WHERE Name = @name");

            if (findRes.recordset.length > 0) {
                examTypeId = findRes.recordset[0].ID;
            } else {
                // Musíme vytvořit novou kategorii
                const newId = "MED-" + Date.now().toString().slice(-8);
                const insTypeReq = db.request();
                insTypeReq.input("id", sql.VarChar(50), newId);
                insTypeReq.input("name", sql.NVarChar(100), body.examTypeName.trim());
                insTypeReq.input("validity", sql.Int, 0); // Výchozí bez periodicity
                insTypeReq.input("category", sql.VarChar(50), "Ostatní");

                await insTypeReq.query(`
                    INSERT INTO dbo.MEDICAL_EXAM_TYPES (ID, Name, ValidityMonths, Category)
                    VALUES (@id, @name, @validity, @category)
                `);
                examTypeId = newId;
            }
        }

        const pns: string[] = body.attendeePersonalNumbers;
        for (const pn of pns) {
            const req = db.request();
            req.input("typeId", sql.VarChar(50), examTypeId);
            req.input("pn", sql.VarChar(20), pn);
            req.input("examDate", sql.DateTime, new Date(body.examDate));
            req.input("nextExamDate", sql.DateTime, body.nextExamDate ? new Date(body.nextExamDate) : null);
            req.input("doctor", sql.NVarChar(100), body.doctorName?.trim() || "—");
            req.input("result", sql.NVarChar(50), body.result?.trim() || "Způsobilý");
            req.input("notes", sql.NVarChar(500), body.notes?.trim() || "");

            await req.query(`
                INSERT INTO dbo.MEDICAL_EXAM_RECORDS 
                (ExamTypeID, EmployeePersonalNumber, ExamDate, NextExamDate, DoctorName, Result, Notes)
                VALUES (@typeId, @pn, @examDate, @nextExamDate, @doctor, @result, @notes)
            `);
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("[POST /api/medical]", err);
        return NextResponse.json({ success: false, error: err.message || "Neplatný požadavek nebo chyba databáze." }, { status: 500 });
    }
}
