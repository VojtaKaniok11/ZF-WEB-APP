import { Training, TrainingSession, EmployeeTrainingRecord } from "@/types/training";

// =============================================================================
// dbo.TRAININGS — Katalog školení (mock data)
// =============================================================================

export const TRAININGS: Training[] = [
    {
        id: "TRN-001",
        name: "BOZP – Vstupní školení",
        description: "Základní školení bezpečnosti a ochrany zdraví při práci pro nové zaměstnance",
        validityMonths: 24,
        category: "BOZP",
        isMandatory: true,
    },
    {
        id: "TRN-002",
        name: "BOZP – Periodické školení",
        description: "Pravidelné opakování školení BOZP pro všechny zaměstnance",
        validityMonths: 12,
        category: "BOZP",
        isMandatory: true,
    },
    {
        id: "TRN-003",
        name: "Požární ochrana",
        description: "Školení požární ochrany, evakuační plány, použití hasicích přístrojů",
        validityMonths: 12,
        category: "PO",
        isMandatory: true,
    },
    {
        id: "TRN-004",
        name: "Svařování – Základní kurz",
        description: "Odborné školení pro svářeče dle ČSN EN ISO 9606-1",
        validityMonths: 24,
        category: "Odborné",
        isMandatory: false,
    },
    {
        id: "TRN-005",
        name: "Obsluha VZV",
        description: "Školení pro obsluhu vysokozdvižných vozíků",
        validityMonths: 12,
        category: "Odborné",
        isMandatory: false,
    },
    {
        id: "TRN-006",
        name: "Práce ve výškách",
        description: "Bezpečnost při práci ve výškách a nad volnou hloubkou",
        validityMonths: 12,
        category: "BOZP",
        isMandatory: false,
    },
    {
        id: "TRN-007",
        name: "První pomoc",
        description: "Školení první pomoci pro určené zaměstnance",
        validityMonths: 24,
        category: "BOZP",
        isMandatory: true,
    },
    {
        id: "TRN-008",
        name: "GDPR a ochrana dat",
        description: "Školení o ochraně osobních údajů dle GDPR",
        validityMonths: 12,
        category: "Legislativní",
        isMandatory: true,
    },
];

// =============================================================================
// dbo.TRAINING_SESSIONS — Propojovací tabulka (mock data)
// =============================================================================
// attendeePersonalNumbers = pole FK odkazů na Employee.personalNumber
// =============================================================================

export const TRAINING_SESSIONS: TrainingSession[] = [
    {
        id: "TSESS-001",
        trainingId: "TRN-001",
        sessionDate: "2024-01-15",
        trainerName: "Ing. Karel Novotný",
        location: "Školící místnost A",
        attendeePersonalNumbers: ["CZ001", "CZ002", "CZ003", "CZ004", "CZ005", "CZ006"],
        notes: "Vstupní školení nových zaměstnanců, leden 2024",
    },
    {
        id: "TSESS-002",
        trainingId: "TRN-002",
        sessionDate: "2024-03-10",
        trainerName: "Ing. Karel Novotný",
        location: "Školící místnost A",
        attendeePersonalNumbers: ["CZ001", "CZ002", "CZ003", "CZ004", "CZ005", "CZ006", "CZ007", "CZ008", "CZ009", "CZ010"],
        notes: "Periodické BOZP – Q1 2024",
    },
    {
        id: "TSESS-003",
        trainingId: "TRN-003",
        sessionDate: "2024-03-12",
        trainerName: "Bc. Tomáš Havelka",
        location: "Školící místnost B",
        attendeePersonalNumbers: ["CZ001", "CZ002", "CZ003", "CZ004", "CZ005", "CZ006", "CZ007", "CZ008", "CZ009", "CZ010", "CZ011", "CZ012"],
        notes: "PO školení + praktická ukázka hasicích přístrojů",
    },
    {
        id: "TSESS-004",
        trainingId: "TRN-004",
        sessionDate: "2024-02-20",
        trainerName: "Ing. Vladimír Černý",
        location: "Svařovna – učebna",
        attendeePersonalNumbers: ["CZ005", "CZ017"],
        notes: "Svařovací kurz pro nové svářeče",
    },
    {
        id: "TSESS-005",
        trainingId: "TRN-005",
        sessionDate: "2024-04-05",
        trainerName: "Jan Procházka ml.",
        location: "Sklad – venkovní plocha",
        attendeePersonalNumbers: ["CZ006", "CZ007", "CZ008", "CZ018"],
        notes: "Školení VZV – retraky a čelní vozíky",
    },
    {
        id: "TSESS-006",
        trainingId: "TRN-006",
        sessionDate: "2024-05-14",
        trainerName: "Bc. Tomáš Havelka",
        location: "Výrobní hala – výšková sekce",
        attendeePersonalNumbers: ["CZ009", "CZ019"],
        notes: "Práce ve výškách – údržba",
    },
    {
        id: "TSESS-007",
        trainingId: "TRN-007",
        sessionDate: "2024-06-01",
        trainerName: "MUDr. Dagmar Šimková",
        location: "Školící místnost A",
        attendeePersonalNumbers: ["CZ003", "CZ004", "CZ006", "CZ009", "CZ014", "CZ015"],
        notes: "Školení první pomoci – vybraní zaměstnanci",
    },
    {
        id: "TSESS-008",
        trainingId: "TRN-008",
        sessionDate: "2024-02-28",
        trainerName: "JUDr. Marie Dvořáčková",
        location: "Školící místnost A",
        attendeePersonalNumbers: ["CZ001", "CZ002", "CZ006", "CZ010", "CZ013", "CZ015"],
        notes: "GDPR školení pro vedoucí a IT",
    },
    {
        id: "TSESS-009",
        trainingId: "TRN-002",
        sessionDate: "2025-03-15",
        trainerName: "Ing. Karel Novotný",
        location: "Školící místnost A",
        attendeePersonalNumbers: ["CZ011", "CZ013", "CZ014", "CZ015", "CZ016", "CZ018", "CZ019", "CZ020"],
        notes: "Periodické BOZP – Q1 2025 (skupina B)",
    },
    {
        id: "TSESS-010",
        trainingId: "TRN-003",
        sessionDate: "2025-03-18",
        trainerName: "Bc. Tomáš Havelka",
        location: "Školící místnost B",
        attendeePersonalNumbers: ["CZ013", "CZ014", "CZ015", "CZ016", "CZ018", "CZ019", "CZ020"],
        notes: "PO školení – Q1 2025",
    },
    {
        id: "TSESS-011",
        trainingId: "TRN-001",
        sessionDate: "2025-01-10",
        trainerName: "Ing. Karel Novotný",
        location: "Školící místnost A",
        attendeePersonalNumbers: ["CZ011", "CZ016", "CZ019", "CZ020"],
        notes: "Vstupní BOZP pro přeřazené zaměstnance",
    },
    {
        id: "TSESS-012",
        trainingId: "TRN-005",
        sessionDate: "2025-04-10",
        trainerName: "Jan Procházka ml.",
        location: "Sklad – venkovní plocha",
        attendeePersonalNumbers: ["CZ006", "CZ007", "CZ018"],
        notes: "Opakovací školení VZV 2025",
    },
];

// =============================================================================
// Query helpers (simulate DB queries with JOINs)
// =============================================================================

function computeStatus(completedDate: string, validityMonths: number): {
    expirationDate: string | null;
    status: "valid" | "expiring_soon" | "expired";
} {
    if (validityMonths === 0) {
        return { expirationDate: null, status: "valid" };
    }
    const completed = new Date(completedDate);
    const expiration = new Date(completed);
    expiration.setMonth(expiration.getMonth() + validityMonths);
    const expirationDate = expiration.toISOString().split("T")[0];

    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    let status: "valid" | "expiring_soon" | "expired";
    if (expiration < now) {
        status = "expired";
    } else if (expiration <= thirtyDaysFromNow) {
        status = "expiring_soon";
    } else {
        status = "valid";
    }

    return { expirationDate, status };
}

/**
 * Získá všechny záznamy školení pro jednoho zaměstnance
 * (simuluje SQL JOIN: TRAINING_SESSIONS × TRAININGS WHERE personalNumber IN attendees)
 */
export function getTrainingRecordsForEmployee(personalNumber: string): EmployeeTrainingRecord[] {
    const records: EmployeeTrainingRecord[] = [];

    for (const session of TRAINING_SESSIONS) {
        if (!session.attendeePersonalNumbers.includes(personalNumber)) continue;

        const training = TRAININGS.find((t) => t.id === session.trainingId);
        if (!training) continue;

        const { expirationDate, status } = computeStatus(session.sessionDate, training.validityMonths);

        records.push({
            trainingId: training.id,
            trainingName: training.name,
            category: training.category,
            completedDate: session.sessionDate,
            expirationDate,
            trainerName: session.trainerName,
            status,
        });
    }

    // Seřadíme: nejnovější session nahoře
    records.sort((a, b) => b.completedDate.localeCompare(a.completedDate));
    return records;
}

/**
 * Získá všechna školení (katalog)
 */
export function getTrainings(): Training[] {
    return TRAININGS;
}

/**
 * Vrátí seznam osobních čísel, kteří mají alespoň jedno školení
 */
export function getPersonalNumbersWithTrainings(): string[] {
    const setPN = new Set<string>();
    for (const session of TRAINING_SESSIONS) {
        for (const pn of session.attendeePersonalNumbers) {
            setPN.add(pn);
        }
    }
    return Array.from(setPN);
}
