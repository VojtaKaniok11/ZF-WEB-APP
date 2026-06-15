# 📘 HR Application - Projektová dokumentace

Tento dokument slouží jako přehled aktuálního stavu projektu, provedených změn a návod pro budoucí údržbu a publikaci.

## 🏗 Architektura projektu

Aplikace je postavena jako integrovaný celek dvou technologických stacků:

1.  **Frontend (Next.js 16+):** Umístěn v kořenovém adresáři. Zajišťuje moderní uživatelské rozhraní.
    *   **Výstup:** Statický export (`output: 'export'`) do složky `out/`.
2.  **Backend (.NET 8):** Umístěn v `backend/HrApp.Api/`. Zajišťuje API rozhraní pro práci s SQL databázemi.
    *   **Statické soubory:** Backend je nakonfigurován tak, aby jako své "wwwroot" používal sestavený frontend z Next.js.

## 🚀 Provedené optimalizace (Březen 2026)

### 1. Rychlost a Stabilita
*   **Fix klientského načítání:** Stránky jsou optimalizovány pro statický export (`output: export`), což je nutné pro běh z USB. Data se načítají klientsky (browser), aby build nepadal na nedostupnosti SQL serveru.
*   **Case Fixing:** Fix pro `404` a `ERR_CONNECTION_REFUSED` v produkci — API URL používá relativní cesty `/api`.

### 2. Zdroje dat (Aktualizace 31. 3. 2026)
*   **Pracoviště (Workcenter):** Nyní se bere výhradně ze sloupce **`Stredisko`** v tabulce `USER_MANAGEMENT.dbo.USERS`.
*   **Aktivní zaměstnanci:** Filtrace byla sjednocena napříč aplikací — nyní zobrazujeme pouze ty se statusem **`BIS_Aktivni = 1`**. Tato změna proběhla v `EmployeesController` a `TrainingsV2Controller`.

## 📦 Jak publikovat na USB

1.  Ujisti se, že jsi v kořenové složce projektu.
2.  Spusť příkaz pro sestavení frontendu: `npm run build`
3.  Zkopíruj složku `out` do `backend\HrApp.Api\wwwroot` (v PowerShellu: `robocopy out\ backend\HrApp.Api\wwwroot /MIR`)
4.  Sestav a publikuj backend:
    `dotnet publish backend/HrApp.Api/HrApp.Api.csproj -c Release -o backend/HrApp.Api/publish`

**Celá složka `backend\HrApp.Api\publish` je nyní přenositelná.**

---
*Dokumentace byla vygenerována asistentem Antigravity.*
