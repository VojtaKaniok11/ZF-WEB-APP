import { NextRequest, NextResponse } from "next/server";
import { getPool, sql } from "@/lib/db";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ personalNumber: string }> }
) {
    try {
        const { personalNumber } = await params;
        const pn = decodeURIComponent(personalNumber);

        const db = await getPool();
        const req = db.request();
        req.input("pn", sql.VarChar(10), pn);

        const result = await req.query(`
            SELECT
                e.PersonalNumber    AS personalNumber,
                e.FirstName         AS firstName,
                e.LastName          AS lastName,
                ISNULL(e.Department, '') AS department,
                ISNULL(e.CostCenter, '') AS costCenter,
                ISNULL(w.Description, '') AS workcenterName,
                ISNULL(w.WCName, '')       AS wcName,
                ISNULL(e.Workcenter, '') AS workcenter,
                e.IsActive          AS isActive,
                CONVERT(varchar(10), e.HiringDate, 23) AS hiringDate,
                ISNULL(e.Phone, '') AS phone,
                ISNULL(e.Email, '') AS email,
                ISNULL(e.Position, '') AS position,
                ISNULL(e.Level, '') AS level,
                -- Pokud je ManagerID nastaven, bereme jméno z tabulky. Jinak zobrazíme uloženou textovou hodnotu.
                ISNULL(
                    NULLIF(ISNULL(mgr.FirstName + ' ' + mgr.LastName, ''), ''),
                    ISNULL(e.ManagerName, '—')
                ) AS managerName,
                ISNULL(u.User_Name, '') AS userName
            FROM dbo.EMPLOYEES e
            LEFT JOIN dbo.WORKCENTERS w ON w.ID = e.Workcenter
            LEFT JOIN dbo.EMPLOYEES mgr ON mgr.ID = e.ManagerID
            OUTER APPLY (
                SELECT TOP 1 User_Name
                FROM USER_MANAGEMENT.dbo.USERS u
                WHERE u.BIS_Osoba_ID = e.BIS_Osoba_ID
                ORDER BY u.ID
            ) u
            WHERE e.PersonalNumber = @pn
        `);

        if (!result.recordset.length) {
            return NextResponse.json({ success: false, message: "Zaměstnanec nenalezen." }, { status: 404 });
        }

        const row = result.recordset[0];

        // Mapujeme na EmployeeDetail interface
        const detail = {
            personalNumber: row.personalNumber,
            firstName: row.firstName,
            lastName: row.lastName,
            department: row.department,
            position: row.position,
            level: row.level,
            isActive: row.isActive,
            costCenter: row.costCenter,
            hiringDate: row.hiringDate,
            workcenter: row.workcenter,
            // Doplněno z databáze
            userName: row.userName,
            email: row.email,
            phone: row.phone,
            mobile: row.mobile,
            managerName: row.managerName,
            positionHistory: [],
        };

        return NextResponse.json({ success: true, data: detail });
    } catch (err) {
        console.error("[GET /api/employees/[pn]]", err);
        return NextResponse.json({ success: false, message: "Chyba při načítání zaměstnance." }, { status: 500 });
    }
}
