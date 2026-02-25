interface ExpirationBadgeProps {
    status: "valid" | "expiring_soon" | "expired" | "issued" | "eligible_soon" | "eligible";
}

const CONFIG: Record<ExpirationBadgeProps["status"], { label: string; classes: string }> = {
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
};

export default function ExpirationBadge({ status }: ExpirationBadgeProps) {
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
