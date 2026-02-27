import { Employee, EmployeeDetail } from "@/types/employee";
import { getDepartmentShortCode } from "./constants";
import { generateInitialMedicalForEmployee } from "./mock-medical";
import { generateInitialTrainingsForEmployee } from "./mock-trainings";
import { generateInitialOoppForEmployee } from "./mock-oopp";
import { generateInitialIluoForEmployee } from "./mock-iluo";

/* ------------------------------------------------------------------ */
/*  Helper functions (ported from C# helpers in original Razor code)  */
/* ------------------------------------------------------------------ */

function getCostCenterDisplay(
    id: number,
    costCenter: number | null,
    department: string
): string {
    if (costCenter && costCenter > 0) {
        return `CZ-${String(costCenter).padStart(3, "0")}`;
    }
    const deptCode = getDepartmentShortCode(department);
    const suffix = (id % 50) + 1;
    return `${deptCode}-${String(suffix).padStart(3, "0")}`;
}

function getHiringDate(id: number): string {
    const baseDate = new Date(2020, 0, 1);
    const daysToAdd = (id * 17) % 1825;
    const result = new Date(baseDate);
    result.setDate(result.getDate() + daysToAdd);
    return result.toISOString().split("T")[0];
}

/* ------------------------------------------------------------------ */
/*  Mock employee database                                            */
/* ------------------------------------------------------------------ */

interface RawUser {
    id: number;
    bisPersonalNumber: string;
    bisFirstName: string;
    bisLastName: string;
    department: string;
    costCenter: number | null;
    isActive: boolean;
    userName: string;
    email: string;
    phone: string;
    mobile: string;
    position: string;
    level: string;
    managerId: number | null;
}

const RAW_USERS: RawUser[] = [
    { id: 1, bisPersonalNumber: "CZ001", bisFirstName: "Jan", bisLastName: "Novák", department: "Vedení", costCenter: 100, isActive: true, userName: "jnovak", email: "jan.novak@zf.com", phone: "+420 555 001 001", mobile: "+420 777 001 001", position: "Ředitel závodu", level: "L1", managerId: null },
    { id: 2, bisPersonalNumber: "CZ002", bisFirstName: "Petra", bisLastName: "Svobodová", department: "IT", costCenter: 200, isActive: true, userName: "psvobodova", email: "petra.svobodova@zf.com", phone: "+420 555 002 002", mobile: "+420 777 002 002", position: "IT Manager", level: "L2", managerId: 1 },
    { id: 3, bisPersonalNumber: "CZ003", bisFirstName: "Martin", bisLastName: "Dvořák", department: "Montáž", costCenter: 110, isActive: true, userName: "mdvorak", email: "martin.dvorak@zf.com", phone: "+420 555 003 003", mobile: "+420 777 003 003", position: "Mistr směny", level: "L3", managerId: 1 },
    { id: 4, bisPersonalNumber: "CZ004", bisFirstName: "Eva", bisLastName: "Černá", department: "Kvalita", costCenter: 120, isActive: true, userName: "ecerna", email: "eva.cerna@zf.com", phone: "+420 555 004 004", mobile: "+420 777 004 004", position: "Inspektor kvality", level: "L4", managerId: 1 },
    { id: 5, bisPersonalNumber: "CZ005", bisFirstName: "Tomáš", bisLastName: "Procházka", department: "Sváření", costCenter: 130, isActive: true, userName: "tprochazka", email: "tomas.prochazka@zf.com", phone: "+420 555 005 005", mobile: "+420 777 005 005", position: "Svářeč senior", level: "L4", managerId: 3 },
    { id: 6, bisPersonalNumber: "CZ006", bisFirstName: "Lucie", bisLastName: "Veselá", department: "Logistika", costCenter: 140, isActive: true, userName: "lvesela", email: "lucie.vesela@zf.com", phone: "+420 555 006 006", mobile: "+420 777 006 006", position: "Koordinátor logistiky", level: "L3", managerId: 1 },
    { id: 7, bisPersonalNumber: "CZ007", bisFirstName: "Jiří", bisLastName: "Kučera", department: "Sklad", costCenter: 150, isActive: false, userName: "jkucera", email: "jiri.kucera@zf.com", phone: "+420 555 007 007", mobile: "+420 777 007 007", position: "Skladník", level: "L5", managerId: 6 },
    { id: 8, bisPersonalNumber: "CZ008", bisFirstName: "Markéta", bisLastName: "Horáková", department: "Balení", costCenter: null, isActive: true, userName: "mhorakova", email: "marketa.horakova@zf.com", phone: "+420 555 008 008", mobile: "+420 777 008 008", position: "Operátor balení", level: "L5", managerId: 6 },
    { id: 9, bisPersonalNumber: "CZ009", bisFirstName: "Pavel", bisLastName: "Marek", department: "Údržba", costCenter: 160, isActive: true, userName: "pmarek", email: "pavel.marek@zf.com", phone: "+420 555 009 009", mobile: "+420 777 009 009", position: "Technik údržby", level: "L4", managerId: 1 },
    { id: 10, bisPersonalNumber: "CZ010", bisFirstName: "Kateřina", bisLastName: "Pokorná", department: "Vývoj", costCenter: 170, isActive: true, userName: "kpokorna", email: "katerina.pokorna@zf.com", phone: "+420 555 010 010", mobile: "+420 777 010 010", position: "Vývojový inženýr", level: "L3", managerId: 1 },
    { id: 11, bisPersonalNumber: "CZ011", bisFirstName: "Ondřej", bisLastName: "Fiala", department: "Montáž", costCenter: 110, isActive: true, userName: "ofiala", email: "ondrej.fiala@zf.com", phone: "+420 555 011 011", mobile: "+420 777 011 011", position: "Operátor montáže", level: "L5", managerId: 3 },
    { id: 12, bisPersonalNumber: "CZ012", bisFirstName: "Tereza", bisLastName: "Nováková", department: "Lakovna", costCenter: 180, isActive: false, userName: "tnovakova", email: "tereza.novakova@zf.com", phone: "+420 555 012 012", mobile: "+420 777 012 012", position: "Lakýrník", level: "L5", managerId: 3 },
    { id: 13, bisPersonalNumber: "CZ013", bisFirstName: "David", bisLastName: "Jelínek", department: "IT", costCenter: 200, isActive: true, userName: "djelinek", email: "david.jelinek@zf.com", phone: "+420 555 013 013", mobile: "+420 777 013 013", position: "Systémový administrátor", level: "L4", managerId: 2 },
    { id: 14, bisPersonalNumber: "CZ014", bisFirstName: "Anna", bisLastName: "Kratochvílová", department: "Kvalita", costCenter: 120, isActive: true, userName: "akratochvilova", email: "anna.kratochvilova@zf.com", phone: "+420 555 014 014", mobile: "+420 777 014 014", position: "Technik kvality", level: "L4", managerId: 4 },
    { id: 15, bisPersonalNumber: "CZ015", bisFirstName: "Michal", bisLastName: "Šťastný", department: "Řízení výroby", costCenter: 190, isActive: true, userName: "mstastny", email: "michal.stastny@zf.com", phone: "+420 555 015 015", mobile: "+420 777 015 015", position: "Plánovač výroby", level: "L3", managerId: 1 },
    { id: 16, bisPersonalNumber: "CZ016", bisFirstName: "Barbora", bisLastName: "Říhová", department: "Montáž", costCenter: 110, isActive: true, userName: "brihova", email: "barbora.rihova@zf.com", phone: "+420 555 016 016", mobile: "+420 777 016 016", position: "Operátor montáže", level: "L5", managerId: 3 },
    { id: 17, bisPersonalNumber: "CZ017", bisFirstName: "Vladimír", bisLastName: "Beneš", department: "Sváření", costCenter: 130, isActive: false, userName: "vbenes", email: "vladimir.benes@zf.com", phone: "+420 555 017 017", mobile: "+420 777 017 017", position: "Svářeč", level: "L5", managerId: 5 },
    { id: 18, bisPersonalNumber: "CZ018", bisFirstName: "Simona", bisLastName: "Urbanová", department: "Logistika", costCenter: 140, isActive: true, userName: "surbanova", email: "simona.urbanova@zf.com", phone: "+420 555 018 018", mobile: "+420 777 018 018", position: "Disponent", level: "L4", managerId: 6 },
    { id: 19, bisPersonalNumber: "CZ019", bisFirstName: "Radek", bisLastName: "Kopecký", department: "Údržba", costCenter: 160, isActive: true, userName: "rkopecky", email: "radek.kopecky@zf.com", phone: "+420 555 019 019", mobile: "+420 777 019 019", position: "Elektrikář", level: "L5", managerId: 9 },
    { id: 20, bisPersonalNumber: "CZ020", bisFirstName: "Hana", bisLastName: "Vlčková", department: "Vývoj", costCenter: 170, isActive: true, userName: "hvlckova", email: "hana.vlckova@zf.com", phone: "+420 555 020 020", mobile: "+420 777 020 020", position: "Konstruktér", level: "L4", managerId: 10 },
];

/* ------------------------------------------------------------------ */
/*  Public query helpers (simulate database queries)                  */
/* ------------------------------------------------------------------ */

function toEmployee(u: RawUser): Employee {
    return {
        id: u.id,
        personalNumber: u.bisPersonalNumber,
        firstName: u.bisFirstName,
        lastName: u.bisLastName,
        department: u.department,
        costCenter: getCostCenterDisplay(u.id, u.costCenter, u.department),
        hiringDate: getHiringDate(u.id),
        isActive: u.isActive,
    };
}

export function getEmployees(
    search?: string,
    department?: string,
    status?: string
): Employee[] {
    let filtered = [...RAW_USERS];

    if (search) {
        const s = search.toLowerCase();
        filtered = filtered.filter(
            (u) =>
                u.bisFirstName.toLowerCase().includes(s) ||
                u.bisLastName.toLowerCase().includes(s) ||
                u.bisPersonalNumber.toLowerCase().includes(s)
        );
    }

    if (department) {
        filtered = filtered.filter((u) => u.department === department);
    }

    if (status === "true") {
        filtered = filtered.filter((u) => u.isActive);
    } else if (status === "false") {
        filtered = filtered.filter((u) => !u.isActive);
    }

    filtered.sort((a, b) => {
        const last = a.bisLastName.localeCompare(b.bisLastName, "cs");
        if (last !== 0) return last;
        return a.bisFirstName.localeCompare(b.bisFirstName, "cs");
    });

    return filtered.map(toEmployee);
}

export function getEmployeeDetail(
    personalNumber: string
): EmployeeDetail | null {
    const user = RAW_USERS.find((u) => u.bisPersonalNumber === personalNumber);
    if (!user) return null;

    const manager = user.managerId
        ? RAW_USERS.find((u) => u.id === user.managerId)
        : null;

    return {
        personalNumber: user.bisPersonalNumber,
        firstName: user.bisFirstName,
        lastName: user.bisLastName,
        userName: user.userName,
        email: user.email,
        phone: user.phone,
        mobile: user.mobile,
        department: user.department,
        position: user.position,
        level: user.level,
        isActive: user.isActive,
        managerName: manager
            ? `${manager.bisFirstName} ${manager.bisLastName}`
            : "—",
        positionHistory: [
            {
                position: user.position,
                department: user.department,
                startDate: getHiringDate(user.id),
                endDate: "dosud",
            },
        ],
    };
}

export function addEmployee(data: {
    personalNumber: string;
    firstName: string;
    lastName: string;
    department: string;
    costCenter: string | null;
    hiringDate: string | null;
    isActive: boolean;
}): Employee {
    const newId =
        RAW_USERS.length > 0 ? Math.max(...RAW_USERS.map((u) => u.id)) + 1 : 1;

    const newUser: RawUser = {
        id: newId,
        bisPersonalNumber: data.personalNumber,
        bisFirstName: data.firstName,
        bisLastName: data.lastName,
        department: data.department,
        costCenter: data.costCenter ? parseInt(data.costCenter, 10) || null : null,
        isActive: data.isActive,
        userName: `${data.firstName.toLowerCase().charAt(0)}${data.lastName.toLowerCase()}`,
        email: `${data.firstName.toLowerCase()}.${data.lastName.toLowerCase()}@zf.com`,
        phone: "+420 555 111 222",
        mobile: "+420 777 111 222",
        position: data.department === "Montáž" ? "Operátor montáže" : "Nový zaměstnanec",
        level: "L5",
        managerId: 1,
    };

    RAW_USERS.push(newUser);

    // Auto-generate records in other modules (synchronous – same module instance)
    generateInitialMedicalForEmployee(data.personalNumber, data.hiringDate);
    generateInitialTrainingsForEmployee(data.personalNumber, data.hiringDate);
    generateInitialOoppForEmployee(data.personalNumber, data.department, data.hiringDate);
    generateInitialIluoForEmployee(data.personalNumber, data.department);

    return toEmployee(newUser);
}
