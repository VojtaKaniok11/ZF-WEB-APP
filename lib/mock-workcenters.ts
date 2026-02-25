import { WorkCenter } from "@/types/workcenter";

// =============================================================================
// dbo.WORKCENTERS — Mock data (simuluje SQL tabulku)
// =============================================================================
// Pracoviště jsou přiřazena oddělením a mají nákladová střediska.
// ILUO dovednosti jsou mapovány na konkrétní pracoviště přes workCenterId.
// =============================================================================

export const WORKCENTERS: WorkCenter[] = [
    {
        id: "WC-MNT-01",
        name: "Montáž – Linka 1",
        description: "Hlavní montážní linka pro produkty řady A",
        department: "Montáž",
        costCenter: 110,
        isActive: true,
    },
    {
        id: "WC-MNT-02",
        name: "Montáž – Linka 2",
        description: "Sekundární montážní linka pro produkty řady B",
        department: "Montáž",
        costCenter: 110,
        isActive: true,
    },
    {
        id: "WC-SVR-01",
        name: "Svařovna – Robot 1",
        description: "Robotické svařování podvozků",
        department: "Sváření",
        costCenter: 130,
        isActive: true,
    },
    {
        id: "WC-SVR-02",
        name: "Svařovna – Ruční",
        description: "Ruční svařování a opravy",
        department: "Sváření",
        costCenter: 130,
        isActive: true,
    },
    {
        id: "WC-LAK-01",
        name: "Lakovna – KTL",
        description: "Kataforetické lakování",
        department: "Lakovna",
        costCenter: 180,
        isActive: true,
    },
    {
        id: "WC-KJC-01",
        name: "Kontrola kvality – Vstupní",
        description: "Vstupní kontrola dodávaných dílů",
        department: "Kvalita",
        costCenter: 120,
        isActive: true,
    },
    {
        id: "WC-KJC-02",
        name: "Kontrola kvality – Výstupní",
        description: "Výstupní kontrola hotových produktů",
        department: "Kvalita",
        costCenter: 120,
        isActive: true,
    },
    {
        id: "WC-LOG-01",
        name: "Logistika – Příjem",
        description: "Příjem materiálu a vstupní logistika",
        department: "Logistika",
        costCenter: 140,
        isActive: true,
    },
    {
        id: "WC-SKL-01",
        name: "Sklad – Hlavní",
        description: "Hlavní sklad materiálu a komponent",
        department: "Sklad",
        costCenter: 150,
        isActive: false,
    },
    {
        id: "WC-UDR-01",
        name: "Údržba – Dílna",
        description: "Centrální údržbářská dílna",
        department: "Údržba",
        costCenter: 160,
        isActive: true,
    },
];

// =============================================================================
// Query helpers (simulate DB queries)
// =============================================================================

export function getWorkCenters(): WorkCenter[] {
    return WORKCENTERS;
}

export function getWorkCenterById(id: string): WorkCenter | null {
    return WORKCENTERS.find((wc) => wc.id === id) ?? null;
}

export function getWorkCentersByDepartment(department: string): WorkCenter[] {
    return WORKCENTERS.filter((wc) => wc.department === department);
}
