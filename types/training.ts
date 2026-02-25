// =============================================================================
// dbo.TRAININGS — Katalog školení
// dbo.TRAINING_SESSIONS — Propojovací tabulka (M:N zaměstnanec ↔ školení)
// =============================================================================
// Training definuje typ školení a jeho periodiku (kolik měsíců platí).
// TrainingSession zaznamenává konkrétní provedení školení (kdo vedl, kdy, kdo
// se zúčastnil). Jde o klasickou M:N vazbu s atributy.
// =============================================================================

/** Katalogový záznam školení (dbo.TRAININGS) */
export interface Training {
    /** Unikátní ID školení (PK) */
    id: string;
    /** Název školení */
    name: string;
    /** Popis obsahu školení */
    description: string;
    /** Perioda platnosti v měsících (0 = jednorázové, bez expirace) */
    validityMonths: number;
    /** Kategorie školení */
    category: "BOZP" | "PO" | "Odborné" | "Vstupní" | "Legislativní";
    /** Zda je školení povinné */
    isMandatory: boolean;
}

/** Záznam o provedení školení (dbo.TRAINING_SESSIONS) */
export interface TrainingSession {
    /** Unikátní ID session (PK) */
    id: string;
    /** FK → Training.id */
    trainingId: string;
    /** Datum konání školení (ISO string) */
    sessionDate: string;
    /** Jméno školitele */
    trainerName: string;
    /** Místo konání */
    location: string;
    /** Seznam osobních čísel zaměstnanců, kteří se zúčastnili (FK → Employee) */
    attendeePersonalNumbers: string[];
    /** Poznámky k session */
    notes: string;
}

/**
 * Denormalizovaný pohled pro UI — jedno školení jednoho zaměstnance
 * (simuluje výsledek SQL JOINu pro zobrazení v detailu)
 */
export interface EmployeeTrainingRecord {
    /** FK → Training.id */
    trainingId: string;
    /** Název školení (z Training.name) */
    trainingName: string;
    /** Kategorie */
    category: Training["category"];
    /** Datum absolvování */
    completedDate: string;
    /** Datum expirace (vypočteno z completedDate + validityMonths) */
    expirationDate: string | null;
    /** Jméno školitele */
    trainerName: string;
    /** Stav platnosti */
    status: "valid" | "expiring_soon" | "expired";
}
