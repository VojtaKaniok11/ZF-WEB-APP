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

/**
 * Returns the base URL for API calls.
 * In development, defaults to the .NET backend port 5062.
 * In production (IIS), uses the environment variable or falls back to /api.
 */
export function getApiUrl(): string {
  if (typeof window === "undefined") return "/api";
  
  // Hardcoded check for development environment (different ports)
  if (window.location.port === "3000") {
    return "http://localhost:5062/api";
  }
  
  // Try environment variable, but prioritize relative path in production
  const envUrl = process.env.NEXT_PUBLIC_DOTNET_API_URL;
  if (envUrl && envUrl.startsWith("http") && window.location.port === "5062") {
      // If we are already on port 5062 but env says http, 
      // it's likely a misconfigured .env.local being picked up by build.
      return "/api";
  }

  if (envUrl) return envUrl;
  
  return "/api";
}
