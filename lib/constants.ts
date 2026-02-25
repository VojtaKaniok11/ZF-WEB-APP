export const DEPARTMENTS = [
    "Vedení",
    "Montáž",
    "Sváření",
    "Lakovna",
    "Kvalita",
    "Sklad",
    "Balení",
    "Údržba",
    "Vývoj",
    "Logistika",
    "IT",
    "Řízení výroby",
] as const;

export type Department = (typeof DEPARTMENTS)[number];

export function getDepartmentShortCode(department: string | null): string {
    if (!department) return "GEN";

    const upper = department.toUpperCase();
    const codeMap: Record<string, string> = {
        "MONTÁŽ": "MNT",
        "MONTÁ": "MNT",
        "MONT": "MNT",
        "SVAŘENÍ": "SVR",
        "SVA": "SVR",
        "SVAR": "SVR",
        "LAKOVNA": "LAK",
        "LAK": "LAK",
        "KONTROLA JAKOSTI": "KJC",
        "KVALITA": "KJC",
        "KVAL": "KJC",
        "BALENÍ": "BAL",
        "BAL": "BAL",
        "LOGISTIKA": "LOG",
        "LOG": "LOG",
        "SKLAD": "SKL",
        "ÚDRŽBA": "UDR",
        "UDR": "UDR",
        "VEDENÍ": "VED",
        "IT": "IT",
        "VÝVOJ": "VYV",
        "ŘÍZENÍ VÝROBY": "RVY",
    };

    return codeMap[upper] ?? upper.substring(0, 3);
}
