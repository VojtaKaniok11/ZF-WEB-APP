import { NextRequest, NextResponse } from "next/server";
import { getPool, sql } from "@/lib/db";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get("search") ?? "";
        const dept = searchParams.get("dept") ?? "";
        const status = searchParams.get("status") ?? "";
        const wp = searchParams.get("wp") ?? "";

        const db = await getPool();  // HR database
        const req = db.request();

        let where = "WHERE 1=1";

        if (search) {
            req.input("search", sql.NVarChar, `%${search}%`);
            where += ` AND (
                e.FirstName  LIKE @search OR
                e.LastName   LIKE @search OR
                e.PersonalNumber LIKE @search OR
                u.User_Name  LIKE @search
            )`;
        }
        if (dept) {
            req.input("dept", sql.NVarChar, dept);
            where += " AND e.Department = @dept";
        }
        if (status === "active") {
            where += " AND e.IsActive = 1";
        } else if (status === "inactive") {
            where += " AND e.IsActive = 0";
        }
        if (wp === "yes") {
            where += " AND e.HasWashingProgram = 1";
        } else if (wp === "no") {
            where += " AND e.HasWashingProgram = 0";
        }

        // Cross-database JOIN: HR.dbo.EMPLOYEES ← USER_MANAGEMENT.dbo.USERS
        // Propojení přes BIS_Osoba_ID, aby jsme měli login, email a číslo karty
        const result = await req.query(`
            SELECT
                e.ID                                        AS id,
                ISNULL(e.PersonalNumber, '')               AS personalNumber,
                ISNULL(e.FirstName, '')                    AS firstName,
                ISNULL(e.LastName, '')                     AS lastName,
                ISNULL(e.Department, '')                   AS department,
                ISNULL(e.CostCenter, '')                   AS costCenter,
                ISNULL(e.Workcenter, '')                   AS workcenter,
                e.HiringDate                               AS hiringDate,
                ISNULL(e.IsActive, 0)                      AS isActive,
                ISNULL(e.HasWashingProgram, 0)             AS hasWashingProgram,
                e.Photo                                    AS photo,
                -- Obohacení z USER_MANAGEMENT (identity zdroj)
                ISNULL(u.User_Name, '')                    AS userName,
                ISNULL(u.EMail, '')                        AS email,
                ISNULL(u.BIS_Cislo_Karty, '')              AS cardNumber,
                ISNULL(u.BIS_Aktivni, 0)                   AS bisActive
            FROM dbo.EMPLOYEES e
            OUTER APPLY (
                SELECT TOP 1
                    User_Name,
                    EMail,
                    BIS_Cislo_Karty,
                    BIS_Aktivni
                FROM USER_MANAGEMENT.dbo.USERS u
                WHERE u.BIS_Osoba_ID = e.BIS_Osoba_ID
                ORDER BY u.ID
            ) u
            ${where}
            ORDER BY e.LastName, e.FirstName
        `);

        return NextResponse.json({ success: true, data: result.recordset });
    } catch (err) {
        console.error("[GET /api/employees]", err);
        return NextResponse.json({ success: false, message: "Chyba při načítání zaměstnanců." }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        if (!body.personalNumber?.trim())
            return NextResponse.json({ success: false, message: "Osobní číslo je povinné." }, { status: 400 });
        if (!body.firstName?.trim())
            return NextResponse.json({ success: false, message: "Jméno je povinné." }, { status: 400 });
        if (!body.lastName?.trim())
            return NextResponse.json({ success: false, message: "Příjmení je povinné." }, { status: 400 });
        if (!body.department?.trim())
            return NextResponse.json({ success: false, message: "Oddělení je povinné." }, { status: 400 });

        const db = await getPool();
        const req = db.request();
        req.input("pn", sql.VarChar(10), body.personalNumber.trim());
        req.input("firstName", sql.NVarChar(50), body.firstName.trim());
        req.input("lastName", sql.NVarChar(70), body.lastName.trim());
        req.input("dept", sql.NVarChar(100), body.department.trim());
        req.input("cc", sql.VarChar(10), body.costCenter || null);
        req.input("wc", sql.NVarChar(50), body.workcenter || null);
        req.input("hiring", sql.Date, body.hiringDate ? new Date(body.hiringDate) : null);
        req.input("active", sql.Bit, body.isActive ?? true);

        req.input("phone", sql.VarChar(20), body.phone || null);
        req.input("email", sql.NVarChar(100), body.email || null);
        req.input("position", sql.NVarChar(100), body.position || null);
        req.input("level", sql.NVarChar(50), body.level || null);
        req.input("managerName", sql.NVarChar(150), body.managerName || null);
        req.input("bisOsoba", sql.Int, body.bisOsobaId ? parseInt(body.bisOsobaId) : null);

        const result = await req.query(`
            INSERT INTO dbo.EMPLOYEES
                (PersonalNumber, FirstName, LastName, Department, CostCenter, Workcenter, HiringDate, IsActive, CreatedAt, UpdatedAt, Phone, Email, Position, [Level], ManagerName, BIS_Osoba_ID)
            OUTPUT INSERTED.ID AS id, INSERTED.PersonalNumber AS personalNumber,
                   INSERTED.FirstName AS firstName, INSERTED.LastName AS lastName,
                   INSERTED.Department AS department, INSERTED.IsActive AS isActive
            VALUES (@pn, @firstName, @lastName, @dept, @cc, @wc, @hiring, @active, SYSDATETIME(), SYSDATETIME(), @phone, @email, @position, @level, @managerName, @bisOsoba)
        `);

        return NextResponse.json({ success: true, data: result.recordset[0] });
    } catch (err) {
        console.error("[POST /api/employees]", err);
        return NextResponse.json({ success: false, message: "Chyba při ukládání zaměstnance." }, { status: 500 });
    }
}
