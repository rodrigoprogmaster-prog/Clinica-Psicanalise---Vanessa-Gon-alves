
import React, { useState } from 'react';
import { View, Patient } from '../types';
import ModuleContainer from './ModuleContainer';
import TrashIcon from './icons/TrashIcon';
import TooltipIcon from './icons/TooltipIcon';
import MoneyIcon from './icons/MoneyIcon';

interface PatientManagementProps {
  onNavigate: (view: View) => void;
  onViewPEP: (patientId: string) => void;
  onViewFinancials: (patientId: string) => void;
  patients: Patient[];
  setPatients: React.Dispatch<React.SetStateAction<Patient[]>>;
}

const Tooltip: React.FC<{ text: string }> = ({ text }) => (
  <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-max max-w-xs p-2 text-xs text-white bg-slate-700 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
    {text}
    <svg className="absolute text-slate-700 h-2 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255">
      <polygon className="fill-current" points="0,0 127.5,127.5 255,0"/>
    </svg>
  </span>
);


const PatientManagement: React.FC<PatientManagementProps> = ({ onNavigate, onViewPEP, onViewFinancials, patients, setPatients }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const [formStep, setFormStep] = useState<'details' | 'confirm'>('details');
  
  const initialFormData = { 
    name: '', email: '', phone: '', dateOfBirth: '', address: '', occupation: '',
    emergencyContactName: '', emergencyContactPhone: ''
  };
  const [newPatientData, setNewPatientData] = useState(initialFormData);
  const [errors, setErrors] = useState({ 
    name: '', email: '', phone: '', dateOfBirth: '', address: '', occupation: '' 
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewPatientData(prev => ({ ...prev, [name]: value }));
    if(errors[name as keyof typeof errors]) {
      setErrors(prev => ({...prev, [name]: ''}));
    }
  };

  const validateForm = () => {
    const newErrors = { name: '', email: '', phone: '', dateOfBirth: '', address: '', occupation: '' };
    let isValid = true;

    if (!newPatientData.name.trim()) { newErrors.name = 'O nome é obrigatório.'; isValid = false; }
    if (!newPatientData.dateOfBirth.trim()) { newErrors.dateOfBirth = 'A data de nascimento é obrigatória.'; isValid = false; }
    if (!newPatientData.address.trim()) { newErrors.address = 'O endereço é obrigatório.'; isValid = false; }
    if (!newPatientData.occupation.trim()) { newErrors.occupation = 'A profissão é obrigatória.'; isValid = false; }

    if (!newPatientData.email.trim()) {
      newErrors.email = 'O email é obrigatório.';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(newPatientData.email)) {
      newErrors.email = 'O formato do email é inválido.';
      isValid = false;
    }
    
    if (newPatientData.phone.trim()) {
      const phoneDigits = newPatientData.phone.replace(/\D/g, '');
      if (phoneDigits.length < 10 || phoneDigits.length > 11) {
          newErrors.phone = 'O telefone deve conter DDD + 8 ou 9 dígitos.';
          isValid = false;
      }
    }
    
    setErrors(newErrors);
    return isValid;
  };

  const handleProceedToConfirm = () => {
    if (validateForm()) {
      setFormStep('confirm');
    }
  };

  const handleConfirmAndSave = () => {
    const newPatient: Patient = {
      id: `p${Date.now()}`,
      name: newPatientData.name,
      email: newPatientData.email,
      phone: newPatientData.phone,
      dateOfBirth: newPatientData.dateOfBirth,
      address: newPatientData.address,
      occupation: newPatientData.occupation,
      emergencyContact: {
        name: newPatientData.emergencyContactName,
        phone: newPatientData.emergencyContactPhone
      },
      joinDate: new Date().toISOString().split('T')[0],
    };
    setPatients(prev => [newPatient, ...prev].sort((a,b) => a.name.localeCompare(b.name)));
    closeModal();
  };
  
  const openModal = () => setIsModalOpen(true);

  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => {
        setFormStep('details');
        setNewPatientData(initialFormData);
        setErrors({ name: '', email: '', phone: '', dateOfBirth: '', address: '', occupation: '' });
    }, 300);
  };

  const handleDeletePatient = () => {
    if (patientToDelete) {
        setPatients(prev => prev.filter(p => p.id !== patientToDelete.id));
        setPatientToDelete(null);
    }
  };

  return (
    <ModuleContainer title="Gestão de Pacientes" onBack={() => onNavigate('dashboard')}>
      <div className="mb-6 flex justify-end">
        <button
          onClick={openModal}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
        >
          Adicionar Paciente
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 transition-opacity duration-300 animate-fade-in" onClick={closeModal}>
          <div className="bg-white p-6 sm:p-8 rounded-lg shadow-xl max-w-2xl w-full mx-4 transform transition-transform duration-300 animate-slide-up max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {formStep === 'details' && (
              <div>
                <h3 className="text-xl font-bold text-slate-800 mb-1">Cadastrar Novo Paciente</h3>
                <p className="text-slate-500 mb-6">Preencha os dados abaixo.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5">
                  
                  {/* Personal Info */}
                  <div className="md:col-span-2">
                    <label htmlFor="name" className="flex items-center text-sm font-medium text-slate-700 mb-1">
                      Nome Completo
                      <span className="group relative ml-1.5">
                        <TooltipIcon />
                        <Tooltip text="Nome e sobrenome do paciente." />
                      </span>
                    </label>
                    <input type="text" id="name" name="name" value={newPatientData.name} onChange={handleInputChange} className={`w-full p-2 border rounded-md bg-white ${errors.name ? 'border-red-500' : 'border-slate-300'}`} />
                    {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <label htmlFor="dateOfBirth" className="flex items-center text-sm font-medium text-slate-700 mb-1">
                      Data de Nascimento
                      <span className="group relative ml-1.5">
                        <TooltipIcon />
                        <Tooltip text="Data de nascimento no formato DD/MM/AAAA." />
                      </span>
                    </label>
                    <input type="date" id="dateOfBirth" name="dateOfBirth" value={newPatientData.dateOfBirth} onChange={handleInputChange} className={`w-full p-2 border rounded-md bg-white ${errors.dateOfBirth ? 'border-red-500' : 'border-slate-300'}`} />
                    {errors.dateOfBirth && <p className="text-red-500 text-sm mt-1">{errors.dateOfBirth}</p>}
                  </div>
                  <div /> {/* Placeholder for grid */}

                  {/* Contact Info */}
                   <div>
                     <label htmlFor="email" className="flex items-center text-sm font-medium text-slate-700 mb-1">
                      Email
                      <span className="group relative ml-1.5">
                        <TooltipIcon />
                        <Tooltip text="Endereço de e-mail principal para contato." />
                      </span>
                     </label>
                    <input type="email" id="email" name="email" value={newPatientData.email} onChange={handleInputChange} className={`w-full p-2 border rounded-md bg-white ${errors.email ? 'border-red-500' : 'border-slate-300'}`} />
                    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <label htmlFor="phone" className="flex items-center text-sm font-medium text-slate-700 mb-1">
                      Telefone
                       <span className="group relative ml-1.5">
                        <TooltipIcon />
                        <Tooltip text="Número de telefone com DDD (opcional)." />
                      </span>
                    </label>
                    <input type="tel" id="phone" name="phone" value={newPatientData.phone} onChange={handleInputChange} className={`w-full p-2 border rounded-md bg-white ${errors.phone ? 'border-red-500' : 'border-slate-300'}`} />
                    {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                  </div>

                  {/* Additional Info */}
                  <div className="md:col-span-2">
                    <label htmlFor="address" className="flex items-center text-sm font-medium text-slate-700 mb-1">
                      Endereço
                       <span className="group relative ml-1.5">
                        <TooltipIcon />
                        <Tooltip text="Endereço residencial completo." />
                      </span>
                    </label>
                    <input type="text" id="address" name="address" value={newPatientData.address} onChange={handleInputChange} className={`w-full p-2 border rounded-md bg-white ${errors.address ? 'border-red-500' : 'border-slate-300'}`} />
                    {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
                  </div>
                   <div>
                    <label htmlFor="occupation" className="flex items-center text-sm font-medium text-slate-700 mb-1">
                      Profissão
                       <span className="group relative ml-1.5">
                        <TooltipIcon />
                        <Tooltip text="Ocupação ou profissão atual do paciente." />
                      </span>
                    </label>
                    <input type="text" id="occupation" name="occupation" value={newPatientData.occupation} onChange={handleInputChange} className={`w-full p-2 border rounded-md bg-white ${errors.occupation ? 'border-red-500' : 'border-slate-300'}`} />
                    {errors.occupation && <p className="text-red-500 text-sm mt-1">{errors.occupation}</p>}
                  </div>

                  {/* Emergency Contact */}
                  <h4 className="md:col-span-2 text-md font-semibold text-slate-800 mt-4 border-t pt-4">Contato de Emergência <span className="text-sm font-normal text-slate-500">(Opcional)</span></h4>
                   <div>
                    <label htmlFor="emergencyContactName" className="flex items-center text-sm font-medium text-slate-700 mb-1">
                      Nome
                       <span className="group relative ml-1.5">
                        <TooltipIcon />
                        <Tooltip text="Nome do contato para casos de emergência." />
                      </span>
                    </label>
                    <input type="text" id="emergencyContactName" name="emergencyContactName" value={newPatientData.emergencyContactName} onChange={handleInputChange} className="w-full p-2 border rounded-md border-slate-300 bg-white" />
                  </div>
                   <div>
                    <label htmlFor="emergencyContactPhone" className="flex items-center text-sm font-medium text-slate-700 mb-1">
                      Telefone
                       <span className="group relative ml-1.5">
                        <TooltipIcon />
                        <Tooltip text="Telefone do contato de emergência." />
                      </span>
                    </label>
                    <input type="tel" id="emergencyContactPhone" name="emergencyContactPhone" value={newPatientData.emergencyContactPhone} onChange={handleInputChange} className="w-full p-2 border rounded-md border-slate-300 bg-white" />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-8">
                  <button onClick={closeModal} className="px-4 py-2 rounded-md bg-slate-200 text-slate-800 hover:bg-slate-300 transition-colors">Cancelar</button>
                  <button onClick={handleProceedToConfirm} className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors">Revisar Cadastro</button>
                </div>
              </div>
            )}
            {formStep === 'confirm' && (
               <div>
                <h3 className="text-xl font-bold text-slate-800 mb-1">Confirme os Dados</h3>
                <p className="text-slate-500 mb-6">Por favor, revise as informações do paciente.</p>
                <div className="space-y-3 bg-slate-50 p-4 rounded-md border grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                    <p><span className="font-semibold text-slate-600">Nome:</span> {newPatientData.name}</p>
                    <p><span className="font-semibold text-slate-600">Nascimento:</span> {newPatientData.dateOfBirth ? new Date(newPatientData.dateOfBirth).toLocaleDateString('pt-BR', {timeZone:'UTC'}) : 'Não informado'}</p>
                    <p><span className="font-semibold text-slate-600">Email:</span> {newPatientData.email}</p>
                    <p><span className="font-semibold text-slate-600">Telefone:</span> {newPatientData.phone || 'Não informado'}</p>
                    <p className="md:col-span-2"><span className="font-semibold text-slate-600">Endereço:</span> {newPatientData.address}</p>
                    <p><span className="font-semibold text-slate-600">Profissão:</span> {newPatientData.occupation}</p>
                    <p className="md:col-span-2 pt-2 mt-2 border-t"><span className="font-semibold text-slate-600">Contato de Emergência:</span> {newPatientData.emergencyContactName || 'Não informado'} {newPatientData.emergencyContactPhone && `(${newPatientData.emergencyContactPhone})`}</p>
                </div>
                <div className="flex justify-end gap-3 mt-8">
                  <button onClick={() => setFormStep('details')} className="px-4 py-2 rounded-md bg-slate-200 text-slate-800 hover:bg-slate-300 transition-colors">Voltar e Editar</button>
                  <button onClick={handleConfirmAndSave} className="px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">Confirmar e Salvar</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {patientToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 animate-fade-in" onClick={() => setPatientToDelete(null)}>
          <div className="bg-white p-6 sm:p-8 rounded-lg shadow-xl max-w-md w-full mx-4 transform transition-transform duration-300 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Confirmar Exclusão</h3>
            <p className="text-slate-600 mb-6">
                Você tem certeza que deseja excluir o paciente <span className="font-semibold">{patientToDelete.name}</span>? Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-3 mt-8">
                <button 
                    onClick={() => setPatientToDelete(null)} 
                    className="px-4 py-2 rounded-md bg-slate-200 text-slate-800 hover:bg-slate-300 transition-colors"
                >
                    Cancelar
                </button>
                <button 
                    onClick={handleDeletePatient} 
                    className="px-4 py-2 rounded-md bg-rose-600 text-white hover:bg-rose-700 transition-colors"
                >
                    Excluir Paciente
                </button>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <h3 className="text-lg font-semibold text-slate-700 mb-4">Histórico de Pacientes</h3>
        <table className="min-w-full bg-white border border-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-slate-600">Nome</th>
              <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-slate-600 hidden md:table-cell">Email</th>
              <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-slate-600 hidden lg:table-cell">Data de Cadastro</th>
              <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-slate-600">Ações</th>
            </tr>
          </thead>
          <tbody className="text-slate-700">
            {patients.map((patient) => (
              <tr key={patient.id} className="border-b border-slate-200 hover:bg-slate-50">
                <td className="py-3 px-4">{patient.name}</td>
                <td className="py-3 px-4 hidden md:table-cell">{patient.email}</td>
                <td className="py-3 px-4 hidden lg:table-cell">{new Date(patient.joinDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => onViewPEP(patient.id)}
                      className="text-indigo-600 hover:text-indigo-800 font-medium text-sm whitespace-nowrap"
                    >
                      Ver PEP
                    </button>
                     <button
                        onClick={() => onViewFinancials(patient.id)}
                        className="text-emerald-600 hover:text-emerald-800 font-medium text-sm flex items-center gap-1"
                        aria-label={`Ver financeiro de ${patient.name}`}
                     >
                        <MoneyIcon />
                        <span className="hidden sm:inline">Financeiro</span>
                    </button>
                     <button
                      onClick={() => setPatientToDelete(patient)}
                      className="text-rose-600 hover:text-rose-800 font-medium text-sm flex items-center gap-1"
                      aria-label={`Excluir ${patient.name}`}
                    >
                      <TrashIcon />
                      <span className="hidden sm:inline">Excluir</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
             {patients.length === 0 && (
                <tr>
                    <td colSpan={5} className="text-center py-10 text-slate-500">Nenhum paciente cadastrado.</td>
                </tr>
             )}
          </tbody>
        </table>
      </div>
    </ModuleContainer>
  );
};

export default PatientManagement;