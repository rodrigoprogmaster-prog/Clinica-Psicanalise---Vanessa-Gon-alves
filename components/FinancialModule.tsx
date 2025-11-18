import React, { useState, useMemo } from 'react';
import { View, Transaction, Patient } from '../types';
import ModuleContainer from './ModuleContainer';
import { formatCurrency, parseCurrency } from '../utils/formatting';
import PlusIcon from './icons/PlusIcon';
import FilterIcon from './icons/FilterIcon';
import CloseIcon from './icons/CloseIcon';

interface FinancialModuleProps {
    onNavigate: (view: View) => void;
    transactions: Transaction[];
    setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
    filteredPatient: Patient | null;
    onClearPatientFilter: () => void;
}

const Tooltip: React.FC<{ text: string }> = ({ text }) => (
  <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-max max-w-xs p-2 text-xs text-white bg-slate-700 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
    {text}
    <svg className="absolute text-slate-700 h-2 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255">
      <polygon className="fill-current" points="0,0 127.5,127.5 255,0"/>
    </svg>
  </span>
);

const FinancialModule: React.FC<FinancialModuleProps> = ({ onNavigate, transactions, setTransactions, filteredPatient, onClearPatientFilter }) => {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

    const [newTransaction, setNewTransaction] = useState({ description: '', amount: '', type: 'income' as 'income' | 'expense', date: new Date().toISOString().split('T')[0]});
    const [formError, setFormError] = useState('');
    
    const [filterDate, setFilterDate] = useState('');
    const [filterMonth, setFilterMonth] = useState('');
    
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
    
    const handleClearAllFilters = () => {
        setFilterDate('');
        setFilterMonth('');
        onClearPatientFilter();
        setIsFilterModalOpen(false);
    };

    const handleApplyFilter = (day: string, month: string) => {
      setFilterDate(day);
      setFilterMonth(month);
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
        setIsAddModalOpen(false);
    };

    const moduleActions = (
      <>
        <div className="group relative">
          <button onClick={() => setIsAddModalOpen(true)} className="p-2 rounded-full text-slate-600 hover:bg-slate-100 transition-colors" aria-label="Adicionar Transação">
            <PlusIcon />
          </button>
          <Tooltip text="Adicionar Transação" />
        </div>
        <div className="group relative">
          <button onClick={() => setIsFilterModalOpen(true)} className="p-2 rounded-full text-slate-600 hover:bg-slate-100 transition-colors" aria-label="Filtrar Transações">
            <FilterIcon />
          </button>
          <Tooltip text="Filtrar Transações" />
        </div>
      </>
    );

  return (
    <ModuleContainer title="Módulo Financeiro" onBack={() => onNavigate('dashboard')} actions={moduleActions}>
      {isAddModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 animate-fade-in" onClick={() => setIsAddModalOpen(false)}>
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-slate-800">Adicionar Nova Transação</h3>
                <button onClick={() => setIsAddModalOpen(false)} className="p-1 rounded-full hover:bg-slate-100"><CloseIcon/></button>
              </div>
              <form onSubmit={handleAddTransaction} className="space-y-4">
                  <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">Descrição</label>
                      <input type="text" name="description" value={newTransaction.description} onChange={handleInputChange} className="w-full p-2 border rounded-md bg-white border-slate-300" autoFocus/>
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">Data</label>
                      <input type="date" name="date" value={newTransaction.date} onChange={handleInputChange} className="w-full p-2 border rounded-md bg-white border-slate-300"/>
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">Valor (R$)</label>
                      <input type="text" name="amount" placeholder="R$ 0,00" value={newTransaction.amount} onChange={handleInputChange} className="w-full p-2 border rounded-md bg-white border-slate-300" />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">Tipo</label>
                      <select name="type" value={newTransaction.type} onChange={handleInputChange} className="w-full p-2 border rounded-md bg-white border-slate-300">
                          <option value="income">Receita</option>
                          <option value="expense">Despesa</option>
                      </select>
                  </div>
                   {formError && <p className="text-red-500 text-sm">{formError}</p>}
                   <div className="flex justify-end gap-3 pt-4">
                     <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 rounded-md bg-slate-200 text-slate-800 hover:bg-slate-300">Cancelar</button>
                     <button type="submit" className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700">Adicionar</button>
                   </div>
              </form>
            </div>
          </div>
      )}

      {isFilterModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 animate-fade-in" onClick={() => setIsFilterModalOpen(false)}>
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-slate-800">Filtrar Transações</h3>
                 <button onClick={() => setIsFilterModalOpen(false)} className="p-1 rounded-full hover:bg-slate-100"><CloseIcon/></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Filtrar por Dia</label>
                  <input type="date" value={filterDate} onChange={e => handleApplyFilter(e.target.value, '')} className="w-full p-2 border rounded-md bg-white border-slate-300" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Filtrar por Mês</label>
                  <input type="month" value={filterMonth} onChange={e => handleApplyFilter('', e.target.value)} className="w-full p-2 border rounded-md bg-white border-slate-300" />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={handleClearAllFilters} className="px-4 py-2 rounded-md bg-rose-100 text-rose-800 hover:bg-rose-200">Limpar Filtros</button>
                  <button type="button" onClick={() => setIsFilterModalOpen(false)} className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700">Fechar</button>
                </div>
              </div>
            </div>
          </div>
      )}
      
      {filteredPatient && (
        <div className="bg-indigo-100 border-l-4 border-indigo-500 text-indigo-800 p-4 mb-6 rounded-md shadow-sm relative" role="alert">
            <div className="flex justify-between items-center">
                <p>Mostrando transações apenas para o paciente: <span className="font-bold">{filteredPatient.name}</span></p>
                <button onClick={onClearPatientFilter} className="font-semibold hover:underline text-sm">Limpar Filtro de Paciente</button>
            </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-emerald-100 p-4 rounded-lg text-center">
            <h4 className="text-sm font-semibold text-emerald-800">Receitas</h4>
            <p className="text-2xl font-bold text-emerald-900">{income.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
        </div>
        <div className="bg-rose-100 p-4 rounded-lg text-center">
            <h4 className="text-sm font-semibold text-rose-800">Despesas</h4>
            <p className="text-2xl font-bold text-rose-900">{expense.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
        </div>
        <div className="bg-violet-100 p-4 rounded-lg text-center">
            <h4 className="text-sm font-semibold text-violet-800">Saldo</h4>
            <p className={`text-2xl font-bold ${balance >= 0 ? 'text-violet-900' : 'text-rose-900'}`}>{balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
        </div>
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
                    <td className={`py-3 px-4 font-semibold ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>{(t.type === 'income' ? t.amount : -t.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
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