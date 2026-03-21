import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

interface CategoryManagerModalProps {
    title: string;
    items: string[];
    onSave: (newItems: string[]) => void;
    onClose: () => void;
}

export function CategoryManagerModal({ title, items, onSave, onClose }: CategoryManagerModalProps) {
    const [localItems, setLocalItems] = useState<string[]>([...items]);

    const handleItemChange = (index: number, value: string) => {
        const newItems = [...localItems];
        newItems[index] = value;
        setLocalItems(newItems);
    };

    const handleRemoveItem = (index: number) => {
        const newItems = localItems.filter((_, i) => i !== index);
        setLocalItems(newItems);
    };

    const handleAddItem = () => {
        setLocalItems([...localItems, 'Nova Opção']);
    };

    const handleSave = () => {
        // Filtrar itens vazios antes de salvar e remover duplicados
        const filtered = localItems
            .map(item => item.trim())
            .filter(item => item !== '');

        const unique = Array.from(new Set(filtered));
        onSave(unique);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="relative w-full max-w-md bg-white border border-[#dde3ee] rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-[#dde3ee] bg-[#f8fafc] flex-shrink-0">
                    <div>
                        <h2 className="text-base font-bold text-[#0f1f30]">{title}</h2>
                        <p className="text-xs text-[#8fa5b8] mt-0.5">Gerencie as opções do menu suspenso</p>
                    </div>
                    <button onClick={onClose} title="Fechar (Esc)" className="p-2 rounded-lg text-[#8fa5b8] hover:text-[#1e2d40] hover:bg-[#eef2f7]">
                        <X size={20} />
                    </button>
                </div>

                {/* Body (List of items) */}
                <div className="p-6 overflow-y-auto flex-1 space-y-3 bg-[#fbfcfd]">
                    {localItems.map((item, index) => (
                        <div key={index} className="flex gap-2 items-center group">
                            <input
                                autoFocus={item === 'Nova Opção'}
                                type="text"
                                value={item}
                                onChange={(e) => handleItemChange(index, e.target.value)}
                                className="flex-1 px-3 py-2 text-sm bg-white border border-[#dde3ee] rounded-lg text-[#0f1f30] focus:outline-none focus:border-[#4a90d9] focus:ring-2 focus:ring-[#4a90d9]/20 transition-all"
                            />
                            <button
                                onClick={() => handleRemoveItem(index)}
                                title="Excluir item"
                                className="p-2 text-[#8fa5b8] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}

                    {localItems.length === 0 && (
                        <p className="text-sm text-[#8fa5b8] text-center py-4">A lista está vazia.</p>
                    )}

                    <button
                        onClick={handleAddItem}
                        className="w-full flex items-center justify-center gap-2 py-3 mt-4 text-sm font-semibold text-[#4a90d9] hover:text-[#3a7bc8] hover:bg-[#eef2f7] rounded-xl transition-all border border-dashed border-[#c5dff5]"
                    >
                        <Plus size={16} /> Adicionar Opção
                    </button>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#dde3ee] bg-white flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 text-sm font-semibold text-[#4a5568] hover:bg-[#f1f5f9] rounded-xl transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-5 py-2.5 text-sm font-semibold text-white bg-[#4a90d9] hover:bg-[#3a7bc8] rounded-xl shadow-md transition-colors"
                    >
                        Concluído
                    </button>
                </div>
            </div>
        </div>
    );
}
