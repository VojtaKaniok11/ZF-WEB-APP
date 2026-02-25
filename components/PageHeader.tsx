import { Users } from "lucide-react";

interface PageHeaderProps {
    title: string;
    description: string;
    count?: number;
}

export default function PageHeader({
    title,
    description,
    count,
}: PageHeaderProps) {
    return (
        <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/25">
                    <Users size={20} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                        {title}
                    </h1>
                    <p className="text-sm text-gray-500">{description}</p>
                </div>
            </div>
            {count !== undefined && (
                <div className="mt-4 flex items-center gap-2">
                    <span className="inline-flex items-center rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                        Celkem: {count} zaměstnanců
                    </span>
                </div>
            )}
        </div>
    );
}
