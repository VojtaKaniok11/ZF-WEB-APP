import { IluoSkill, IluoAssessment, EmployeeIluoRecord } from "@/types/iluo";
import { WORKCENTERS } from "./mock-workcenters";

// =============================================================================
// dbo.ILUO_SKILLS — Katalog dovedností (mock data)
// =============================================================================
// Každá dovednost je vázána na konkrétní pracoviště (WorkCenter).
// =============================================================================

export const ILUO_SKILLS: IluoSkill[] = [
    // Montáž – Linka 1
    { id: "SKILL-001", name: "Montáž podsestavy A1", description: "Kompletní montáž podsestavy A1 včetně kontroly momentu", workCenterId: "WC-MNT-01", category: "Výrobní" },
    { id: "SKILL-002", name: "Montáž podsestavy A2", description: "Montáž podsestavy A2 s automatickým šroubováním", workCenterId: "WC-MNT-01", category: "Výrobní" },
    { id: "SKILL-003", name: "Vizuální kontrola MNT-01", description: "Vizuální kontrola na montážní lince 1", workCenterId: "WC-MNT-01", category: "Kvalita" },

    // Montáž – Linka 2
    { id: "SKILL-004", name: "Montáž modulu B1", description: "Montáž řídícího modulu B1", workCenterId: "WC-MNT-02", category: "Výrobní" },
    { id: "SKILL-005", name: "Testování modulu B1", description: "Funkční test modulu B1 na testovací stanici", workCenterId: "WC-MNT-02", category: "Kvalita" },

    // Svařovna
    { id: "SKILL-006", name: "Programování robota – svařování", description: "Programování svařovacího robota KUKA", workCenterId: "WC-SVR-01", category: "Výrobní" },
    { id: "SKILL-007", name: "Ruční svařování MIG/MAG", description: "Ruční svařování metodou MIG/MAG dle ISO 9606-1", workCenterId: "WC-SVR-02", category: "Výrobní" },
    { id: "SKILL-008", name: "Kontrola svarů – vizuální", description: "Vizuální kontrola svarů dle norem", workCenterId: "WC-SVR-02", category: "Kvalita" },

    // Kvalita
    { id: "SKILL-009", name: "Měření CMM", description: "Obsluha souřadnicového měřicího stroje (CMM)", workCenterId: "WC-KJC-01", category: "Kvalita" },
    { id: "SKILL-010", name: "Vstupní kontrola materiálu", description: "Kontrola vstupního materiálu dle specifikace", workCenterId: "WC-KJC-01", category: "Kvalita" },

    // Logistika
    { id: "SKILL-011", name: "Obsluha VZV", description: "Obsluha vysokozdvižného vozíku", workCenterId: "WC-LOG-01", category: "Logistika" },
    { id: "SKILL-012", name: "Příjem zboží SAP", description: "Příjem zboží v systému SAP", workCenterId: "WC-LOG-01", category: "Logistika" },

    // Údržba
    { id: "SKILL-013", name: "Údržba pneumatiky", description: "Preventivní údržba pneumatických systémů", workCenterId: "WC-UDR-01", category: "Údržba" },
    { id: "SKILL-014", name: "Elektroúdržba do 1kV", description: "Elektroúdržba zařízení do 1 kV", workCenterId: "WC-UDR-01", category: "Údržba" },

    // Bezpečnost (obecné)
    { id: "SKILL-015", name: "Lockout/Tagout", description: "Bezpečnostní postup LOTO při údržbě", workCenterId: "WC-UDR-01", category: "Bezpečnost" },
];

// =============================================================================
// dbo.ILUO_ASSESSMENTS — Hodnocení dovedností zaměstnanců (mock data)
// =============================================================================
// level: I(instruován) → L(lektorován) → U(uvolněn) → O(odborník)
// employeePersonalNumber = FK → Employee.personalNumber
// skillId = FK → IluoSkill.id
// =============================================================================

export const ILUO_ASSESSMENTS: IluoAssessment[] = [
    // ---- CZ003 – Martin Dvořák (Mistr směny, Montáž) ----
    { id: "ASSESS-001", skillId: "SKILL-001", employeePersonalNumber: "CZ003", level: "O", assessmentDate: "2023-06-15", assessorName: "Ing. Karel Novotný", targetLevel: "O", nextReviewDate: "2025-06-15", notes: "Odborník, může školit ostatní" },
    { id: "ASSESS-002", skillId: "SKILL-002", employeePersonalNumber: "CZ003", level: "O", assessmentDate: "2023-06-15", assessorName: "Ing. Karel Novotný", targetLevel: "O", nextReviewDate: "2025-06-15", notes: "" },
    { id: "ASSESS-003", skillId: "SKILL-003", employeePersonalNumber: "CZ003", level: "U", assessmentDate: "2023-06-15", assessorName: "Eva Černá", targetLevel: "O", nextReviewDate: "2025-06-15", notes: "Plánován přechod na O" },
    { id: "ASSESS-004", skillId: "SKILL-004", employeePersonalNumber: "CZ003", level: "U", assessmentDate: "2024-01-10", assessorName: "Ing. Karel Novotný", targetLevel: "U", nextReviewDate: "2026-01-10", notes: "" },

    // ---- CZ005 – Tomáš Procházka (Svářeč senior) ----
    { id: "ASSESS-005", skillId: "SKILL-007", employeePersonalNumber: "CZ005", level: "O", assessmentDate: "2023-09-01", assessorName: "Ing. Vladimír Černý", targetLevel: "O", nextReviewDate: "2025-09-01", notes: "Certifikovaný svářeč" },
    { id: "ASSESS-006", skillId: "SKILL-008", employeePersonalNumber: "CZ005", level: "U", assessmentDate: "2023-09-01", assessorName: "Eva Černá", targetLevel: "O", nextReviewDate: "2025-09-01", notes: "" },
    { id: "ASSESS-007", skillId: "SKILL-006", employeePersonalNumber: "CZ005", level: "L", assessmentDate: "2024-03-20", assessorName: "Ing. Vladimír Černý", targetLevel: "U", nextReviewDate: "2025-03-20", notes: "Učí se programování robota" },

    // ---- CZ004 – Eva Černá (Inspektor kvality) ----
    { id: "ASSESS-008", skillId: "SKILL-009", employeePersonalNumber: "CZ004", level: "O", assessmentDate: "2023-04-10", assessorName: "Ing. Karel Novotný", targetLevel: "O", nextReviewDate: "2025-04-10", notes: "Expert na CMM" },
    { id: "ASSESS-009", skillId: "SKILL-010", employeePersonalNumber: "CZ004", level: "O", assessmentDate: "2023-04-10", assessorName: "Ing. Karel Novotný", targetLevel: "O", nextReviewDate: "2025-04-10", notes: "" },
    { id: "ASSESS-010", skillId: "SKILL-003", employeePersonalNumber: "CZ004", level: "O", assessmentDate: "2023-04-10", assessorName: "Ing. Karel Novotný", targetLevel: "O", nextReviewDate: "2025-04-10", notes: "" },

    // ---- CZ011 – Ondřej Fiala (Operátor montáže) ----
    { id: "ASSESS-011", skillId: "SKILL-001", employeePersonalNumber: "CZ011", level: "U", assessmentDate: "2024-02-15", assessorName: "Martin Dvořák", targetLevel: "O", nextReviewDate: "2025-08-15", notes: "" },
    { id: "ASSESS-012", skillId: "SKILL-002", employeePersonalNumber: "CZ011", level: "L", assessmentDate: "2024-02-15", assessorName: "Martin Dvořák", targetLevel: "U", nextReviewDate: "2025-02-15", notes: "Stále pod dohledem" },
    { id: "ASSESS-013", skillId: "SKILL-003", employeePersonalNumber: "CZ011", level: "I", assessmentDate: "2024-02-15", assessorName: "Eva Černá", targetLevel: "L", nextReviewDate: "2024-08-15", notes: "Instruován, nesmí kontrolovat samostatně" },

    // ---- CZ016 – Barbora Říhová (Operátor montáže) ----
    { id: "ASSESS-014", skillId: "SKILL-001", employeePersonalNumber: "CZ016", level: "L", assessmentDate: "2024-08-01", assessorName: "Martin Dvořák", targetLevel: "U", nextReviewDate: "2025-02-01", notes: "" },
    { id: "ASSESS-015", skillId: "SKILL-004", employeePersonalNumber: "CZ016", level: "I", assessmentDate: "2024-08-01", assessorName: "Martin Dvořák", targetLevel: "L", nextReviewDate: "2025-02-01", notes: "Nový na lince 2" },

    // ---- CZ006 – Lucie Veselá (Koordinátor logistiky) ----
    { id: "ASSESS-016", skillId: "SKILL-011", employeePersonalNumber: "CZ006", level: "O", assessmentDate: "2023-07-01", assessorName: "Ing. Karel Novotný", targetLevel: "O", nextReviewDate: "2025-07-01", notes: "Oprávnění VZV" },
    { id: "ASSESS-017", skillId: "SKILL-012", employeePersonalNumber: "CZ006", level: "U", assessmentDate: "2023-07-01", assessorName: "Ing. Karel Novotný", targetLevel: "O", nextReviewDate: "2025-07-01", notes: "" },

    // ---- CZ009 – Pavel Marek (Technik údržby) ----
    { id: "ASSESS-018", skillId: "SKILL-013", employeePersonalNumber: "CZ009", level: "O", assessmentDate: "2023-10-01", assessorName: "Ing. Karel Novotný", targetLevel: "O", nextReviewDate: "2025-10-01", notes: "" },
    { id: "ASSESS-019", skillId: "SKILL-014", employeePersonalNumber: "CZ009", level: "U", assessmentDate: "2023-10-01", assessorName: "Ing. Karel Novotný", targetLevel: "O", nextReviewDate: "2025-10-01", notes: "Elektrikářský průkaz platný" },
    { id: "ASSESS-020", skillId: "SKILL-015", employeePersonalNumber: "CZ009", level: "O", assessmentDate: "2023-10-01", assessorName: "Ing. Karel Novotný", targetLevel: "O", nextReviewDate: "2025-10-01", notes: "LOTO trenér" },

    // ---- CZ019 – Radek Kopecký (Elektrikář) ----
    { id: "ASSESS-021", skillId: "SKILL-014", employeePersonalNumber: "CZ019", level: "L", assessmentDate: "2024-05-01", assessorName: "Pavel Marek", targetLevel: "U", nextReviewDate: "2025-05-01", notes: "Pod dohledem Pavla Marka" },
    { id: "ASSESS-022", skillId: "SKILL-013", employeePersonalNumber: "CZ019", level: "U", assessmentDate: "2024-05-01", assessorName: "Pavel Marek", targetLevel: "U", nextReviewDate: "2026-05-01", notes: "" },
    { id: "ASSESS-023", skillId: "SKILL-015", employeePersonalNumber: "CZ019", level: "I", assessmentDate: "2024-05-01", assessorName: "Pavel Marek", targetLevel: "L", nextReviewDate: "2025-05-01", notes: "Potřebuje ještě praxi LOTO" },

    // ---- CZ014 – Anna Kratochvílová (Technik kvality) ----
    { id: "ASSESS-024", skillId: "SKILL-009", employeePersonalNumber: "CZ014", level: "L", assessmentDate: "2024-06-01", assessorName: "Eva Černá", targetLevel: "U", nextReviewDate: "2025-06-01", notes: "" },
    { id: "ASSESS-025", skillId: "SKILL-010", employeePersonalNumber: "CZ014", level: "U", assessmentDate: "2024-06-01", assessorName: "Eva Černá", targetLevel: "O", nextReviewDate: "2025-12-01", notes: "" },

    // ---- CZ018 – Simona Urbanová (Disponent, Logistika) ----
    { id: "ASSESS-026", skillId: "SKILL-011", employeePersonalNumber: "CZ018", level: "U", assessmentDate: "2024-03-01", assessorName: "Lucie Veselá", targetLevel: "O", nextReviewDate: "2025-09-01", notes: "" },
    { id: "ASSESS-027", skillId: "SKILL-012", employeePersonalNumber: "CZ018", level: "L", assessmentDate: "2024-03-01", assessorName: "Lucie Veselá", targetLevel: "U", nextReviewDate: "2025-03-01", notes: "Učí se SAP" },

    // ---- CZ017 – Vladimír Beneš (Svářeč, neaktivní) ----
    { id: "ASSESS-028", skillId: "SKILL-007", employeePersonalNumber: "CZ017", level: "U", assessmentDate: "2022-11-01", assessorName: "Tomáš Procházka", targetLevel: "O", nextReviewDate: "2024-11-01", notes: "Ukončen PP" },
];

// =============================================================================
// Query helpers
// =============================================================================

/**
 * Získá ILUO záznamy pro jednoho zaměstnance (denormalizovaný pohled)
 */
export function getIluoRecordsForEmployee(personalNumber: string): EmployeeIluoRecord[] {
    const assessments = ILUO_ASSESSMENTS.filter(
        (a) => a.employeePersonalNumber === personalNumber
    );

    return assessments.map((a) => {
        const skill = ILUO_SKILLS.find((s) => s.id === a.skillId)!;
        const wc = WORKCENTERS.find((w) => w.id === skill.workCenterId);
        return {
            skillId: a.skillId,
            skillName: skill.name,
            workCenterId: skill.workCenterId,
            workCenterName: wc?.name ?? "Neznámé",
            category: skill.category,
            currentLevel: a.level,
            targetLevel: a.targetLevel,
            assessmentDate: a.assessmentDate,
            assessorName: a.assessorName,
            nextReviewDate: a.nextReviewDate,
        };
    });
}

/**
 * Vrátí osobní čísla s ILUO hodnocením
 */
export function getPersonalNumbersWithIluo(): string[] {
    const setPN = new Set<string>();
    for (const a of ILUO_ASSESSMENTS) {
        setPN.add(a.employeePersonalNumber);
    }
    return Array.from(setPN);
}

/**
 * Vrátí katalog dovedností
 */
export function getIluoSkills(): IluoSkill[] {
    return ILUO_SKILLS;
}
