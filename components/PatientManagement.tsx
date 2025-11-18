
import React, { useState, useMemo, useEffect } from 'react';
import { View, Patient, Appointment } from '../types';
import ModuleContainer from './ModuleContainer';
import TrashIcon from './icons/TrashIcon';
import TooltipIcon from './icons/TooltipIcon';
import MoneyIcon from './icons/MoneyIcon';
import FileTextIcon from './icons/FileTextIcon';
import UserXIcon from './icons/UserXIcon';
import UserCheckIcon from './icons/UserCheckIcon';

interface PatientManagementProps {
  onNavigate: (view: View) => void;
  onViewPEP: (patientId: string) => void;
  onViewFinancials: (patientId: string) => void;
  patients: Patient[];
  setPatients: React.Dispatch<React.SetStateAction<Patient[]>>;
  appointments: Appointment[];
}

const Tooltip: React.FC<{ text: string }> = ({ text }) => (
  <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-max max-w-xs p-2 text-xs text-white bg-slate-700 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
    {text}
    <svg className="absolute text-slate-700 h-2 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255">
      <polygon className="fill-current" points="0,0 127.5,127.5 255,0"/>
    </svg>
  </span>
);

const initialFormData = {
    id: '', name: '', email: '', phone: '', dateOfBirth: '', address: '', occupation: '',
    emergencyContactName: '', emergencyContactPhone: ''
};

const PatientManagement: React.FC<PatientManagementProps> = ({ onNavigate, onViewPEP, onViewFinancials, patients, setPatients, appointments }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const [patientToToggleStatus, setPatientToToggleStatus] = useState<Patient | null>(null);
  const [formStep, setFormStep] = useState<'details' | 'confirm'>('details');
  const [showInactive, setShowInactive] = useState(false);
  const [formData, setFormData] = useState(initialFormData);

  const [errors, setErrors] = useState({ 
    name: '', email: '', phone: '', dateOfBirth: '', address: '', occupation: '' 
  });

  useEffect(() => {
    if (!isModalOpen) {
        // Reset state after modal closes
        setTimeout(() => {
            setFormStep('details');
            setFormData(initialFormData);
            setErrors({ name: '', email: '', phone: '', dateOfBirth: '', address: '', occupation: '' });
        }, 300);
    }
  }, [isModalOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if(errors[name as keyof typeof errors]) {
      setErrors(prev => ({...prev, [name]: ''}));
    }
  };

  const validateForm = () => {
    const newErrors = { name: '', email: '', phone: '', dateOfBirth: '', address: '', occupation: '' };
    let isValid = true;
    if (!formData.name.trim()) { newErrors.name = 'O nome é obrigatório.'; isValid = false; }
    if (!formData.dateOfBirth.trim()) { newErrors.dateOfBirth = 'A data de nascimento é obrigatória.'; isValid = false; }
    if (!formData.address.trim()) { newErrors.address = 'O endereço é obrigatório.'; isValid = false; }
    if (!formData.occupation.trim()) { newErrors.occupation = 'A profissão é obrigatória.'; isValid = false; }
    if (!formData.email.trim()) {
      newErrors.email = 'O email é obrigatório.';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'O formato do email é inválido.';
      isValid = false;
    }
    if (formData.phone.trim()) {
      const phoneDigits = formData.phone.replace(/\D/g, '');
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
    if (modalMode === 'add') {
      const newPatient: Patient = {
        id: `p${Date.now()}`,
        name: formData.name, email: formData.email, phone: formData.phone, dateOfBirth: formData.dateOfBirth,
        address: formData.address, occupation: formData.occupation,
        emergencyContact: { name: formData.emergencyContactName, phone: formData.emergencyContactPhone },
        joinDate: new Date().toISOString().split('T')[0], isActive: true,
      };
      setPatients(prev => [newPatient, ...prev].sort((a,b) => a.name.localeCompare(b.name)));
    } else {
        setPatients(prev => prev.map(p => p.id === formData.id ? {
            ...p,
            name: formData.name, email: formData.email, phone: formData.phone, dateOfBirth: formData.dateOfBirth,
            address: formData.address, occupation: formData.occupation,
            emergencyContact: { name: formData.emergencyContactName, phone: formData.emergencyContactPhone },
        } : p));
    }
    setIsModalOpen(false);
  };
  
  const openAddModal = () => {
      setModalMode('add');
      setIsModalOpen(true);
  };

  const openEditModal = (patient: Patient) => {
    setModalMode('edit');
    setFormData({
        id: patient.id,
        name: patient.name,
        email: patient.email,
        phone: patient.phone,
        dateOfBirth: patient.dateOfBirth,
        address: patient.address,
        occupation: patient.occupation,
        emergencyContactName: patient.emergencyContact.name,
        emergencyContactPhone: patient.emergencyContact.phone,
    });
    setIsModalOpen(true);
  };

  const handleDeletePatient = () => {
    if (patientToDelete) {
        setPatients(prev => prev.filter(p => p.id !== patientToDelete.id));
        setPatientToDelete(null);
    }
  };

  const handleTogglePatientStatus = () => {
    if (patientToToggleStatus) {
      setPatients(prev => prev.map(p => 
        p.id === patientToToggleStatus.id ? { ...p, isActive: !p.isActive } : p
      ));
      setPatientToToggleStatus(null);
    }
  };

  const displayedPatients = useMemo(() => 
    patients.filter(p => showInactive ? true : p.isActive)
  , [patients, showInactive]);

  const patientHasAppointments = (patientId: string) => {
    return appointments.some(app => app.patientId === patientId);
  };

  return (
    <ModuleContainer title="Gestão de Pacientes" onBack={() => onNavigate('dashboard')}>
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <label htmlFor="show_inactive" className="font-medium text-slate-700">Mostrar inativos</label>
          <input 
            id="show_inactive"
            type="checkbox" 
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
        </div>
        <button
          onClick={openAddModal}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
        >
          Adicionar Paciente
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 transition-opacity duration-300 animate-fade-in" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white p-6 sm:p-8 rounded-lg shadow-xl max-w-2xl w-full mx-4 transform transition-transform duration-300 animate-slide-up max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {formStep === 'details' && (
              <div>
                <h3 className="text-xl font-bold text-slate-800 mb-1">{modalMode === 'add' ? 'Cadastrar Novo Paciente' : 'Editar Cadastro'}</h3>
                <p className="text-slate-500 mb-6">Preencha os dados abaixo.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5">
                  <div className="md:col-span-2">
                    <label htmlFor="name" className="flex items-center text-sm font-medium text-slate-700 mb-1">Nome Completo<span className="group relative ml-1.5"><TooltipIcon /><Tooltip text="Nome e sobrenome do paciente." /></span></label>
                    <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} className={`w-full p-2 border rounded-md bg-white ${errors.name ? 'border-red-500' : 'border-slate-300'}`} />
                    {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <label htmlFor="dateOfBirth" className="flex items-center text-sm font-medium text-slate-700 mb-1">Data de Nascimento<span className="group relative ml-1.5"><TooltipIcon /><Tooltip text="Data de nascimento no formato DD/MM/AAAA." /></span></label>
                    <input type="date" id="dateOfBirth" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleInputChange} className={`w-full p-2 border rounded-md bg-white ${errors.dateOfBirth ? 'border-red-500' : 'border-slate-300'}`} />
                    {errors.dateOfBirth && <p className="text-red-500 text-sm mt-1">{errors.dateOfBirth}</p>}
                  </div>
                   <div>
                     <label htmlFor="email" className="flex items-center text-sm font-medium text-slate-700 mb-1">Email<span className="group relative ml-1.5"><TooltipIcon /><Tooltip text="Endereço de e-mail principal para contato." /></span></label>
                    <input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} className={`w-full p-2 border rounded-md bg-white ${errors.email ? 'border-red-500' : 'border-slate-300'}`} />
                    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <label htmlFor="phone" className="flex items-center text-sm font-medium text-slate-700 mb-1">Telefone<span className="group relative ml-1.5"><TooltipIcon /><Tooltip text="Número de telefone com DDD (opcional)." /></span></label>
                    <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleInputChange} className={`w-full p-2 border rounded-md bg-white ${errors.phone ? 'border-red-500' : 'border-slate-300'}`} />
                    {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                  </div>
                  <div className="md:col-span-2">
                    <label htmlFor="address" className="flex items-center text-sm font-medium text-slate-700 mb-1">Endereço<span className="group relative ml-1.5"><TooltipIcon /><Tooltip text="Endereço residencial completo." /></span></label>
                    <input type="text" id="address" name="address" value={formData.address} onChange={handleInputChange} className={`w-full p-2 border rounded-md bg-white ${errors.address ? 'border-red-500' : 'border-slate-300'}`} />
                    {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
                  </div>
                   <div>
                    <label htmlFor="occupation" className="flex items-center text-sm font-medium text-slate-700 mb-1">Profissão<span className="group relative ml-1.5"><TooltipIcon /><Tooltip text="Ocupação ou profissão atual do paciente." /></span></label>
                    <input type="text" id="occupation" name="occupation" value={formData.occupation} onChange={handleInputChange} className={`w-full p-2 border rounded-md bg-white ${errors.occupation ? 'border-red-500' : 'border-slate-300'}`} />
                    {errors.occupation && <p className="text-red-500 text-sm mt-1">{errors.occupation}</p>}
                  </div>
                  <h4 className="md:col-span-2 text-md font-semibold text-slate-800 mt-4 border-t pt-4">Contato de Emergência <span className="text-sm font-normal text-slate-500">(Opcional)</span></h4>
                   <div>
                    <label htmlFor="emergencyContactName" className="flex items-center text-sm font-medium text-slate-700 mb-1">Nome<span className="group relative ml-1.5"><TooltipIcon /><Tooltip text="Nome do contato para casos de emergência." /></span></label>
                    <input type="text" id="emergencyContactName" name="emergencyContactName" value={formData.emergencyContactName} onChange={handleInputChange} className="w-full p-2 border rounded-md border-slate-300 bg-white" />
                  </div>
                   <div>
                    <label htmlFor="emergencyContactPhone" className="flex items-center text-sm font-medium text-slate-700 mb-1">Telefone<span className="group relative ml-1.5"><TooltipIcon /><Tooltip text="Telefone do contato de emergência." /></span></label>
                    <input type="tel" id="emergencyContactPhone" name="emergencyContactPhone" value={formData.emergencyContactPhone} onChange={handleInputChange} className="w-full p-2 border rounded-md border-slate-300 bg-white" />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-8">
                  <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-md bg-slate-200 text-slate-800 hover:bg-slate-300 transition-colors">Cancelar</button>
                  <button onClick={handleProceedToConfirm} className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors">Revisar Cadastro</button>
                </div>
              </div>
            )}
            {formStep === 'confirm' && (
               <div>
                <h3 className="text-xl font-bold text-slate-800 mb-1">Confirme os Dados</h3>
                <p className="text-slate-500 mb-6">Por favor, revise as informações do paciente.</p>
                <div className="space-y-3 bg-slate-50 p-4 rounded-md border grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                    <p><span className="font-semibold text-slate-600">Nome:</span> {formData.name}</p>
                    <p><span className="font-semibold text-slate-600">Nascimento:</span> {formData.dateOfBirth ? new Date(formData.dateOfBirth).toLocaleDateString('pt-BR', {timeZone:'UTC'}) : 'Não informado'}</p>
                    <p><span className="font-semibold text-slate-600">Email:</span> {formData.email}</p>
                    <p><span className="font-semibold text-slate-600">Telefone:</span> {formData.phone || 'Não informado'}</p>
                    <p className="md:col-span-2"><span className="font-semibold text-slate-600">Endereço:</span> {formData.address}</p>
                    <p><span className="font-semibold text-slate-600">Profissão:</span> {formData.occupation}</p>
                    <p className="md:col-span-2 pt-2 mt-2 border-t"><span className="font-semibold text-slate-600">Contato de Emergência:</span> {formData.emergencyContactName || 'Não informado'} {formData.emergencyContactPhone && `(${formData.emergencyContactPhone})`}</p>
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
      
      {patientToToggleStatus && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 animate-fade-in" onClick={() => setPatientToToggleStatus(null)}>
          <div className="bg-white p-6 sm:p-8 rounded-lg shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Confirmar Alteração</h3>
            <p className="text-slate-600 mb-6">
              Você tem certeza que deseja <span className="font-bold">{patientToToggleStatus.isActive ? 'INATIVAR' : 'REATIVAR'}</span> o paciente <span className="font-semibold">{patientToToggleStatus.name}</span>?
            </p>
            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setPatientToToggleStatus(null)} className="px-4 py-2 rounded-md bg-slate-200 text-slate-800 hover:bg-slate-300">Cancelar</button>
              <button onClick={handleTogglePatientStatus} className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700">Sim, confirmar</button>
            </div>
          </div>
        </div>
      )}

      {patientToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 animate-fade-in" onClick={() => setPatientToDelete(null)}>
          <div className="bg-white p-6 sm:p-8 rounded-lg shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Confirmar Exclusão</h3>
            <p className="text-slate-600 mb-6">
                Você tem certeza que deseja excluir o paciente <span className="font-semibold">{patientToDelete.name}</span>? Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-3 mt-8">
                <button onClick={() => setPatientToDelete(null)} className="px-4 py-2 rounded-md bg-slate-200 text-slate-800 hover:bg-slate-300">Cancelar</button>
                <button onClick={handleDeletePatient} className="px-4 py-2 rounded-md bg-rose-600 text-white hover:bg-rose-700">Excluir Paciente</button>
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
              <th className="text-center py-3 px-4 uppercase font-semibold text-sm text-slate-600">Ações</th>
            </tr>
          </thead>
          <tbody className="text-slate-700">
            {displayedPatients.map((patient) => {
              const hasAppointments = patientHasAppointments(patient.id);
              return (
              <tr 
                key={patient.id} 
                className={`border-b border-slate-200 hover:bg-slate-50 cursor-pointer ${!patient.isActive ? 'bg-slate-100 text-slate-500' : ''}`}
                onClick={() => openEditModal(patient)}
              >
                <td className="py-3 px-4">{patient.name}</td>
                <td className="py-3 px-4 hidden md:table-cell">{patient.email}</td>
                <td className="py-3 px-4 hidden lg:table-cell">{new Date(patient.joinDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</td>
                <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-center gap-4">
                    <div className="group relative">
                      <button 
                        onClick={() => onViewPEP(patient.id)} 
                        className={`p-1 ${hasAppointments ? 'text-indigo-600 hover:text-indigo-800' : 'text-slate-400 cursor-not-allowed'}`}
                        aria-label={`Ver prontuário de ${patient.name}`}
                        disabled={!hasAppointments}
                      >
                        <FileTextIcon />
                      </button>
                      <Tooltip text={hasAppointments ? 'Ver Prontuário' : 'Nenhuma consulta registrada'} />
                    </div>
                    <div className="group relative">
                      <button onClick={() => onViewFinancials(patient.id)} className="p-1 text-emerald-600 hover:text-emerald-800" aria-label={`Ver financeiro de ${patient.name}`}><MoneyIcon /></button>
                      <Tooltip text="Ver Financeiro" />
                    </div>
                    <div className="group relative">
                      <button onClick={() => setPatientToToggleStatus(patient)} className={`p-1 ${patient.isActive ? 'text-amber-600 hover:text-amber-800' : 'text-emerald-600 hover:text-emerald-800'}`} aria-label={`${patient.isActive ? 'Inativar' : 'Reativar'} ${patient.name}`}>
                        {patient.isActive ? <UserXIcon /> : <UserCheckIcon />}
                      </button>
                      <Tooltip text={patient.isActive ? 'Inativar Paciente' : 'Reativar Paciente'} />
                    </div>
                    <div className="group relative">
                      <button onClick={() => setPatientToDelete(patient)} className="p-1 text-rose-600 hover:text-rose-800" aria-label={`Excluir ${patient.name}`}><TrashIcon /></button>
                      <Tooltip text="Excluir Paciente" />
                    </div>
                  </div>
                </td>
              </tr>
              );
            })}
             {displayedPatients.length === 0 && (
                <tr>
                    <td colSpan={5} className="text-center py-10 text-slate-500">Nenhum paciente encontrado.</td>
                </tr>
             )}
          </tbody>
        </table>
      </div>
    </ModuleContainer>
  );
};

export default PatientManagement;