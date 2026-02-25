import { OoppItem, OoppEntitlement, OoppIssueRecord, EmployeeOoppRecord } from "@/types/oopp";

// =============================================================================
// dbo.OOPP_ITEMS — Katalog ochranných pomůcek (mock data)
// =============================================================================

export const OOPP_ITEMS: OoppItem[] = [
    { id: "OOPP-001", name: "Bezpečnostní obuv S3", category: "Obuv", description: "Bezpečnostní pracovní obuv se ocelovou špičkou, třída S3" },
    { id: "OOPP-002", name: "Pracovní rukavice – mechanické", category: "Rukavice", description: "Ochranné rukavice proti mechanickým rizikům" },
    { id: "OOPP-003", name: "Svářečské rukavice", category: "Rukavice", description: "Tepelně odolné rukavice pro svářeče" },
    { id: "OOPP-004", name: "Ochranné brýle", category: "Ochrana zraku", description: "Ochranné brýle proti odlétajícím částicím" },
    { id: "OOPP-005", name: "Svářečská kukla", category: "Ochrana zraku", description: "Samozatmívací svářečská kukla" },
    { id: "OOPP-006", name: "Ochranná přilba", category: "Ochrana hlavy", description: "Průmyslová ochranná přilba" },
    { id: "OOPP-007", name: "Zátkové chrániče sluchu", category: "Ochrana sluchu", description: "Jednorázové zátkové chrániče sluchu" },
    { id: "OOPP-008", name: "Mušlové chrániče sluchu", category: "Ochrana sluchu", description: "Mušlové chrániče sluchu SNR 32 dB" },
    { id: "OOPP-009", name: "Pracovní oděv – montérky", category: "Oděv", description: "Pracovní kalhoty s laclem" },
    { id: "OOPP-010", name: "Pracovní bunda – zimní", category: "Oděv", description: "Zateplená pracovní bunda pro venkovní práce" },
    { id: "OOPP-011", name: "Reflexní vesta", category: "Oděv", description: "Výstražná reflexní vesta třídy 2" },
];

// =============================================================================
// dbo.OOPP_ENTITLEMENTS — Nároky na OOPP dle pozice/oddělení
// =============================================================================

export const OOPP_ENTITLEMENTS: OoppEntitlement[] = [
    // Všichni zaměstnanci — obuv, brýle, vesta
    { id: "ENT-001", ooppItemId: "OOPP-001", department: null, position: null, entitlementPeriodMonths: 12, quantity: 1 },
    { id: "ENT-002", ooppItemId: "OOPP-004", department: null, position: null, entitlementPeriodMonths: 12, quantity: 1 },
    { id: "ENT-003", ooppItemId: "OOPP-011", department: null, position: null, entitlementPeriodMonths: 24, quantity: 1 },

    // Montáž, Sklad, Balení — rukavice mechanické, montérky
    { id: "ENT-004", ooppItemId: "OOPP-002", department: "Montáž", position: null, entitlementPeriodMonths: 6, quantity: 2 },
    { id: "ENT-005", ooppItemId: "OOPP-009", department: "Montáž", position: null, entitlementPeriodMonths: 12, quantity: 2 },
    { id: "ENT-006", ooppItemId: "OOPP-002", department: "Sklad", position: null, entitlementPeriodMonths: 6, quantity: 2 },
    { id: "ENT-007", ooppItemId: "OOPP-002", department: "Balení", position: null, entitlementPeriodMonths: 6, quantity: 2 },

    // Svářeči — svářečské rukavice, kukla
    { id: "ENT-008", ooppItemId: "OOPP-003", department: "Sváření", position: null, entitlementPeriodMonths: 6, quantity: 1 },
    { id: "ENT-009", ooppItemId: "OOPP-005", department: "Sváření", position: null, entitlementPeriodMonths: 36, quantity: 1 },

    // Logistika — přilba, mušlové chrániče
    { id: "ENT-010", ooppItemId: "OOPP-006", department: "Logistika", position: null, entitlementPeriodMonths: 36, quantity: 1 },
    { id: "ENT-011", ooppItemId: "OOPP-008", department: "Logistika", position: null, entitlementPeriodMonths: 24, quantity: 1 },

    // Údržba — zimní bunda, rukavice, zátkové chrániče
    { id: "ENT-012", ooppItemId: "OOPP-010", department: "Údržba", position: null, entitlementPeriodMonths: 24, quantity: 1 },
    { id: "ENT-013", ooppItemId: "OOPP-002", department: "Údržba", position: null, entitlementPeriodMonths: 6, quantity: 2 },
    { id: "ENT-014", ooppItemId: "OOPP-007", department: "Údržba", position: null, entitlementPeriodMonths: 1, quantity: 10 },
];

// =============================================================================
// dbo.OOPP_ISSUES — Historie výdejů (mock data)
// =============================================================================

export const OOPP_ISSUE_RECORDS: OoppIssueRecord[] = [
    // ---- CZ003 – Martin Dvořák (Montáž) ----
    { id: "ISS-001", ooppItemId: "OOPP-001", employeePersonalNumber: "CZ003", issueDate: "2024-03-15", nextEntitlementDate: "2025-03-15", quantity: 1, size: "43", notes: "" },
    { id: "ISS-002", ooppItemId: "OOPP-002", employeePersonalNumber: "CZ003", issueDate: "2024-09-01", nextEntitlementDate: "2025-03-01", quantity: 2, size: "L", notes: "" },
    { id: "ISS-003", ooppItemId: "OOPP-004", employeePersonalNumber: "CZ003", issueDate: "2024-03-15", nextEntitlementDate: "2025-03-15", quantity: 1, size: null, notes: "" },
    { id: "ISS-004", ooppItemId: "OOPP-009", employeePersonalNumber: "CZ003", issueDate: "2024-06-01", nextEntitlementDate: "2025-06-01", quantity: 2, size: "L", notes: "" },

    // ---- CZ005 – Tomáš Procházka (Sváření) ----
    { id: "ISS-005", ooppItemId: "OOPP-001", employeePersonalNumber: "CZ005", issueDate: "2024-05-10", nextEntitlementDate: "2025-05-10", quantity: 1, size: "44", notes: "" },
    { id: "ISS-006", ooppItemId: "OOPP-003", employeePersonalNumber: "CZ005", issueDate: "2024-08-20", nextEntitlementDate: "2025-02-20", quantity: 1, size: "XL", notes: "" },
    { id: "ISS-007", ooppItemId: "OOPP-005", employeePersonalNumber: "CZ005", issueDate: "2023-01-15", nextEntitlementDate: "2026-01-15", quantity: 1, size: null, notes: "Samozatmívací DIN 4/9-13" },
    { id: "ISS-008", ooppItemId: "OOPP-004", employeePersonalNumber: "CZ005", issueDate: "2024-05-10", nextEntitlementDate: "2025-05-10", quantity: 1, size: null, notes: "" },

    // ---- CZ006 – Lucie Veselá (Logistika) ----
    { id: "ISS-009", ooppItemId: "OOPP-001", employeePersonalNumber: "CZ006", issueDate: "2024-04-01", nextEntitlementDate: "2025-04-01", quantity: 1, size: "38", notes: "" },
    { id: "ISS-010", ooppItemId: "OOPP-006", employeePersonalNumber: "CZ006", issueDate: "2023-06-01", nextEntitlementDate: "2026-06-01", quantity: 1, size: null, notes: "" },
    { id: "ISS-011", ooppItemId: "OOPP-008", employeePersonalNumber: "CZ006", issueDate: "2024-04-01", nextEntitlementDate: "2026-04-01", quantity: 1, size: null, notes: "" },
    { id: "ISS-012", ooppItemId: "OOPP-011", employeePersonalNumber: "CZ006", issueDate: "2024-04-01", nextEntitlementDate: "2026-04-01", quantity: 1, size: "M", notes: "" },

    // ---- CZ007 – Jiří Kučera (Sklad, neaktivní) ----
    { id: "ISS-013", ooppItemId: "OOPP-001", employeePersonalNumber: "CZ007", issueDate: "2023-01-20", nextEntitlementDate: "2024-01-20", quantity: 1, size: "42", notes: "" },
    { id: "ISS-014", ooppItemId: "OOPP-002", employeePersonalNumber: "CZ007", issueDate: "2023-07-01", nextEntitlementDate: "2024-01-01", quantity: 2, size: "L", notes: "" },

    // ---- CZ009 – Pavel Marek (Údržba) ----
    { id: "ISS-015", ooppItemId: "OOPP-001", employeePersonalNumber: "CZ009", issueDate: "2024-06-15", nextEntitlementDate: "2025-06-15", quantity: 1, size: "44", notes: "" },
    { id: "ISS-016", ooppItemId: "OOPP-002", employeePersonalNumber: "CZ009", issueDate: "2024-10-01", nextEntitlementDate: "2025-04-01", quantity: 2, size: "XL", notes: "" },
    { id: "ISS-017", ooppItemId: "OOPP-010", employeePersonalNumber: "CZ009", issueDate: "2024-10-01", nextEntitlementDate: "2026-10-01", quantity: 1, size: "XL", notes: "" },
    { id: "ISS-018", ooppItemId: "OOPP-007", employeePersonalNumber: "CZ009", issueDate: "2025-01-15", nextEntitlementDate: "2025-02-15", quantity: 10, size: null, notes: "Měsíční dávka" },

    // ---- CZ011 – Ondřej Fiala (Montáž) ----
    { id: "ISS-019", ooppItemId: "OOPP-001", employeePersonalNumber: "CZ011", issueDate: "2024-07-01", nextEntitlementDate: "2025-07-01", quantity: 1, size: "43", notes: "" },
    { id: "ISS-020", ooppItemId: "OOPP-002", employeePersonalNumber: "CZ011", issueDate: "2024-07-01", nextEntitlementDate: "2025-01-01", quantity: 2, size: "L", notes: "" },
    { id: "ISS-021", ooppItemId: "OOPP-009", employeePersonalNumber: "CZ011", issueDate: "2024-07-01", nextEntitlementDate: "2025-07-01", quantity: 2, size: "L", notes: "" },

    // ---- CZ016 – Barbora Říhová (Montáž) ----
    { id: "ISS-022", ooppItemId: "OOPP-001", employeePersonalNumber: "CZ016", issueDate: "2024-08-01", nextEntitlementDate: "2025-08-01", quantity: 1, size: "37", notes: "" },
    { id: "ISS-023", ooppItemId: "OOPP-002", employeePersonalNumber: "CZ016", issueDate: "2024-08-01", nextEntitlementDate: "2025-02-01", quantity: 2, size: "S", notes: "" },
    { id: "ISS-024", ooppItemId: "OOPP-009", employeePersonalNumber: "CZ016", issueDate: "2024-08-01", nextEntitlementDate: "2025-08-01", quantity: 2, size: "S", notes: "" },

    // ---- CZ017 – Vladimír Beneš (Sváření, neaktivní) ----
    { id: "ISS-025", ooppItemId: "OOPP-001", employeePersonalNumber: "CZ017", issueDate: "2023-02-10", nextEntitlementDate: "2024-02-10", quantity: 1, size: "45", notes: "" },
    { id: "ISS-026", ooppItemId: "OOPP-003", employeePersonalNumber: "CZ017", issueDate: "2023-02-10", nextEntitlementDate: "2023-08-10", quantity: 1, size: "XL", notes: "" },
    { id: "ISS-027", ooppItemId: "OOPP-005", employeePersonalNumber: "CZ017", issueDate: "2022-06-01", nextEntitlementDate: "2025-06-01", quantity: 1, size: null, notes: "" },

    // ---- CZ018 – Simona Urbanová (Logistika) ----
    { id: "ISS-028", ooppItemId: "OOPP-001", employeePersonalNumber: "CZ018", issueDate: "2024-09-10", nextEntitlementDate: "2025-09-10", quantity: 1, size: "39", notes: "" },
    { id: "ISS-029", ooppItemId: "OOPP-006", employeePersonalNumber: "CZ018", issueDate: "2024-09-10", nextEntitlementDate: "2027-09-10", quantity: 1, size: null, notes: "" },
    { id: "ISS-030", ooppItemId: "OOPP-011", employeePersonalNumber: "CZ018", issueDate: "2024-09-10", nextEntitlementDate: "2026-09-10", quantity: 1, size: "S", notes: "" },

    // ---- CZ019 – Radek Kopecký (Údržba) ----
    { id: "ISS-031", ooppItemId: "OOPP-001", employeePersonalNumber: "CZ019", issueDate: "2024-11-01", nextEntitlementDate: "2025-11-01", quantity: 1, size: "43", notes: "" },
    { id: "ISS-032", ooppItemId: "OOPP-002", employeePersonalNumber: "CZ019", issueDate: "2024-11-01", nextEntitlementDate: "2025-05-01", quantity: 2, size: "L", notes: "" },
    { id: "ISS-033", ooppItemId: "OOPP-010", employeePersonalNumber: "CZ019", issueDate: "2024-11-01", nextEntitlementDate: "2026-11-01", quantity: 1, size: "L", notes: "" },
    { id: "ISS-034", ooppItemId: "OOPP-007", employeePersonalNumber: "CZ019", issueDate: "2025-02-01", nextEntitlementDate: "2025-03-01", quantity: 10, size: null, notes: "Měsíční dávka" },
];

// =============================================================================
// Query helpers
// =============================================================================

function computeOoppStatus(nextEntitlementDate: string | null): EmployeeOoppRecord["status"] {
    if (!nextEntitlementDate) return "issued";

    const nextDate = new Date(nextEntitlementDate);
    const now = new Date();
    const thirtyDays = new Date();
    thirtyDays.setDate(thirtyDays.getDate() + 30);

    if (nextDate <= now) return "eligible";
    if (nextDate <= thirtyDays) return "eligible_soon";
    return "issued";
}

/**
 * Získá záznamy OOPP výdejů pro jednoho zaměstnance
 */
export function getOoppRecordsForEmployee(personalNumber: string): EmployeeOoppRecord[] {
    const issues = OOPP_ISSUE_RECORDS.filter((r) => r.employeePersonalNumber === personalNumber);

    return issues.map((r) => {
        const item = OOPP_ITEMS.find((i) => i.id === r.ooppItemId)!;
        return {
            ooppItemId: r.ooppItemId,
            ooppItemName: item.name,
            category: item.category,
            lastIssueDate: r.issueDate,
            nextEntitlementDate: r.nextEntitlementDate,
            quantity: r.quantity,
            size: r.size,
            status: computeOoppStatus(r.nextEntitlementDate),
        };
    }).sort((a, b) => b.lastIssueDate.localeCompare(a.lastIssueDate));
}

/**
 * Vrátí seznam osobních čísel s OOPP záznamy
 */
export function getPersonalNumbersWithOopp(): string[] {
    const setPN = new Set<string>();
    for (const r of OOPP_ISSUE_RECORDS) {
        setPN.add(r.employeePersonalNumber);
    }
    return Array.from(setPN);
}

/**
 * Vrátí katalog OOPP
 */
export function getOoppItems(): OoppItem[] {
    return OOPP_ITEMS;
}
