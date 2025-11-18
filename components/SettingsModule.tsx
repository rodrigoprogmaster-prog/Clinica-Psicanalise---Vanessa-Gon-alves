
import React, { useState } from 'react';
import { View, ConsultationType } from '../types';
import ModuleContainer from './ModuleContainer';
import TrashIcon from './icons/TrashIcon';
import { formatCurrency, parseCurrency } from '../utils/formatting';

interface SettingsModuleProps {
  onNavigate: (view: View) => void;
  currentPassword?: string;
  onChangePassword: (newPassword: string) => void;
  consultationTypes: ConsultationType[];
  setConsultationTypes: React.Dispatch<React.SetStateAction<ConsultationType[]>>;
}

const SettingsModule: React.FC<SettingsModuleProps> = ({ 
  onNavigate, 
  currentPassword,
  onChangePassword,
  consultationTypes,
  setConsultationTypes
}) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const [newTypeName, setNewTypeName] = useState('');
  const [newTypePrice, setNewTypePrice] = useState('');

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (oldPassword !== currentPassword) {
      setPasswordError('A senha antiga está incorreta.');
      return;
    }
    if (newPassword.length < 4) {
      setPasswordError('A nova senha deve ter pelo menos 4 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('As novas senhas não coincidem.');
      return;
    }

    onChangePassword(newPassword);
    setPasswordSuccess('Senha alterada com sucesso!');
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPasswordSuccess(''), 3000);
  };

  const handleAddConsultationType = (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseCurrency(newTypePrice);
    if (newTypeName.trim() && !isNaN(price) && price >= 0) {
      const newType: ConsultationType = {
        id: `ct-${Date.now()}`,
        name: newTypeName.trim(),
        price,
      };
      setConsultationTypes(prev => [...prev, newType].sort((a, b) => a.name.localeCompare(b.name)));
      setNewTypeName('');
      setNewTypePrice('');
    }
  };

  const handleDeleteConsultationType = (id: string) => {
    setConsultationTypes(prev => prev.filter(ct => ct.id !== id));
  };
  
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewTypePrice(formatCurrency(e.target.value));
  };

  return (
    <ModuleContainer title="Configurações" onBack={() => onNavigate('dashboard')}>
      <div className="max-w-3xl mx-auto space-y-8">

        {/* Consultation Type Management */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-slate-700 mb-4">Gestão de Consultas</h3>
          
          <form onSubmit={handleAddConsultationType} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end mb-6">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-600 mb-1">Nome do Tipo</label>
              <input type="text" value={newTypeName} onChange={e => setNewTypeName(e.target.value)} placeholder="Ex: Sessão Individual" className="w-full p-2 border rounded-md bg-white border-slate-300" required />
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-grow">
                <label className="block text-sm font-medium text-slate-600 mb-1">Preço (R$)</label>
                <input type="text" value={newTypePrice} onChange={handlePriceChange} placeholder="R$ 0,00" className="w-full p-2 border rounded-md bg-white border-slate-300" required />
              </div>
              <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 h-10">Salvar</button>
            </div>
          </form>

          <div>
            {consultationTypes.map(ct => (
              <div key={ct.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-md mb-2 border">
                <div>
                  <p className="font-semibold text-slate-800">{ct.name}</p>
                  <p className="text-sm text-slate-600">{ct.price.toLocaleString('pt-BR', {style:'currency', currency:'BRL'})}</p>
                </div>
                <button onClick={() => handleDeleteConsultationType(ct.id)} className="text-rose-500 hover:text-rose-700 p-1 rounded-full">
                  <TrashIcon />
                </button>
              </div>
            ))}
            {consultationTypes.length === 0 && <p className="text-center text-slate-500 py-4">Nenhum tipo de consulta cadastrado.</p>}
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-slate-700 mb-4">Segurança</h3>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Senha Antiga</label>
              <input 
                type="password" 
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full p-2 border rounded-md bg-white border-slate-300" 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Nova Senha</label>
              <input 
                type="password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-2 border rounded-md bg-white border-slate-300" 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Confirmar Nova Senha</label>
              <input 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-2 border rounded-md bg-white border-slate-300" 
                required 
              />
            </div>
            {passwordError && <p className="text-sm text-rose-500">{passwordError}</p>}
            {passwordSuccess && <p className="text-sm text-emerald-500">{passwordSuccess}</p>}
            <div className="text-right">
              <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors">
                Alterar Senha
              </button>
            </div>
          </form>
        </div>

      </div>
    </ModuleContainer>
  );
};

export default SettingsModule;