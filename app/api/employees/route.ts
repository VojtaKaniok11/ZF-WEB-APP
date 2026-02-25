import { NextRequest, NextResponse } from "next/server";
import { getEmployees, addEmployee } from "@/lib/mock-data";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") ?? undefined;
    const dept = searchParams.get("dept") ?? undefined;
    const status = searchParams.get("status") ?? undefined;

    const employees = getEmployees(search, dept, status);

    return NextResponse.json({ success: true, data: employees });
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        if (!body.personalNumber?.trim()) {
            return NextResponse.json(
                { success: false, message: "Osobní číslo je povinné." },
                { status: 400 }
            );
        }
        if (!body.firstName?.trim()) {
            return NextResponse.json(
                { success: false, message: "Jméno je povinné." },
                { status: 400 }
            );
        }
        if (!body.lastName?.trim()) {
            return NextResponse.json(
                { success: false, message: "Příjmení je povinné." },
                { status: 400 }
            );
        }
        if (!body.department?.trim()) {
            return NextResponse.json(
                { success: false, message: "Oddělení je povinné." },
                { status: 400 }
            );
        }

        const newEmployee = addEmployee({
            personalNumber: body.personalNumber.trim(),
            firstName: body.firstName.trim(),
            lastName: body.lastName.trim(),
            department: body.department.trim(),
            costCenter: body.costCenter || null,
            hiringDate: body.hiringDate || null,
            isActive: body.isActive ?? true,
        });

        return NextResponse.json({ success: true, data: newEmployee });
    } catch {
        return NextResponse.json(
            { success: false, message: "Chyba při zpracování požadavku." },
            { status: 500 }
        );
    }
}
