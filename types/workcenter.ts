// =============================================================================
// dbo.WORKCENTERS — Pracoviště / Work Centers
// =============================================================================
// Každé pracoviště má unikátní kód (WC), patří do oddělení a má nákladové
// středisko. Zaměstnanci jsou přiřazeni k pracovištím přes employeeId → WC.
// =============================================================================

export interface WorkCenter {
    /** Unikátní identifikátor pracoviště (např. "WC-MNT-01") */
    id: string;
    /** Lidsky čitelný název pracoviště */
    name: string;
    /** Podrobnější popis činnosti */
    description: string;
    /** Oddělení, kam pracoviště patří */
    department: string;
    /** Nákladové středisko */
    costCenter: number;
    /** Zda je pracoviště aktivní */
    isActive: boolean;
}
