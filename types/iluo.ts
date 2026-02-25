// =============================================================================
// dbo.ILUO_SKILLS — Katalog dovedností (skills matrix)
// dbo.ILUO_ASSESSMENTS — Hodnocení dovedností zaměstnanců (M:N)
// =============================================================================
// ILUO matice:
//   I = Instruován (poučen, nesmí pracovat samostatně)
//   L = Lektorován (pracuje pod dohledem, učí se)
//   U = Uvolněn (pracuje samostatně, plně způsobilý)
//   O = Odborník (expert, může školit ostatní)
// =============================================================================

/** Úroveň ILUO */
export type IluoLevel = "I" | "L" | "U" | "O";

/** Katalog dovedností (dbo.ILUO_SKILLS) */
export interface IluoSkill {
    /** Unikátní ID dovednosti (PK) */
    id: string;
    /** Název dovednosti */
    name: string;
    /** Popis dovednosti */
    description: string;
    /** FK → WorkCenter.id — na jakém pracovišti je dovednost relevantní */
    workCenterId: string;
    /** Kategorie dovednosti */
    category: "Výrobní" | "Kvalita" | "Bezpečnost" | "Logistika" | "Údržba";
}

/** Hodnocení dovednosti zaměstnance (dbo.ILUO_ASSESSMENTS) */
export interface IluoAssessment {
    /** Unikátní ID záznamu (PK) */
    id: string;
    /** FK → IluoSkill.id */
    skillId: string;
    /** FK → Employee.personalNumber */
    employeePersonalNumber: string;
    /** Aktuální úroveň ILUO */
    level: IluoLevel;
    /** Datum hodnocení (ISO string) */
    assessmentDate: string;
    /** Jméno hodnotitele / školitele */
    assessorName: string;
    /** Cílová úroveň (kam zaměstnanec směřuje) */
    targetLevel: IluoLevel;
    /** Datum příštího přehodnocení */
    nextReviewDate: string | null;
    /** Poznámky */
    notes: string;
}

/**
 * Denormalizovaný pohled pro UI — jedna dovednost jednoho zaměstnance
 */
export interface EmployeeIluoRecord {
    skillId: string;
    skillName: string;
    workCenterId: string;
    workCenterName: string;
    category: IluoSkill["category"];
    currentLevel: IluoLevel;
    targetLevel: IluoLevel;
    assessmentDate: string;
    assessorName: string;
    nextReviewDate: string | null;
}
