import { Plus } from "lucide-react";

interface ActionButtonsProps {
    onAdd: () => void;
    count?: number;
}

export default function ActionButtons({ onAdd, count }: ActionButtonsProps) {
    return (
        <div className="mb-6 flex flex-wrap items-center gap-6">
            <button
                onClick={onAdd}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700 hover:shadow-blue-700/30 active:scale-[0.98]"
            >
                <Plus size={18} />
                Přidat zaměstnance
            </button>
            {count !== undefined && (
                <span className="inline-flex items-center rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                    Celkem: {count} zaměstnanců
                </span>
            )}
        </div>
    );
}
