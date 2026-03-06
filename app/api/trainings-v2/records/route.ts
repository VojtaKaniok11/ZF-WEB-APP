import { NextRequest, NextResponse } from "next/server";
import { getPool, sql } from "@/lib/db";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const employeeId = parseInt(body.employeeId, 10);
        const trainingId = parseInt(body.trainingId, 10);
        const completionDateStr = body.completionDate;

        if (isNaN(employeeId) || isNaN(trainingId) || !completionDateStr) {
            return NextResponse.json({ success: false, message: "Chybí povinné údaje." }, { status: 400 });
        }

        const db = await getPool();
        const req = db.request();

        const completionDate = new Date(completionDateStr);
        if (isNaN(completionDate.getTime())) {
            return NextResponse.json({ success: false, message: "Neplatné datum." }, { status: 400 });
        }

        req.input("empId", sql.Int, employeeId);
        req.input("trainId", sql.Int, trainingId);
        req.input("compDate", sql.Date, completionDate);

        // 1. Zjistit periodicitu školení
        const tResult = await req.query(`SELECT PeriodicityMonths FROM dbo.TRAININGS_CATALOG WHERE ID = @trainId`);
        if (tResult.recordset.length === 0) {
            return NextResponse.json({ success: false, message: "Školení neexistuje." }, { status: 404 });
        }
        const periodicity = tResult.recordset[0].PeriodicityMonths;

        // 2. Vypočítat expiraci
        const expirationDate = new Date(completionDate);
        expirationDate.setMonth(expirationDate.getMonth() + periodicity);

        req.input("expDate", sql.Date, expirationDate);

        // 3. Vložit záznam
        const insertResult = await req.query(`
            INSERT INTO dbo.TRAINING_RECORDS (EmployeeID, TrainingID, CompletionDate, ExpirationDate)
            OUTPUT INSERTED.ID
            VALUES (@empId, @trainId, @compDate, @expDate)
        `);

        return NextResponse.json({ success: true, recordId: insertResult.recordset[0].ID });

    } catch (err) {
        console.error("[POST /api/trainings-v2/records]", err);
        return NextResponse.json({ success: false, message: "Chyba při ukládání záznamu školení." }, { status: 500 });
    }
}
