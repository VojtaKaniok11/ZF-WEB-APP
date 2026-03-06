import { NextRequest, NextResponse } from "next/server";
import { getPool, sql } from "@/lib/db";

/** Generuje unikátní nvarchar ID ve stylu existujících záznamů, např. "TRN-20260304-abc12" */
function genId(prefix: string): string {
    const now = new Date();
    const datePart = now.toISOString().slice(0, 10).replace(/-/g, "");
    const rand = Math.random().toString(36).slice(2, 7);
    return `${prefix}-${datePart}-${rand}`;
}

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

        // ── 1. Najdi nebo vytvoř školení v katalogu TRAININGS ──────────────
        // Sloupce: ID (nvarchar), Name, Description, ValidityMonths, Category, IsMandatory
        const findReq = db.request();
        findReq.input("name", sql.NVarChar(100), body.trainingName.trim());
        const existing = await findReq.query(`SELECT ID FROM dbo.TRAININGS WHERE Name = @name`);

        let trainingId: string;
        if (existing.recordset.length > 0) {
            trainingId = existing.recordset[0].ID;
        } else {
            // Odvoď ValidityMonths z rozdílu dat
            const completed = new Date(body.completedDate);
            const expiration = new Date(body.expirationDate);
            const validityMonths = Math.max(0, Math.round(
                (expiration.getFullYear() - completed.getFullYear()) * 12 +
                (expiration.getMonth() - completed.getMonth())
            ));

            trainingId = genId("TRN");
            const insReq = db.request();
            insReq.input("id", sql.NVarChar(50), trainingId);
            insReq.input("name", sql.NVarChar(100), body.trainingName.trim());
            insReq.input("category", sql.NVarChar(50), body.category ?? "Ostatní");
            insReq.input("validity", sql.Int, validityMonths);
            insReq.input("mandatory", sql.Bit, 0);
            await insReq.query(`
                INSERT INTO dbo.TRAININGS (ID, Name, Category, ValidityMonths, IsMandatory)
                VALUES (@id, @name, @category, @validity, @mandatory)
            `);
        }

        // ── 2. Vytvoř TRAINING_SESSION ────────────────────────────────────
        // Sloupce: ID (nvarchar), TrainingID (nvarchar), SessionDate, TrainerName, Location, Notes
        const sessionId = genId("SES");
        const sessReq = db.request();
        sessReq.input("id", sql.NVarChar(50), sessionId);
        sessReq.input("trainingId", sql.NVarChar(50), trainingId);
        sessReq.input("sessionDate", sql.Date, new Date(body.completedDate));
        sessReq.input("trainer", sql.NVarChar(100), body.trainerName?.trim() || null);
        sessReq.input("notes", sql.NVarChar(500), body.notes?.trim() || null);
        await sessReq.query(`
            INSERT INTO dbo.TRAINING_SESSIONS (ID, TrainingID, SessionDate, TrainerName, Notes)
            VALUES (@id, @trainingId, @sessionDate, @trainer, @notes)
        `);

        // ── 3. Přidej každého účastníka do TRAINING_ATTENDEES ────────────
        // Sloupce: SessionID (nvarchar), PersonalNumber (nvarchar), Status, ExpirationDateOverride
        const pns: string[] = body.attendeePersonalNumbers;
        for (const pn of pns) {
            const partReq = db.request();
            partReq.input("sessionId", sql.NVarChar(50), sessionId);
            partReq.input("pn", sql.NVarChar(50), pn);
            partReq.input("status", sql.NVarChar(50), "Absolvoval");
            partReq.input("expDate", sql.Date, body.expirationDate ? new Date(body.expirationDate) : null);
            await partReq.query(`
                INSERT INTO dbo.TRAINING_ATTENDEES (SessionID, PersonalNumber, Status, ExpirationDateOverride)
                VALUES (@sessionId, @pn, @status, @expDate)
            `);
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("[POST /api/trainings]", err);
        return NextResponse.json({ success: false, error: err.message ?? "Chyba serveru." }, { status: 500 });
    }
}
