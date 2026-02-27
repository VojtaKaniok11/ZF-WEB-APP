import { Users } from "lucide-react";

interface PageHeaderProps {
    title: string;
    description: string;
}

export default function PageHeader({
    title,
    description,
}: PageHeaderProps) {
    return (
        <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/25">
                    <Users size={20} />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                        {title}
                    </h1>
                    <p className="text-sm text-gray-500">{description}</p>
                </div>
            </div>
        </div>
    );
}
