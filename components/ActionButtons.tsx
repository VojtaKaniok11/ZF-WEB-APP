import { Plus, Download } from "lucide-react";

interface ActionButtonsProps {
    onAdd: () => void;
    onExport: () => void;
}

export default function ActionButtons({ onAdd, onExport }: ActionButtonsProps) {
    return (
        <div className="mb-6 flex flex-wrap items-center gap-3">
            <button
                onClick={onAdd}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700 hover:shadow-blue-700/30 active:scale-[0.98]"
            >
                <Plus size={18} />
                Přidat zaměstnance
            </button>
            <button
                onClick={onExport}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:border-gray-400 active:scale-[0.98]"
            >
                <Download size={18} />
                Export
            </button>
        </div>
    );
}
