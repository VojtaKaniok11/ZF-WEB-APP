import { Plus } from "lucide-react";

interface ActionButtonsProps {
    count?: number;
    onAddClick?: () => void;
}

export default function ActionButtons({ count, onAddClick }: ActionButtonsProps) {
    return (
        <div className="mb-6 flex flex-wrap items-center gap-6">
            {count !== undefined && (
                <span className="inline-flex items-center rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 transition-all hover:bg-blue-100">
                    Nalezeno: {count} zaměstnanců
                </span>
            )}
            {onAddClick && (
                <button
                    onClick={onAddClick}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 active:bg-blue-800"
                >
                    <Plus size={18} />
                    Přidat zaměstnance
                </button>
            )}
        </div>
    );
}
