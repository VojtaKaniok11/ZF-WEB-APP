"use client";

import { Suspense } from "react";
import ClientPage from "./ClientPage";

export default function Page() {
    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-gray-400">Načítám ILUO...</div>}>
            <ClientPage />
        </Suspense>
    );
}
