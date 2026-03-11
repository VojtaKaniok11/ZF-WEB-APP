import { NextRequest, NextResponse } from "next/server";
import { getPool, sql } from "@/lib/db";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const employeeIds = Array.isArray(body.employeeIds) 
            ? body.employeeIds.map((id: any) => parseInt(id, 10)) 
            : [parseInt(body.employeeId, 10)];
        
        const trainingId = parseInt(body.trainingId, 10);
        const completionDateStr = body.completionDate;
        const isLegalOrExternal = body.isLegalOrExternal ? 1 : 0;

        if (employeeIds.length === 0 || employeeIds.some(isNaN) || isNaN(trainingId) || !completionDateStr) {
            return NextResponse.json({ success: false, message: "Chybí povinné údaje." }, { status: 400 });
        }

        const db = await getPool();
        const req = db.request();

        const completionDate = new Date(completionDateStr);
        if (isNaN(completionDate.getTime())) {
            return NextResponse.json({ success: false, message: "Neplatné datum." }, { status: 400 });
        }

        req.input("trainId", sql.Int, trainingId);

        // 1. Zjistit periodicitu školení
        const tResult = await req.query(`SELECT PeriodicityMonths FROM dbo.TRAININGS_CATALOG WHERE ID = @trainId`);
        if (tResult.recordset.length === 0) {
            return NextResponse.json({ success: false, message: "Školení neexistuje." }, { status: 404 });
        }
        const periodicity = tResult.recordset[0].PeriodicityMonths;

        // 2. Vypočítat expiraci
        const expirationDate = new Date(completionDate);
        expirationDate.setMonth(expirationDate.getMonth() + periodicity);

        let insertedIds: number[] = [];

        for (const empId of employeeIds) {
            const insertReq = db.request();
            insertReq.input("empId", sql.Int, empId);
            insertReq.input("trainId", sql.Int, trainingId);
            insertReq.input("compDate", sql.Date, completionDate);
            insertReq.input("expDate", sql.Date, expirationDate);
            insertReq.input("isLegalOrExt", sql.Bit, isLegalOrExternal);

            const insertResult = await insertReq.query(`
                INSERT INTO dbo.TRAINING_RECORDS (EmployeeID, TrainingID, CompletionDate, ExpirationDate, IsLegalOrExternal)
                OUTPUT INSERTED.ID
                VALUES (@empId, @trainId, @compDate, @expDate, @isLegalOrExt)
            `);
            insertedIds.push(insertResult.recordset[0].ID);
        }

        return NextResponse.json({ success: true, recordIds: insertedIds });

    } catch (err) {
        console.error("[POST /api/trainings-v2/records]", err);
        return NextResponse.json({ success: false, message: "Chyba při ukládání záznamu školení." }, { status: 500 });
    }
}
