
import React, { useState, useMemo } from 'react';
import { View, Transaction, Patient } from '../types';
import ModuleContainer from './ModuleContainer';
import { formatCurrency, parseCurrency } from '../utils/formatting';
import FilterModal from './FilterModal';

interface FinancialModuleProps {
    onNavigate: (view: View) => void;
    transactions: Transaction[];
    setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
    filteredPatient: Patient | null;
    onClearPatientFilter: () => void;
}

const FinancialModule: React.FC<FinancialModuleProps> = ({ onNavigate, transactions, setTransactions, filteredPatient, onClearPatientFilter }) => {
    const [newTransaction, setNewTransaction] = useState({ description: '', amount: '', type: 'income' as 'income' | 'expense', date: new Date().toISOString().split('T')[0]});
    const [formError, setFormError] = useState('');
    
    const [filterDate, setFilterDate] = useState('');
    const [filterMonth, setFilterMonth] = useState('');
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [filterModalType, setFilterModalType] = useState<'day' | 'month'>('day');

    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            if (filteredPatient && t.patientId !== filteredPatient.id) return false;
            if (filterDate && t.date !== filterDate) return false;
            if (filterMonth) {
                const transactionMonth = t.date.substring(0, 7); // YYYY-MM format
                if (transactionMonth !== filterMonth) return false;
            }
            return true;
        });
    }, [transactions, filteredPatient, filterDate, filterMonth]);

    const balance = useMemo(() => filteredTransactions.reduce((acc, t) => acc + (t.type === 'income' ? t.amount : -t.amount), 0), [filteredTransactions]);
    const income = useMemo(() => filteredTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0), [filteredTransactions]);
    const expense = useMemo(() => filteredTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0), [filteredTransactions]);
    
    const handleClearFilters = () => {
        setFilterDate('');
        setFilterMonth('');
        onClearPatientFilter();
    };

    const handleOpenFilterModal = (type: 'day' | 'month') => {
        setFilterModalType(type);
        setIsFilterModalOpen(true);
    };

    const handleApplyFilter = (value: string) => {
        if(filterModalType === 'day') {
            setFilterDate(value);
            setFilterMonth('');
        } else {
            setFilterMonth(value);
            setFilterDate('');
        }
        setIsFilterModalOpen(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'amount') {
          setNewTransaction(prev => ({...prev, amount: formatCurrency(value)}));
        } else {
          setNewTransaction(prev => ({...prev, [name]: value}));
        }
    };

    const handleAddTransaction = (e: React.FormEvent) => {
        e.preventDefault();
        const amountNumber = parseCurrency(newTransaction.amount);
        if(!newTransaction.description || isNaN(amountNumber) || amountNumber <= 0) {
            setFormError('Descrição e valor (positivo) são obrigatórios.');
            return;
        }

        const transaction: Transaction = {
            id: `t${Date.now()}`,
            description: newTransaction.description,
            amount: amountNumber,
            type: newTransaction.type,
            date: newTransaction.date,
        };
        
        setTransactions(prev => [...prev, transaction]);
        setNewTransaction({ description: '', amount: '', type: 'income', date: new Date().toISOString().split('T')[0] });
        setFormError('');
    };

  return (
    <ModuleContainer title="Módulo Financeiro" onBack={() => onNavigate('dashboard')}>
      {isFilterModalOpen && (
          <FilterModal 
            type={filterModalType}
            onClose={() => setIsFilterModalOpen(false)}
            onApply={handleApplyFilter}
          />
      )}
      
      {filteredPatient && (
        <div className="bg-indigo-100 border-l-4 border-indigo-500 text-indigo-800 p-4 mb-6 rounded-md shadow-sm relative" role="alert">
            <div className="flex justify-between items-center">
                <p>Mostrando transações apenas para o paciente: <span className="font-bold">{filteredPatient.name}</span></p>
                <button onClick={onClearPatientFilter} className="font-semibold hover:underline text-sm">Limpar Filtro</button>
            </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-emerald-100 p-4 rounded-lg text-center">
            <h4 className="text-sm font-semibold text-emerald-800">Receitas</h4>
            <p className="text-2xl font-bold text-emerald-900">
                {income.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
        </div>
        <div className="bg-rose-100 p-4 rounded-lg text-center">
            <h4 className="text-sm font-semibold text-rose-800">Despesas</h4>
            <p className="text-2xl font-bold text-rose-900">
                {expense.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
        </div>
        <div className="bg-violet-100 p-4 rounded-lg text-center">
            <h4 className="text-sm font-semibold text-violet-800">Saldo</h4>
            <p className={`text-2xl font-bold ${balance >= 0 ? 'text-violet-900' : 'text-rose-900'}`}>
                {balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 mb-8">
            <h3 className="text-lg font-semibold mb-4 text-slate-700">Filtrar Transações</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                <button onClick={() => handleOpenFilterModal('day')} className="w-full bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-md hover:bg-slate-50 h-10">Filtrar por Dia</button>
                <button onClick={() => handleOpenFilterModal('month')} className="w-full bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-md hover:bg-slate-50 h-10">Filtrar por Mês</button>
                <button onClick={handleClearFilters} className="w-full bg-slate-200 text-slate-800 px-4 py-2 rounded-md hover:bg-slate-300 h-10">Limpar Filtros</button>
            </div>
             <div className="text-sm text-slate-500 mt-3">
              {(filterDate || filterMonth) && (
                <p>
                  Filtro ativo: {filterDate ? new Date(filterDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : ''}
                  {filterMonth ? new Date(filterMonth + '-02').toLocaleDateString('pt-BR', {month: 'long', year: 'numeric', timeZone: 'UTC'}) : ''}
                </p>
              )}
            </div>
      </div>
      
       <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 mb-8">
            <h3 className="text-lg font-semibold mb-4 text-slate-700">Adicionar Transação</h3>
            <form onSubmit={handleAddTransaction} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-600 mb-1">Descrição</label>
                    <input type="text" name="description" value={newTransaction.description} onChange={handleInputChange} className="w-full p-2 border rounded-md bg-white border-slate-300" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Valor (R$)</label>
                    <input type="text" name="amount" placeholder="R$ 0,00" value={newTransaction.amount} onChange={handleInputChange} className="w-full p-2 border rounded-md bg-white border-slate-300" />
                </div>
                <div className="flex items-end gap-2">
                    <div className="flex-grow">
                        <label className="block text-sm font-medium text-slate-600 mb-1">Tipo</label>
                        <select name="type" value={newTransaction.type} onChange={handleInputChange} className="w-full p-2 border rounded-md bg-white border-slate-300">
                            <option value="income">Receita</option>
                            <option value="expense">Despesa</option>
                        </select>
                    </div>
                    <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 h-10">Adicionar</button>
                </div>
            </form>
             {formError && <p className="text-red-500 text-sm mt-2">{formError}</p>}
        </div>

      <div className="overflow-x-auto">
        <h3 className="text-lg font-semibold text-slate-700 mb-4">Histórico de Transações</h3>
        <table className="min-w-full bg-white border border-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-slate-600">Data</th>
              <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-slate-600">Descrição</th>
              <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-slate-600">Valor</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.length > 0 ? [...filteredTransactions].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(t => (
                <tr key={t.id} className="border-b border-slate-200">
                    <td className="py-3 px-4 text-sm text-slate-500">{new Date(t.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</td>
                    <td className="py-3 px-4">{t.description}</td>
                    <td className={`py-3 px-4 font-semibold ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {(t.type === 'income' ? t.amount : -t.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                </tr>
            )) : (
              <tr>
                <td colSpan={3} className="text-center py-10 text-slate-500">Nenhuma transação encontrada para os filtros aplicados.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </ModuleContainer>
  );
};

export default FinancialModule;
