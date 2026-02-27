import { NextRequest, NextResponse } from "next/server";
import { addTrainingSession, NewTrainingSessionInput } from "@/lib/mock-trainings";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as NewTrainingSessionInput;

        if (!body.trainingName?.trim()) {
            return NextResponse.json({ success: false, error: "Chybí název školení." }, { status: 400 });
        }
        if (!body.completedDate) {
            return NextResponse.json({ success: false, error: "Chybí datum absolvování." }, { status: 400 });
        }
        if (!body.attendeePersonalNumbers?.length) {
            return NextResponse.json({ success: false, error: "Chybí seznam zaměstnanců." }, { status: 400 });
        }

        addTrainingSession(body);
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ success: false, error: "Neplatný požadavek." }, { status: 400 });
    }
}
