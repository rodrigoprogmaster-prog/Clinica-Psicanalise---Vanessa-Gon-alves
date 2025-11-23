import React, { useState, useMemo, useEffect } from 'react';
import { View, Transaction, Patient } from '../types';
import ModuleContainer from './ModuleContainer';
import TrashIcon from './icons/TrashIcon';
import EditIcon from './icons/EditIcon';
import FileTextIcon from './icons/FileTextIcon';
import CloseIcon from './icons/CloseIcon';
import PrintIcon from './icons/PrintIcon';
import Skeleton from './Skeleton';
import { formatCurrency, parseCurrency } from '../utils/formatting';

interface FinancialModuleProps {
  onNavigate: (view: View) => void;
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  filteredPatient: Patient | null;
  onClearPatientFilter: () => void;
  onLogAction: (action: string, details: string) => void;
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
  patients: Patient[];
  signatureImage?: string | null;
}

const FinancialModule: React.FC<FinancialModuleProps> = ({
  onNavigate,
  transactions,
  setTransactions,
  filteredPatient,
  onClearPatientFilter,
  onLogAction,
  onShowToast,
  patients,
  signatureImage
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [currentTransaction, setCurrentTransaction] = useState<Partial<Transaction>>({
    description: '',
    amount: 0,
    type: 'income',
    date: new Date().toISOString().split('T')[0],
    patientId: ''
  });
  const [amountInput, setAmountInput] = useState('');
  
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesPatient = filteredPatient ? t.patientId === filteredPatient.id : true;
      const matchesType = filterType === 'all' ? true : t.type === filterType;
      const matchesMonth = filterMonth ? t.date.startsWith(filterMonth) : true;
      return matchesPatient && matchesType && matchesMonth;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, filteredPatient, filterType, filterMonth]);

  const summary = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    return { income, expense, balance: income - expense };
  }, [filteredTransactions]);

  const handleOpenAddModal = () => {
    setModalMode('add');
    setCurrentTransaction({
      description: '',
      amount: 0,
      type: 'income',
      date: new Date().toISOString().split('T')[0],
      patientId: filteredPatient ? filteredPatient.id : ''
    });
    setAmountInput('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (t: Transaction) => {
    setModalMode('edit');
    setCurrentTransaction(t);
    setAmountInput(t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
    setIsModalOpen(true);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmountInput(formatCurrency(value));
  };

  const handleSaveTransaction = () => {
    const amount = parseCurrency(amountInput);
    if (!currentTransaction.description?.trim()) {
      onShowToast('Descrição é obrigatória.', 'error');
      return;
    }
    if (amount <= 0) {
      onShowToast('Valor inválido.', 'error');
      return;
    }
    if (!currentTransaction.date) {
      onShowToast('Data é obrigatória.', 'error');
      return;
    }

    if (modalMode === 'add') {
      const newT: Transaction = {
        id: `t${Date.now()}`,
        description: currentTransaction.description,
        amount,
        type: currentTransaction.type as 'income' | 'expense',
        date: currentTransaction.date,
        patientId: currentTransaction.patientId || undefined
      };
      setTransactions(prev => [newT, ...prev]);
      onLogAction('Transação Criada', `${newT.type === 'income' ? 'Receita' : 'Despesa'}: ${newT.description} - ${amount}`);
      onShowToast('Transação adicionada com sucesso.', 'success');
    } else if (currentTransaction.id) {
      setTransactions(prev => prev.map(t => t.id === currentTransaction.id ? {
        ...t,
        description: currentTransaction.description!,
        amount,
        type: currentTransaction.type as 'income' | 'expense',
        date: currentTransaction.date!,
        patientId: currentTransaction.patientId || undefined
      } : t));
      onLogAction('Transação Editada', `ID: ${currentTransaction.id}`);
      onShowToast('Transação atualizada.', 'success');
    }
    setIsModalOpen(false);
  };

  const handleDeleteTransaction = () => {
    if (transactionToDelete) {
      setTransactions(prev => prev.filter(t => t.id !== transactionToDelete.id));
      onLogAction('Transação Excluída', `ID: ${transactionToDelete.id} - ${transactionToDelete.description}`);
      onShowToast('Transação removida.', 'info');
      setTransactionToDelete(null);
    }
  };

  const handlePrintReceipt = (t: Transaction) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        const todayString = new Date().toISOString().slice(0, 10);
        printWindow.document.title = `Recibo - ${t.description} - ${todayString}`;
        
        const signatureContent = signatureImage 
          ? `<img src="${signatureImage}" class="sig-img" alt="Assinatura" />` 
          : `<div class="line"></div>`;

        const styles = `
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
          body { font-family: 'Inter', sans-serif; margin: 0; padding: 0; color: #444; min-height: 100vh; display: flex; justify-content: center; align-items: center; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .receipt-container { width: 80%; max-width: 700px; border: 2px solid #3730a3; padding: 40px; background-color: rgba(255, 255, 255, 0.95); }
          .header { text-align: center; border-bottom: 1px solid #ddd; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { color: #3730a3; margin: 0; font-size: 28px; letter-spacing: 2px; }
          .content { font-size: 16px; line-height: 2; }
          .signature { margin-top: 60px; text-align: center; }
          .line { border-top: 1px solid #333; width: 60%; margin: 0 auto 10px auto; }
          .sig-img { max-height: 80px; display: block; margin: 0 auto 5px auto; max-width: 200px; }
        `;
        const reportHTML = `
          <html><head><title>Recibo</title><style>${styles}</style></head>
              <body>
                  <div class="receipt-container">
                      <div class="header"><h1>RECIBO</h1></div>
                      <div class="content">
                          <p>Recebi referente a <strong>${t.description}</strong></p>
                          <p>A importância de <strong>${t.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></p>
                          <p>Data do pagamento: ${new Date(t.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</p>
                      </div>
                      <div class="signature">${signatureContent}<p><strong>Vanessa Gonçalves</strong></p><p>Psicanalista Clínica</p></div>
                  </div>
              </body>
          </html>
        `;
        printWindow.document.write(reportHTML);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
    }
  };

  return (
    <ModuleContainer 
      title="Módulo Financeiro" 
      onBack={() => onNavigate('dashboard')}
      actions={
        <button 
          onClick={handleOpenAddModal}
          className="bg-indigo-600 text-white px-4 py-2 rounded-full hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm flex items-center gap-2"
        >
          <span className="text-lg leading-none mb-0.5">+</span> Nova Transação
        </button>
      }
    >
      {/* Filters and Header */}
      {filteredPatient && (
        <div className="bg-indigo-50 border border-indigo-100 text-indigo-800 px-4 py-3 rounded-md mb-6 flex justify-between items-center animate-fade-in">
          <span>Filtrando financeiro de: <strong>{filteredPatient.name}</strong></span>
          <button onClick={onClearPatientFilter} className="text-indigo-600 hover:text-indigo-900 text-sm underline">Limpar filtro</button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-emerald-100">
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Receitas</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">
            {isLoading ? <Skeleton className="h-8 w-24" /> : summary.income.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-rose-100">
          <p className="text-xs font-bold text-rose-600 uppercase tracking-wider">Despesas</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">
            {isLoading ? <Skeleton className="h-8 w-24" /> : summary.expense.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-indigo-100">
          <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Saldo</p>
          <p className={`text-2xl font-bold mt-1 ${summary.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {isLoading ? <Skeleton className="h-8 w-24" /> : summary.balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
          <button 
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${filterType === 'all' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Todos
          </button>
          <button 
            onClick={() => setFilterType('income')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${filterType === 'income' ? 'bg-white shadow text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Receitas
          </button>
          <button 
            onClick={() => setFilterType('expense')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${filterType === 'expense' ? 'bg-white shadow text-rose-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Despesas
          </button>
        </div>
        
        <input 
          type="month" 
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          className="p-2 border border-slate-300 rounded-md text-sm bg-white"
        />
      </div>

      {/* Transaction Table */}
      <div className="overflow-x-auto">
        <h3 className="text-lg font-semibold text-slate-700 mb-4">Histórico de Transações</h3>
        <table className="min-w-full bg-white border border-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-slate-600">Data</th>
              <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-slate-600">Descrição</th>
              <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-slate-600">Valor</th>
              <th className="text-right py-3 px-4 uppercase font-semibold text-sm text-slate-600">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-slate-200">
                  <td className="py-3 px-4"><Skeleton className="h-4 w-24" /></td>
                  <td className="py-3 px-4"><Skeleton className="h-4 w-full" /></td>
                  <td className="py-3 px-4"><Skeleton className="h-4 w-20" /></td>
                  <td className="py-3 px-4"><Skeleton className="h-6 w-20 ml-auto rounded-full" /></td>
                </tr>
              ))
            ) : filteredTransactions.length > 0 ? filteredTransactions.map(t => (
                <tr key={t.id} className="border-b border-slate-200 animate-fade-in hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 text-sm text-slate-500">{new Date(t.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</td>
                    <td className="py-3 px-4 text-sm text-slate-800">
                        {t.description}
                        {t.patientId && <span className="ml-2 text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">Paciente</span>}
                    </td>
                    <td className={`py-3 px-4 font-semibold text-sm ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>{(t.type === 'income' ? t.amount : -t.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                    <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                            {t.type === 'income' && (
                                <button 
                                    onClick={() => handlePrintReceipt(t)}
                                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-white border border-amber-200 text-amber-700 hover:bg-amber-50 rounded-full transition-colors shadow-sm"
                                    title="Recibo"
                                >
                                    <FileTextIcon className="w-3 h-3" />
                                </button>
                            )}
                            <button 
                                onClick={() => handleOpenEditModal(t)}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 rounded-full transition-colors shadow-sm"
                                title="Editar"
                            >
                                <EditIcon className="w-3 h-3" />
                            </button>
                            <button 
                                onClick={() => setTransactionToDelete(t)}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-full transition-colors shadow-sm"
                                title="Excluir"
                            >
                                <TrashIcon />
                            </button>
                        </div>
                    </td>
                </tr>
            )) : (
              <tr>
                <td colSpan={4} className="text-center py-10 text-slate-500">Nenhuma transação encontrada para os filtros aplicados.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-50 animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-slate-800">{modalMode === 'add' ? 'Nova Transação' : 'Editar Transação'}</h3>
                    <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-full hover:bg-slate-100 text-slate-500"><CloseIcon /></button>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input 
                                    type="radio" 
                                    name="type" 
                                    value="income" 
                                    checked={currentTransaction.type === 'income'} 
                                    onChange={() => setCurrentTransaction(prev => ({...prev, type: 'income'}))}
                                    className="text-emerald-600 focus:ring-emerald-500"
                                /> 
                                Receita
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input 
                                    type="radio" 
                                    name="type" 
                                    value="expense" 
                                    checked={currentTransaction.type === 'expense'} 
                                    onChange={() => setCurrentTransaction(prev => ({...prev, type: 'expense'}))}
                                    className="text-rose-600 focus:ring-rose-500"
                                /> 
                                Despesa
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
                        <input 
                            type="text" 
                            value={currentTransaction.description} 
                            onChange={(e) => setCurrentTransaction(prev => ({...prev, description: e.target.value}))}
                            className="w-full p-2 border rounded-md bg-white focus:ring-2 focus:ring-indigo-500 border-slate-300"
                            placeholder="Ex: Consulta, Aluguel, Material..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Valor</label>
                        <input 
                            type="text" 
                            value={amountInput} 
                            onChange={handleAmountChange}
                            className="w-full p-2 border rounded-md bg-white focus:ring-2 focus:ring-indigo-500 border-slate-300"
                            placeholder="R$ 0,00"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Data</label>
                        <input 
                            type="date" 
                            value={currentTransaction.date} 
                            onChange={(e) => setCurrentTransaction(prev => ({...prev, date: e.target.value}))}
                            className="w-full p-2 border rounded-md bg-white focus:ring-2 focus:ring-indigo-500 border-slate-300"
                        />
                    </div>

                    {!filteredPatient && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Vincular a Paciente (Opcional)</label>
                            <select 
                                value={currentTransaction.patientId || ''} 
                                onChange={(e) => setCurrentTransaction(prev => ({...prev, patientId: e.target.value}))}
                                className="w-full p-2 border rounded-md bg-white focus:ring-2 focus:ring-indigo-500 border-slate-300"
                            >
                                <option value="">Nenhum</option>
                                {patients.sort((a,b) => a.name.localeCompare(b.name)).map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                    <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-full bg-slate-200 text-slate-800 hover:bg-slate-300 transition-colors">Cancelar</button>
                    <button onClick={handleSaveTransaction} className="px-6 py-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm">Salvar</button>
                </div>
            </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {transactionToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-50 animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Excluir Transação</h3>
                <p className="text-slate-600 mb-6">Tem certeza que deseja excluir este registro? A ação não pode ser desfeita.</p>
                <div className="bg-slate-50 p-3 rounded border border-slate-200 mb-6 text-sm">
                    <p><strong>Descrição:</strong> {transactionToDelete.description}</p>
                    <p><strong>Valor:</strong> {transactionToDelete.amount.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</p>
                </div>
                <div className="flex justify-end gap-3">
                    <button onClick={() => setTransactionToDelete(null)} className="px-4 py-2 rounded-full bg-slate-200 text-slate-800 hover:bg-slate-300 transition-colors">Cancelar</button>
                    <button onClick={handleDeleteTransaction} className="px-4 py-2 rounded-full bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-sm">Sim, excluir</button>
                </div>
            </div>
        </div>
      )}

    </ModuleContainer>
  );
};

export default FinancialModule;
