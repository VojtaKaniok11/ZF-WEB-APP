import { MedicalExamType, MedicalExamRecord, EmployeeMedicalRecord } from "@/types/medical";

// =============================================================================
// dbo.MEDICAL_EXAM_TYPES — Katalog typů lékařských prohlídek (mock data)
// =============================================================================

export const MEDICAL_EXAM_TYPES: MedicalExamType[] = [
    {
        id: "MED-001",
        name: "Vstupní prohlídka",
        description: "Vstupní lékařská prohlídka při nástupu do zaměstnání",
        validityMonths: 0, // jednorázová
        category: "Vstupní",
    },
    {
        id: "MED-002",
        name: "Periodická prohlídka – obecná",
        description: "Pravidelná periodická prohlídka dle kategorie práce",
        validityMonths: 24,
        category: "Periodická",
    },
    {
        id: "MED-003",
        name: "Periodická prohlídka – riziková pracoviště",
        description: "Zkrácená perioda pro zaměstnance na rizikových pracovištích (sváření, lakovna)",
        validityMonths: 12,
        category: "Periodická",
    },
    {
        id: "MED-004",
        name: "Řidičský průkaz – referentské zkoušky",
        description: "Prohlídka pro řidiče referentských vozidel",
        validityMonths: 24,
        category: "Řidičský průkaz",
    },
    {
        id: "MED-005",
        name: "Noční práce",
        description: "Prohlídka způsobilosti pro práci v nočních směnách",
        validityMonths: 12,
        category: "Periodická",
    },
    {
        id: "MED-006",
        name: "Výstupní prohlídka",
        description: "Lékařská prohlídka při ukončení pracovního poměru",
        validityMonths: 0, // jednorázová
        category: "Výstupní",
    },
];

// =============================================================================
// dbo.MEDICAL_EXAMS — Záznamy prohlídek (mock data)
// =============================================================================
// employeePersonalNumber = FK → Employee.personalNumber
// examTypeId = FK → MedicalExamType.id
// =============================================================================

export const MEDICAL_EXAM_RECORDS: MedicalExamRecord[] = [
    // ---- CZ001 – Jan Novák ----
    { id: "MEXR-001", examTypeId: "MED-001", employeePersonalNumber: "CZ001", examDate: "2020-01-05", nextExamDate: null, doctorName: "MUDr. Dagmar Šimková", result: "Způsobilý", notes: "", status: "valid" },
    { id: "MEXR-002", examTypeId: "MED-002", employeePersonalNumber: "CZ001", examDate: "2024-06-10", nextExamDate: "2026-06-10", doctorName: "MUDr. Dagmar Šimková", result: "Způsobilý", notes: "", status: "valid" },
    { id: "MEXR-003", examTypeId: "MED-004", employeePersonalNumber: "CZ001", examDate: "2024-06-10", nextExamDate: "2026-06-10", doctorName: "MUDr. Dagmar Šimková", result: "Způsobilý", notes: "", status: "valid" },

    // ---- CZ002 – Petra Svobodová ----
    { id: "MEXR-004", examTypeId: "MED-001", employeePersonalNumber: "CZ002", examDate: "2020-02-10", nextExamDate: null, doctorName: "MUDr. Dagmar Šimková", result: "Způsobilý", notes: "", status: "valid" },
    { id: "MEXR-005", examTypeId: "MED-002", employeePersonalNumber: "CZ002", examDate: "2024-07-15", nextExamDate: "2026-07-15", doctorName: "MUDr. Dagmar Šimková", result: "Způsobilý", notes: "", status: "valid" },

    // ---- CZ003 – Martin Dvořák ----
    { id: "MEXR-006", examTypeId: "MED-001", employeePersonalNumber: "CZ003", examDate: "2020-03-01", nextExamDate: null, doctorName: "MUDr. Jan Kříž", result: "Způsobilý", notes: "", status: "valid" },
    { id: "MEXR-007", examTypeId: "MED-002", employeePersonalNumber: "CZ003", examDate: "2024-04-20", nextExamDate: "2026-04-20", doctorName: "MUDr. Jan Kříž", result: "Způsobilý", notes: "Doporučeno nosit brýle při práci", status: "valid" },
    { id: "MEXR-008", examTypeId: "MED-005", employeePersonalNumber: "CZ003", examDate: "2025-01-15", nextExamDate: "2026-01-15", doctorName: "MUDr. Jan Kříž", result: "Způsobilý", notes: "", status: "valid" },

    // ---- CZ004 – Eva Černá ----
    { id: "MEXR-009", examTypeId: "MED-001", employeePersonalNumber: "CZ004", examDate: "2020-04-12", nextExamDate: null, doctorName: "MUDr. Dagmar Šimková", result: "Způsobilý", notes: "", status: "valid" },
    { id: "MEXR-010", examTypeId: "MED-002", employeePersonalNumber: "CZ004", examDate: "2024-05-25", nextExamDate: "2026-05-25", doctorName: "MUDr. Dagmar Šimková", result: "Způsobilý", notes: "", status: "valid" },

    // ---- CZ005 – Tomáš Procházka (svářeč → riziková prohlídka) ----
    { id: "MEXR-011", examTypeId: "MED-001", employeePersonalNumber: "CZ005", examDate: "2020-05-18", nextExamDate: null, doctorName: "MUDr. Jan Kříž", result: "Způsobilý", notes: "", status: "valid" },
    { id: "MEXR-012", examTypeId: "MED-003", employeePersonalNumber: "CZ005", examDate: "2025-01-20", nextExamDate: "2026-01-20", doctorName: "MUDr. Jan Kříž", result: "Způsobilý", notes: "Audiometrie OK, spirometrie OK", status: "valid" },

    // ---- CZ006 – Lucie Veselá ----
    { id: "MEXR-013", examTypeId: "MED-001", employeePersonalNumber: "CZ006", examDate: "2020-06-22", nextExamDate: null, doctorName: "MUDr. Dagmar Šimková", result: "Způsobilý", notes: "", status: "valid" },
    { id: "MEXR-014", examTypeId: "MED-002", employeePersonalNumber: "CZ006", examDate: "2024-02-10", nextExamDate: "2026-02-10", doctorName: "MUDr. Dagmar Šimková", result: "Způsobilý", notes: "", status: "expiring_soon" },
    { id: "MEXR-015", examTypeId: "MED-004", employeePersonalNumber: "CZ006", examDate: "2024-02-10", nextExamDate: "2026-02-10", doctorName: "MUDr. Dagmar Šimková", result: "Způsobilý", notes: "", status: "expiring_soon" },

    // ---- CZ007 – Jiří Kučera (neaktivní) ----
    { id: "MEXR-016", examTypeId: "MED-001", employeePersonalNumber: "CZ007", examDate: "2021-01-10", nextExamDate: null, doctorName: "MUDr. Jan Kříž", result: "Způsobilý", notes: "", status: "valid" },
    { id: "MEXR-017", examTypeId: "MED-002", employeePersonalNumber: "CZ007", examDate: "2023-08-05", nextExamDate: "2025-08-05", doctorName: "MUDr. Jan Kříž", result: "Způsobilý", notes: "", status: "expired" },

    // ---- CZ009 – Pavel Marek ----
    { id: "MEXR-018", examTypeId: "MED-001", employeePersonalNumber: "CZ009", examDate: "2020-09-14", nextExamDate: null, doctorName: "MUDr. Dagmar Šimková", result: "Způsobilý", notes: "", status: "valid" },
    { id: "MEXR-019", examTypeId: "MED-002", employeePersonalNumber: "CZ009", examDate: "2024-09-20", nextExamDate: "2026-09-20", doctorName: "MUDr. Dagmar Šimková", result: "Způsobilý s omezením", notes: "Omezení: nesmí zvedat břemena nad 15 kg", status: "valid" },

    // ---- CZ010 – Kateřina Pokorná ----
    { id: "MEXR-020", examTypeId: "MED-001", employeePersonalNumber: "CZ010", examDate: "2020-10-01", nextExamDate: null, doctorName: "MUDr. Dagmar Šimková", result: "Způsobilý", notes: "", status: "valid" },
    { id: "MEXR-021", examTypeId: "MED-002", employeePersonalNumber: "CZ010", examDate: "2024-10-15", nextExamDate: "2026-10-15", doctorName: "MUDr. Dagmar Šimková", result: "Způsobilý", notes: "", status: "valid" },

    // ---- CZ011 – Ondřej Fiala ----
    { id: "MEXR-022", examTypeId: "MED-001", employeePersonalNumber: "CZ011", examDate: "2021-03-05", nextExamDate: null, doctorName: "MUDr. Jan Kříž", result: "Způsobilý", notes: "", status: "valid" },
    { id: "MEXR-023", examTypeId: "MED-002", employeePersonalNumber: "CZ011", examDate: "2024-03-15", nextExamDate: "2026-03-15", doctorName: "MUDr. Jan Kříž", result: "Způsobilý", notes: "", status: "valid" },

    // ---- CZ013 – David Jelínek ----
    { id: "MEXR-024", examTypeId: "MED-001", employeePersonalNumber: "CZ013", examDate: "2021-05-10", nextExamDate: null, doctorName: "MUDr. Dagmar Šimková", result: "Způsobilý", notes: "", status: "valid" },
    { id: "MEXR-025", examTypeId: "MED-002", employeePersonalNumber: "CZ013", examDate: "2024-05-20", nextExamDate: "2026-05-20", doctorName: "MUDr. Dagmar Šimková", result: "Způsobilý", notes: "", status: "valid" },

    // ---- CZ014 – Anna Kratochvílová ----
    { id: "MEXR-026", examTypeId: "MED-001", employeePersonalNumber: "CZ014", examDate: "2021-06-15", nextExamDate: null, doctorName: "MUDr. Jan Kříž", result: "Způsobilý", notes: "", status: "valid" },
    { id: "MEXR-027", examTypeId: "MED-002", employeePersonalNumber: "CZ014", examDate: "2023-12-10", nextExamDate: "2025-12-10", doctorName: "MUDr. Jan Kříž", result: "Způsobilý", notes: "", status: "valid" },

    // ---- CZ015 – Michal Šťastný ----
    { id: "MEXR-028", examTypeId: "MED-001", employeePersonalNumber: "CZ015", examDate: "2021-09-01", nextExamDate: null, doctorName: "MUDr. Dagmar Šimková", result: "Způsobilý", notes: "", status: "valid" },
    { id: "MEXR-029", examTypeId: "MED-002", employeePersonalNumber: "CZ015", examDate: "2024-01-10", nextExamDate: "2026-01-10", doctorName: "MUDr. Dagmar Šimková", result: "Způsobilý", notes: "", status: "expiring_soon" },

    // ---- CZ017 – Vladimír Beneš (svářeč, neaktivní) ----
    { id: "MEXR-030", examTypeId: "MED-001", employeePersonalNumber: "CZ017", examDate: "2021-02-20", nextExamDate: null, doctorName: "MUDr. Jan Kříž", result: "Způsobilý", notes: "", status: "valid" },
    { id: "MEXR-031", examTypeId: "MED-003", employeePersonalNumber: "CZ017", examDate: "2023-06-15", nextExamDate: "2024-06-15", doctorName: "MUDr. Jan Kříž", result: "Způsobilý", notes: "", status: "expired" },
    { id: "MEXR-032", examTypeId: "MED-006", employeePersonalNumber: "CZ017", examDate: "2024-01-30", nextExamDate: null, doctorName: "MUDr. Jan Kříž", result: "Způsobilý", notes: "Výstupní prohlídka při ukončení PP", status: "valid" },

    // ---- CZ018 – Simona Urbanová ----
    { id: "MEXR-033", examTypeId: "MED-001", employeePersonalNumber: "CZ018", examDate: "2022-03-01", nextExamDate: null, doctorName: "MUDr. Dagmar Šimková", result: "Způsobilý", notes: "", status: "valid" },
    { id: "MEXR-034", examTypeId: "MED-002", employeePersonalNumber: "CZ018", examDate: "2024-08-20", nextExamDate: "2026-08-20", doctorName: "MUDr. Dagmar Šimková", result: "Způsobilý", notes: "", status: "valid" },

    // ---- CZ019 – Radek Kopecký ----
    { id: "MEXR-035", examTypeId: "MED-001", employeePersonalNumber: "CZ019", examDate: "2022-05-10", nextExamDate: null, doctorName: "MUDr. Jan Kříž", result: "Způsobilý", notes: "", status: "valid" },
    { id: "MEXR-036", examTypeId: "MED-002", employeePersonalNumber: "CZ019", examDate: "2024-11-05", nextExamDate: "2026-11-05", doctorName: "MUDr. Jan Kříž", result: "Způsobilý", notes: "", status: "valid" },

    // ---- CZ020 – Hana Vlčková ----
    { id: "MEXR-037", examTypeId: "MED-001", employeePersonalNumber: "CZ020", examDate: "2022-07-15", nextExamDate: null, doctorName: "MUDr. Dagmar Šimková", result: "Způsobilý", notes: "", status: "valid" },
    { id: "MEXR-038", examTypeId: "MED-002", employeePersonalNumber: "CZ020", examDate: "2024-07-20", nextExamDate: "2026-07-20", doctorName: "MUDr. Dagmar Šimková", result: "Způsobilý", notes: "", status: "valid" },
];

// =============================================================================
// Query helpers
// =============================================================================

function recomputeStatus(record: MedicalExamRecord): MedicalExamRecord {
    if (!record.nextExamDate) return { ...record, status: "valid" };

    const nextExam = new Date(record.nextExamDate);
    const now = new Date();
    const thirtyDays = new Date();
    thirtyDays.setDate(thirtyDays.getDate() + 30);

    let status: MedicalExamRecord["status"];
    if (nextExam < now) {
        status = "expired";
    } else if (nextExam <= thirtyDays) {
        status = "expiring_soon";
    } else {
        status = "valid";
    }
    return { ...record, status };
}

/**
 * Získá záznamy prohlídek pro jednoho zaměstnance
 */
export function getMedicalRecordsForEmployee(personalNumber: string): EmployeeMedicalRecord[] {
    const records = MEDICAL_EXAM_RECORDS
        .filter((r) => r.employeePersonalNumber === personalNumber)
        .map(recomputeStatus);

    return records.map((r) => {
        const examType = MEDICAL_EXAM_TYPES.find((t) => t.id === r.examTypeId)!;
        return {
            examTypeId: r.examTypeId,
            examTypeName: examType.name,
            category: examType.category,
            examDate: r.examDate,
            nextExamDate: r.nextExamDate,
            doctorName: r.doctorName,
            result: r.result,
            status: r.status,
            notes: r.notes,
        };
    }).sort((a, b) => b.examDate.localeCompare(a.examDate));
}

/**
 * Vrátí seznam osobních čísel, kteří mají záznamy o prohlídkách
 */
export function getPersonalNumbersWithMedicalExams(): string[] {
    const setPN = new Set<string>();
    for (const r of MEDICAL_EXAM_RECORDS) {
        setPN.add(r.employeePersonalNumber);
    }
    return Array.from(setPN);
}

/**
 * Vrátí typy prohlídek
 */
export function getMedicalExamTypes(): MedicalExamType[] {
    return MEDICAL_EXAM_TYPES;
}
