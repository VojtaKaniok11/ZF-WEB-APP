export interface Employee {
    id: number;
    personalNumber: string;
    firstName: string;
    lastName: string;
    department: string;
    costCenter: string;
    workcenter: string;
    workcenterName: string;
    category: string;
    costNumber: string;
    costNumberDesc: string;
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
    workcenter: string;
    workcenterName: string;
    workcenterLabel: string;
    isActive: boolean;
    managerName: string;
    category?: string;
    costCenter?: string;
    costCenterLabel?: string;
    positionHistory: PositionHistoryItem[];
}

export interface NewEmployeePayload {
    personalNumber: string;
    firstName: string;
    lastName: string;
    department: string;
    costCenter: string | null;
    category?: string;
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

