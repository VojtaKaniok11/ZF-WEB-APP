// =============================================================================
// dbo.MEDICAL_EXAM_TYPES — Katalog typů lékařských prohlídek
// dbo.MEDICAL_EXAMS — Záznamy o absolvovaných prohlídkách (M:N)
// =============================================================================
// Struktura analogická ke školení: typ prohlídky má periodiku,
// záznamy propojují zaměstnance s konkrétní prohlídkou a datem.
// =============================================================================

/** Typ lékařské prohlídky (dbo.MEDICAL_EXAM_TYPES) */
export interface MedicalExamType {
    /** Unikátní ID typu prohlídky (PK) */
    id: string;
    /** Název prohlídky */
    name: string;
    /** Popis */
    description: string;
    /** Perioda platnosti v měsících */
    validityMonths: number;
    /** Kategorie prohlídky */
    category: "Vstupní" | "Periodická" | "Mimořádná" | "Výstupní" | "Řidičský průkaz";
}

/** Záznam o absolvované prohlídce (dbo.MEDICAL_EXAMS) */
export interface MedicalExamRecord {
    /** Unikátní ID záznamu (PK) */
    id: string;
    /** FK → MedicalExamType.id */
    examTypeId: string;
    /** FK → Employee.personalNumber */
    employeePersonalNumber: string;
    /** Datum prohlídky (ISO string) */
    examDate: string;
    /** Datum příští prohlídky (vypočteno) */
    nextExamDate: string | null;
    /** Jméno lékaře */
    doctorName: string;
    /** Výsledek prohlídky */
    result: "Způsobilý" | "Způsobilý s omezením" | "Nezpůsobilý" | "Dočasně nezpůsobilý";
    /** Poznámky / omezení */
    notes: string;
    /** Stav platnosti */
    status: "valid" | "expiring_soon" | "expired";
}

/**
 * Denormalizovaný pohled pro UI — jedna prohlídka jednoho zaměstnance
 */
export interface EmployeeMedicalRecord {
    examTypeId: string;
    examTypeName: string;
    category: MedicalExamType["category"];
    examDate: string;
    nextExamDate: string | null;
    doctorName: string;
    result: MedicalExamRecord["result"];
    status: "valid" | "expiring_soon" | "expired";
    notes: string;
}
