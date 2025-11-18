
import React, { useState } from 'react';

interface FilterModalProps {
    type: 'day' | 'month';
    onClose: () => void;
    onApply: (value: string) => void;
}

const FilterModal: React.FC<FilterModalProps> = ({ type, onClose, onApply }) => {
    const [value, setValue] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(value) {
            onApply(value);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-slate-800 mb-4">
                    Filtrar por {type === 'day' ? 'Dia' : 'Mês'}
                </h3>
                <form onSubmit={handleSubmit}>
                    <p className="text-slate-600 mb-4">
                        Selecione {type === 'day' ? 'o dia' : 'o mês e o ano'} desejado.
                    </p>
                    <input
                        type={type === 'day' ? 'date' : 'month'}
                        value={value}
                        onChange={e => setValue(e.target.value)}
                        className="w-full p-2 border rounded-md bg-white border-slate-300"
                        autoFocus
                        required
                    />
                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-slate-200 text-slate-800 hover:bg-slate-300">
                            Cancelar
                        </button>
                        <button type="submit" className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700">
                            Aplicar Filtro
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FilterModal;
