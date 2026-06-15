"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { getApiUrl } from "@/lib/constants";

interface User {
    id: number;
    personalNumber: string;
    firstName: string;
    lastName: string;
    department: string;
    userName: string;
    displayName: string;
    roles?: string[];
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (personalNumber: string, password: string) => Promise<{ success: boolean; message?: string }>;
    changePassword: (newPassword: string) => Promise<{ success: boolean; message?: string }>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        try {
            const stored = typeof window !== "undefined" ? localStorage.getItem("hr_user") : null;
            if (stored) {
                try {
                    setUser(JSON.parse(stored));
                } catch {
                    localStorage.removeItem("hr_user");
                }
            }
        } catch (e) {
            console.error("Auth: Error accessing localStorage", e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const login = async (personalNumber: string, password: string) => {
        try {
            const res = await fetch(`${getApiUrl()}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ personalNumber, password }),
            });
            const json = await res.json();

            if (json.success) {
                setUser(json.data);
                localStorage.setItem("hr_user", JSON.stringify(json.data));
                return { success: true };
            }
            return { success: false, message: json.message ?? "Přihlášení selhalo." };
        } catch {
            return { success: false, message: "Nelze se připojit k serveru." };
        }
    };

    const changePassword = async (newPassword: string) => {
        if (!user) return { success: false, message: "Musíte být přihlášeni." };
        try {
            const res = await fetch(`${getApiUrl()}/auth/change-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: user.id, newPassword }),
            });
            const json = await res.json();
            return { success: json.success, message: json.message };
        } catch {
            return { success: false, message: "Chyba při komunikaci se serverem." };
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem("hr_user");
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout, changePassword }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
    return ctx;
}
