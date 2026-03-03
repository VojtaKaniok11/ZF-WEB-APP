import { NextRequest, NextResponse } from "next/server";
import { getPool, sql } from "@/lib/db";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        if (!body.trainingName?.trim())
            return NextResponse.json({ success: false, error: "Chybí název školení." }, { status: 400 });
        if (!body.completedDate)
            return NextResponse.json({ success: false, error: "Chybí datum absolvování." }, { status: 400 });
        if (!body.expirationDate)
            return NextResponse.json({ success: false, error: "Chybí datum expirace." }, { status: 400 });
        if (!body.attendeePersonalNumbers?.length)
            return NextResponse.json({ success: false, error: "Chybí seznam zaměstnanců." }, { status: 400 });

        const db = await getPool();

        // 1. Najdi nebo vytvoř školení v katalogu TRAININGS
        const trnReq = db.request();
        trnReq.input("name", sql.NVarChar(100), body.trainingName.trim());
        trnReq.input("category", sql.NVarChar(50), body.category ?? "Ostatní");

        let trnResult = await trnReq.query(`
            SELECT ID FROM dbo.TRAININGS WHERE Name = @name AND IsActive = 1
        `);

        let trainingId: number;
        if (trnResult.recordset.length > 0) {
            trainingId = trnResult.recordset[0].ID;
        } else {
            // Vytvoř nové školení — periodicita se odvodí z rozdílu completedDate a expirationDate
            const completed = new Date(body.completedDate);
            const expiration = new Date(body.expirationDate);
            const diffMonths = Math.round(
                (expiration.getFullYear() - completed.getFullYear()) * 12 +
                (expiration.getMonth() - completed.getMonth())
            );

            const insReq = db.request();
            insReq.input("name", sql.NVarChar(100), body.trainingName.trim());
            insReq.input("periodicity", sql.Int, diffMonths > 0 ? diffMonths : 0);
            const insResult = await insReq.query(`
                INSERT INTO dbo.TRAININGS (Name, PeriodicityMonths, IsActive, CreatedAt)
                OUTPUT INSERTED.ID
                VALUES (@name, @periodicity, 1, SYSDATETIME())
            `);
            trainingId = insResult.recordset[0].ID;
        }

        // 2. Vytvoř TRAINING_SESSION
        const sessReq = db.request();
        sessReq.input("trainingId", sql.Int, trainingId);
        sessReq.input("scheduled", sql.Date, new Date(body.completedDate));
        sessReq.input("completed", sql.Date, new Date(body.completedDate));
        sessReq.input("trainer", sql.NVarChar(100), body.trainerName?.trim() || null);
        sessReq.input("notes", sql.NVarChar(500), body.notes?.trim() || null);

        const sessResult = await sessReq.query(`
            INSERT INTO dbo.TRAINING_SESSIONS (TrainingID, ScheduledDate, CompletedDate, Trainer, Notes, CreatedAt)
            OUTPUT INSERTED.ID
            VALUES (@trainingId, @scheduled, @completed, @trainer, @notes, SYSDATETIME())
        `);
        const sessionId: number = sessResult.recordset[0].ID;

        // 3. Pro každé osobní číslo najdi EmployeeID a přidej do TRAINING_PARTICIPANTS
        const pns: string[] = body.attendeePersonalNumbers;
        for (const pn of pns) {
            const empReq = db.request();
            empReq.input("pn", sql.VarChar(10), pn);
            const empResult = await empReq.query(`SELECT ID FROM dbo.EMPLOYEES WHERE PersonalNumber = @pn`);
            if (!empResult.recordset.length) continue;

            const employeeId = empResult.recordset[0].ID;
            const partReq = db.request();
            partReq.input("sessionId", sql.Int, sessionId);
            partReq.input("employeeId", sql.Int, employeeId);
            await partReq.query(`
                INSERT INTO dbo.TRAINING_PARTICIPANTS (SessionID, EmployeeID, Attended, CreatedAt)
                VALUES (@sessionId, @employeeId, 1, SYSDATETIME())
            `);
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("[POST /api/trainings]", err);
        return NextResponse.json({ success: false, error: "Neplatný požadavek." }, { status: 500 });
    }
}
