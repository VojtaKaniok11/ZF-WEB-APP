// =============================================================================
// dbo.OOPP_ITEMS — Katalog ochranných osobních pracovních prostředků
// dbo.OOPP_ENTITLEMENTS — Nároky (které pozice/oddělení mají nárok na co)
// dbo.OOPP_ISSUES — Historie výdejů (kdo, kdy, co dostal)
// =============================================================================
// Třívrstvá struktura:
//   1. OOPP_ITEMS = co existuje (boty, rukavice, helma...)
//   2. OOPP_ENTITLEMENTS = kdo má na co nárok a jak často
//   3. OOPP_ISSUES = skutečné výdeje
// =============================================================================

/** Katalog OOPP položek (dbo.OOPP_ITEMS) */
export interface OoppItem {
    /** Unikátní ID položky (PK) */
    id: string;
    /** Název pomůcky */
    name: string;
    /** Kategorie */
    category: "Obuv" | "Rukavice" | "Ochrana hlavy" | "Ochrana zraku" | "Ochrana sluchu" | "Oděv" | "Ostatní";
    /** Popis */
    description: string;
}

/** Nároková tabulka — kdo má nárok na jakou OOPP a jak často (dbo.OOPP_ENTITLEMENTS) */
export interface OoppEntitlement {
    /** Unikátní ID (PK) */
    id: string;
    /** FK → OoppItem.id */
    ooppItemId: string;
    /** Oddělení (nebo null = platí pro všechny) */
    department: string | null;
    /** Pozice (nebo null = platí pro celé oddělení) */
    position: string | null;
    /** Perioda nároku v měsících (jak často má zaměstnanec nárok na nový kus) */
    entitlementPeriodMonths: number;
    /** Počet kusů na jeden výdej */
    quantity: number;
}

/** Záznam o výdeji OOPP (dbo.OOPP_ISSUES) */
export interface OoppIssueRecord {
    /** Unikátní ID záznamu (PK) */
    id: string;
    /** FK → OoppItem.id */
    ooppItemId: string;
    /** FK → Employee.personalNumber */
    employeePersonalNumber: string;
    /** Datum výdeje (ISO string) */
    issueDate: string;
    /** Datum příštího nároku (vypočteno z issueDate + entitlementPeriodMonths) */
    nextEntitlementDate: string | null;
    /** Počet vydaných kusů */
    quantity: number;
    /** Velikost (pokud relevantní) */
    size: string | null;
    /** Poznámky */
    notes: string;
}

/**
 * Denormalizovaný pohled pro UI — jeden OOPP výdej jednoho zaměstnance
 */
export interface EmployeeOoppRecord {
    issueId: string;
    ooppItemId: string;
    ooppItemName: string;
    category: OoppItem["category"];
    lastIssueDate: string;
    nextEntitlementDate: string | null;
    quantity: number;
    size: string | null;
    notes: string;
    /** Zda má zaměstnanec nárok na nový výdej */
    status: "issued" | "eligible_soon" | "eligible";
}
