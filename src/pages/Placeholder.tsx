import { Construction } from 'lucide-react';

interface PlaceholderProps {
    title: string;
    description: string;
}

export function Placeholder({ title, description }: PlaceholderProps) {
    return (
        <div className="p-6 flex-1 flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#e8f3fd] flex items-center justify-center mb-4">
                <Construction size={28} className="text-[#4a90d9]" />
            </div>
            <h2 className="text-lg font-bold text-[#1e2d40] mb-2">{title}</h2>
            <p className="text-sm text-[#4a6075] max-w-sm leading-relaxed">{description}</p>
            <div className="mt-6 px-4 py-2 bg-[#f8fafc] border border-[#dde3ee] rounded-lg text-xs text-[#8fa5b8]">
                🚧 Em desenvolvimento
            </div>
        </div>
    );
}
