# Plán migrace HR Aplikace z Next.js / Node do .NET 8

Tento dokument zpracovává kompletní a detailní návrh na přepis současné HR aplikace do prostředí **.NET 8**.

---

## 1. Analýza výchozího stavu (As-Is)
*   **Projekt:** Webová aplikace (kódové jméno `kod-stranka`) postavená na ekosystému Node.js / React.
*   **Frontend:** React 19 v rámci Next.js (App Router), Tailwind CSS v4 pro styly, ikony `lucide-react`. Export dat do Excelu (`xlsx`) a tisku do PDF (`html2pdf.js`).
*   **Backend / API:** Řešeno lokálně přímo na stejném serveru jako frontend, pomocí Next.js API Routes (Serverless funkce / SSR) umístěných ve složkách `app/api/`. 
*   **Databáze:** Přímé raw SQL dotazy na Microsoft SQL Server s využitím balíčků `mssql` a `msnodesqlv8`.
*   **Moduly:** Systém pokrývá správu zaměstnanců (`employee`), organizaci školení (`trainings`, `trainings-v2`), lékařské prohlídky (`medical`), matici dovedností (`iluo`) a pracovní pomůcky (`oopp`).

Vzhledem k těmto specifikům je přesun na robustní platformu jakou je **.NET 8** logickým krokem pro zvýšení škálovatelnosti backendu a snadnější práci v podnikovém prostředí (např. vnitřní sítě, Active Directory / Windows Auth integrace případně silně formované bezpečnostní politiky C# struktury).

---

## 2. Doporučená Cílová Architektura (To-Be)

Pro migraci takto rozsáhlého rozpracovaného kódu (kde UI tvoří významný podíl složitosti) je optimální zvolit evoluční přístup.

### Architektura odděleného Backend API a React Frontendu
Skládá se ze dvou částí:
1.  **Backend (Nový):** ASP.NET Core Web API (.NET 8). Bude komunikovat s databází, řešit veškerou business logiku a vystavovat RESTful služby.
2.  **Frontend (Stávající upravený):** Next.js zůstane, ale pouze jako "hloupý" klient (případně Static Site Generation SPA s Reactem), který se odpojí od vlastního připojení na databázi a přesune volání fetch do nově postaveného .NET API.

*Případná Alternativa (Full .NET rewrite): Blazor Web App. U této varianty by se musel kompletně zahodit všechen React / Tailwind kód ze složek `components` a `app` a přepsat jej do jazyka C# a Razor komponent. Kvůli odhadované astronomické časové náročnosti na přepis a ladění stylování frontend UX se tento přístup nedoporučuje.*

---

## 3. Detailní fázovaný plán migrace (pro doporučenou architekturu)

### FÁZE I: Návrh a Příprava nového .NET 8 Backend API
1.  **Založení struktury projektu:**
    *   Vytvoření nového solution např. `HrManager` s projektem typu Web API (`HrManager.Api`).
    *   Výběr vrstev: Doporučuje se přidat projekty `HrManager.Core` (pro byznys logiku) a `HrManager.Infrastructure` nebo `HrManager.Data` (pro práci s DB).
2.  **Konektivita na MS SQL:**
    *   Konfigurace connection stringu v souboru `appsettings.json`.
    *   Vzhledem ke složitostem stávajících custom SQL dotazů doporučujeme použít **Dapper** (lehké superrychlé ORM stavěné na raw dotazech podobně jako `mssql`), anebo **Entity Framework Core 8** s principem `Scaffold-DbContext` pro vygenerování DataContextů z dřívějších tabulek (avšak s rizikem narušení složitějších JOIN operací nad aktuálními SQL Views).
3.  **Cross-Origin (CORS):**
    *   Konfigurace builderu v `Program.cs` (.NET 8) na přijímání požadavků (Axios/Fetch) výhradně z Reactového lokálního (`localhost:3000`) i produkčního portu, jelikož Backend a Frontend poběží odteď na jiných serverových aplikacích.

### FÁZE II: Migrace Datových Modelů a API Controllerů
Nastává mravenčí práce u přepisu kódu složky po složce ze serverových funkcí Next.js do C#.

1.  **Modely (DTOs):** Z `types/*.ts` do C# classes / records (např. `EmployeeDto.cs`, `TrainingRecordDto.cs` atd.). Pro .NET 8 se efektivně hodí použít `record`, pro kratší zápis přepisovaných typů objektového modelu.
2.  **Modul Employees:** Převést endpoint z Node js do nového `EmployeesController.cs`. Změna načítání string SQL do `.QueryAsync<EmployeeDto>()` v Dapperu a vrácení skrze `Ok()`.
3.  **Modul Medical, OOPP, Trainings, ILUO:** Obdobný postup pro zbylé Next.js moduly (`MedicalController`, `TrainingsController`... apod.).
4.  **Logging a Error Handling:** Integrovat `Serilog` (namísto klasického console.log), a globální *Exception middleware* (pro zachytávání pádů databázového wrapperu do log souborů a vracení formátovaných validací např. 500/400 stavů na klienta JSON chybníkem RFC7807).

### FÁZE III: Úprava existujícího Next.js Frontendu (Klient)
Kód frontendu by už neměl znát existenci připojení k databázi (bezpečnost i architektura).
1.  **Konfigurace Base URL:** Vytvoření souboru `.env.local` kde se nastaví proměnná (např. `NEXT_PUBLIC_DOTNET_API_URL=https://localhost:7001/api/`).
2.  **Odstranění původního MS SQL enginu:** V repozitáři se odinstalují (přes `npm uninstall/bun remove`) všechny knihovny jako `mssql`, `msnodesqlv8` a promažou se obslužné TS skripty testující piny, jelikož databáze je převzate backendem .NET.
3.  **Přesměrování Data Fetching:** Komponenty (jako je např. ten otevřený `TrainingsClientV2.tsx`) přestanou směřovat fetch dotazy relativně na `/api/...` (či Server Actions), napíše se nová obálka / Axios provider ukazující na .NET API a data se začnou fetChovat z adresy C# služby např. `http://localhost:5000/api/trainings`. Podmínkou je správná desérializace - je zapotřebí nastavit .NET tak, aby odpovídalo na CamelCase struktury JS klientu.

### FÁZE IV: Generování Souborů a Tisk na PDF/Excel
.NET s sebou nese velké knihovny pro backend-side vytváření Office souborů. Zvažte migraci těchto výpočetně náročných úloh na C# Backend namísto zatěžování prohlížeče staršími JS knihovnami.
*   **Excel:** Přesun generování dat z web klienta (knihovny `xlsx` do `EPPlus` nebo volné `ClosedXML` v .NETu). Endpoint typu `GET /api/export/employees` vrátí přímo File (`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`).
*   **PDF:** Pokud se pro tisk tabulek hodí React komponenta z důvodů vzhledu s existujícím Tailwindem beze změn, ponechat frontend tisk knihovnou `html2pdf.js`. Pro čistší reporty ze surových dat použít moderní knihovnu např. `QuestPDF` přímo nasazenou do C# a generovat soubory na serverech.

### FÁZE V: Validace, Testování a Nasazení CI/CD
*   Vzhledem ke složitosti je třeba modulově ověřit datové modely a zamezit chybám typu Uppercase `ID` místo lowercase `id`, případně přemapování jmen proměnných, u kterých backend v C# používá PascalCase oproti frontendovému ts/camelCase.
*   **Nasazení - Backend:** Instalace aplikací jako službu běžící přes server Kestrel do podnikové serverové infrastruktury nejspíše IIS server, s implementací Windows Autentifikace IIS nebo Active Directory Single Sign-On.
*   **Nasazení - Frontend:** Aplikace bude nasazena do Node web serveru jako proxy web anebo bude jen přes `next build && next export` a nakopírována na static servery/NGINX/IIS, protože backendová data poskytne C#.

---

### Můžeme s některou fází začít?
V závislosti na rozhodnutí můžeme rozchodit prototyp .NET 8 WebAPI a nechat jej vytěžit data z jedné vaší tabulky a nasimulovat chování z klienta Reactu Next.js. Jako první krok by bylo zapotřebí nainstalovat SDK od dotnetu na cílovém přístroji.
