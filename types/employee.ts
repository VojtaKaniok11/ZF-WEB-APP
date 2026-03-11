export interface Employee {
    id: number;
    personalNumber: string;
    firstName: string;
    lastName: string;
    department: string;
    costCenter: string;
    hiringDate: string | null;
    isActive: boolean;
    hasWashingProgram: boolean;
}

export interface PositionHistoryItem {
    position: string;
    department: string;
    startDate: string;
    endDate: string;
}

export interface EmployeeDetail {
    personalNumber: string;
    firstName: string;
    lastName: string;
    userName: string;
    email: string;
    phone: string;
    mobile: string;
    department: string;
    position: string;
    level: string;
    isActive: boolean;
    managerName: string;
    positionHistory: PositionHistoryItem[];
}

export interface NewEmployeePayload {
    personalNumber: string;
    firstName: string;
    lastName: string;
    department: string;
    costCenter: string | null;
    hiringDate: string | null;
    isActive: boolean;
    phone: string;
    email: string;
    position: string;
    level: string;
    managerName: string;
    workcenter: string;
    bisOsobaId: string;
}
