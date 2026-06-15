import { Download, Plus } from "lucide-react";

interface ActionButtonsProps {
    count?: number;
    onExport?: () => void;
    isExporting?: boolean;
    onAddEmployee?: () => void;
}

export default function ActionButtons({ count, onExport, isExporting, onAddEmployee }: ActionButtonsProps) {
    return (
        <div className="mb-6 flex flex-wrap items-center gap-4">
            {count !== undefined && (
                <span className="inline-flex items-center rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 transition-all hover:bg-blue-100">
                    Nalezeno: {count} zaměstnanců
                </span>
            )}
            {onExport && (
                <button
                    onClick={onExport}
                    disabled={isExporting}
                    className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-green-700 active:bg-green-800 disabled:opacity-50"
                >
                    <Download size={16} />
                    {isExporting ? "Exportuji..." : "Exportovat do Excelu"}
                </button>
            )}
            {onAddEmployee && (
                <button
                    onClick={onAddEmployee}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 active:bg-blue-800 hover:shadow-md active:scale-95 duration-150"
                >
                    <Plus size={16} />
                    Přidat zaměstnance
                </button>
            )}
        </div>
    );
}
