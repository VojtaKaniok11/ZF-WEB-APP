interface StatusBadgeProps {
    isActive: boolean;
}

export default function StatusBadge({ isActive }: StatusBadgeProps) {
    return isActive ? (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Aktivní
        </span>
    ) : (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-600/20">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
            Neaktivní
        </span>
    );
}
