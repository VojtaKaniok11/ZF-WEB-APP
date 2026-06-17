type BadgeStatus = "valid" | "expiring_soon" | "expired" | "issued" | "eligible_soon" | "eligible" | "inactive";

interface ExpirationBadgeProps {
    // "superseded" = záznam nahrazený novější variantou téže prohlídky (jiná perioda) → zobrazí se jen "—"
    status: BadgeStatus | "superseded";
}

const CONFIG: Record<BadgeStatus, { label: string; classes: string }> = {
    valid: {
        label: "Platné",
        classes: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    },
    expiring_soon: {
        label: "Brzy vyprší",
        classes: "bg-amber-50 text-amber-700 ring-amber-600/20",
    },
    expired: {
        label: "Propadlé",
        classes: "bg-red-50 text-red-700 ring-red-600/20",
    },
    issued: {
        label: "Vydáno",
        classes: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    },
    eligible_soon: {
        label: "Brzy nárok",
        classes: "bg-amber-50 text-amber-700 ring-amber-600/20",
    },
    eligible: {
        label: "Má nárok",
        classes: "bg-blue-50 text-blue-700 ring-blue-600/20",
    },
    // Školení absolvované, ale v databázi deaktivované (Akt_skol = 0) – není propadlé, jen neaktivní
    inactive: {
        label: "0",
        classes: "bg-gray-100 text-gray-600 ring-gray-500/20",
    },
};

export default function ExpirationBadge({ status }: ExpirationBadgeProps) {
    // Nahrazená (starší) perioda téže prohlídky – jen pomlčka, žádný stav.
    if (status === "superseded") {
        return <span className="text-gray-300" title="Nahrazeno novější prohlídkou">—</span>;
    }

    const { label, classes } = CONFIG[status];
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${classes}`}
        >
            <span
                className={`h-1.5 w-1.5 rounded-full ${status === "expired" || status === "eligible"
                        ? "bg-current animate-pulse"
                        : "bg-current"
                    }`}
            />
            {label}
        </span>
    );
}
