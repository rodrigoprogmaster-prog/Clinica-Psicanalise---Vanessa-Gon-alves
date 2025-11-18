import React, { useState, useMemo } from 'react';
import { View, Transaction } from '../types';
import ModuleContainer from './ModuleContainer';

interface FinancialModuleProps {
    onNavigate: (view: View) => void;
    transactions: Transaction[];
    setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
}

const FinancialModule: React.FC<FinancialModuleProps> = ({ onNavigate, transactions, setTransactions }) => {
    const [newTransaction, setNewTransaction] = useState({ description: '', amount: '', type: 'income' as 'income' | 'expense', date: new Date().toISOString().split('T')[0]});
    const [formError, setFormError] = useState('');

    const balance = useMemo(() => transactions.reduce((acc, t) => acc + (t.type === 'income' ? t.amount : -t.amount), 0), [transactions]);
    const income = useMemo(() => transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0), [transactions]);
    const expense = useMemo(() => transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0), [transactions]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setNewTransaction(prev => ({...prev, [name]: value}));
    };

    const handleAddTransaction = (e: React.FormEvent) => {
        e.preventDefault();
        const amountNumber = parseFloat(newTransaction.amount);
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-emerald-100 p-4 rounded-lg text-center">
            <h4 className="text-sm font-semibold text-emerald-800">Receitas Totais</h4>
            <p className="text-2xl font-bold text-emerald-900">
                {income.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
        </div>
        <div className="bg-rose-100 p-4 rounded-lg text-center">
            <h4 className="text-sm font-semibold text-rose-800">Despesas Totais</h4>
            <p className="text-2xl font-bold text-rose-900">
                {expense.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
        </div>
        <div className="bg-violet-100 p-4 rounded-lg text-center">
            <h4 className="text-sm font-semibold text-violet-800">Saldo Atual</h4>
            <p className={`text-2xl font-bold ${balance >= 0 ? 'text-violet-900' : 'text-rose-900'}`}>
                {balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
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
                    <input type="number" name="amount" step="0.01" value={newTransaction.amount} onChange={handleInputChange} className="w-full p-2 border rounded-md bg-white border-slate-300" />
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
            {transactions.length > 0 ? [...transactions].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(t => (
                <tr key={t.id} className="border-b border-slate-200">
                    <td className="py-3 px-4 text-sm text-slate-500">{new Date(t.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</td>
                    <td className="py-3 px-4">{t.description}</td>
                    <td className={`py-3 px-4 font-semibold ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {(t.type === 'income' ? t.amount : -t.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                </tr>
            )) : (
              <tr>
                <td colSpan={3} className="text-center py-10 text-slate-500">Nenhuma transação registrada.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </ModuleContainer>
  );
};

export default FinancialModule;