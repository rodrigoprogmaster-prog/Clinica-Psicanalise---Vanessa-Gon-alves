import React, { useState } from 'react';
import { View, Appointment, Patient, ConsultationType, Transaction } from '../types';
import ModuleContainer from './ModuleContainer';

interface AppointmentSchedulerProps {
    onNavigate: (view: View) => void;
    patients: Patient[];
    appointments: Appointment[];
    setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
    consultationTypes: ConsultationType[];
    setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
}

const AppointmentScheduler: React.FC<AppointmentSchedulerProps> = ({ onNavigate, patients, appointments, setAppointments, consultationTypes, setTransactions }) => {
  const [modalState, setModalState] = useState<{ appointment: Appointment; action: 'completed' | 'canceled' } | null>(null);
  const [newAppointment, setNewAppointment] = useState({ patientId: '', date: '', time: '', consultationTypeId: '' });
  const [formError, setFormError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewAppointment(prev => ({ ...prev, [name]: value }));
  };

  const handleAddAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppointment.patientId || !newAppointment.date || !newAppointment.time || !newAppointment.consultationTypeId) {
      setFormError('Todos os campos são obrigatórios.');
      return;
    }
    const patient = patients.find(p => p.id === newAppointment.patientId);
    const consultationType = consultationTypes.find(ct => ct.id === newAppointment.consultationTypeId);
    if (!patient || !consultationType) {
      setFormError('Paciente ou tipo de consulta inválido.');
      return;
    }
    
    const appointment: Appointment = {
      id: `app${Date.now()}`,
      patientId: newAppointment.patientId,
      patientName: patient.name,
      date: newAppointment.date,
      time: newAppointment.time,
      status: 'scheduled',
      consultationTypeId: newAppointment.consultationTypeId,
      price: consultationType.price,
    };
    
    setAppointments(prev => [...prev, appointment]);
    setNewAppointment({ patientId: '', date: '', time: '', consultationTypeId: '' });
    setFormError('');
  };

  const handleUpdateStatus = (id: string, status: 'completed' | 'canceled') => {
    setAppointments(prevAppointments =>
      prevAppointments.map(app =>
        app.id === id ? { ...app, status } : app
      )
    );
  };

  const handleConfirmAction = () => {
    if (modalState) {
        if (modalState.action === 'completed') {
          const newTransaction: Transaction = {
              id: `t${Date.now()}`,
              description: `Consulta - ${modalState.appointment.patientName}`,
              amount: modalState.appointment.price,
              type: 'income',
              date: modalState.appointment.date,
          };
          setTransactions(prev => [newTransaction, ...prev]);
      }
      handleUpdateStatus(modalState.appointment.id, modalState.action);
      setModalState(null);
    }
  };

  const handleCancelAction = () => {
    setModalState(null);
  };

  const statusClasses = {
    scheduled: 'bg-violet-100 text-violet-800',
    completed: 'bg-emerald-100 text-emerald-800',
    canceled: 'bg-rose-100 text-rose-800'
  };

  const statusLabels = {
    scheduled: 'Agendada',
    completed: 'Realizada',
    canceled: 'Cancelada'
  }

  const scheduledAppointments = appointments
    .filter(a => a.status === 'scheduled')
    .sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());

  const pastAppointments = appointments
    .filter(a => a.status === 'completed' || a.status === 'canceled')
    .sort((a, b) => new Date(`${b.date}T${b.time}`).getTime() - new Date(`${a.date}T${a.time}`).getTime());

  return (
    <ModuleContainer title="Agenda de Consultas" onBack={() => onNavigate('dashboard')}>
      {modalState && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 animate-fade-in" onClick={handleCancelAction}>
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-800">Confirmar Ação</h3>
            <p className="my-4 text-slate-600">
              Você tem certeza que deseja marcar a consulta de <span className="font-semibold">{modalState.appointment.patientName}</span> como
              <span className={`font-semibold ${modalState.action === 'completed' ? 'text-emerald-600' : 'text-rose-600'}`}>
                {modalState.action === 'completed' ? ' Realizada' : ' Cancelada'}
              </span>?
              {modalState.action === 'completed' && <span className="block text-sm mt-2">Isso irá gerar uma receita de <span className="font-bold">{modalState.appointment.price.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</span>.</span>}
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={handleCancelAction}
                className="px-4 py-2 rounded-md bg-slate-200 text-slate-800 hover:bg-slate-300 transition-colors"
              >
                Voltar
              </button>
              <button
                onClick={handleConfirmAction}
                className={`px-4 py-2 rounded-md text-white transition-colors ${
                  modalState.action === 'completed'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                Sim, confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card Agendar Nova Consulta */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold mb-4 text-slate-700">Agendar Nova Consulta</h3>
            <form onSubmit={handleAddAppointment} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Paciente</label>
                    <select name="patientId" value={newAppointment.patientId} onChange={handleInputChange} className="w-full p-2 border rounded-md bg-white border-slate-300">
                        <option value="">Selecione...</option>
                        {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
              </div>
               <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Tipo de Consulta</label>
                    <select name="consultationTypeId" value={newAppointment.consultationTypeId} onChange={handleInputChange} className="w-full p-2 border rounded-md bg-white border-slate-300">
                        <option value="">Selecione...</option>
                        {consultationTypes.map(ct => <option key={ct.id} value={ct.id}>{ct.name}</option>)}
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Data</label>
                    <input type="date" name="date" value={newAppointment.date} onChange={handleInputChange} className="w-full p-2 border rounded-md border-slate-300 bg-white" />
                </div>
              <div className="flex items-end gap-2">
                 <div className="flex-grow">
                    <label className="block text-sm font-medium text-slate-600 mb-1">Horário</label>
                    <input type="time" name="time" value={newAppointment.time} onChange={handleInputChange} className="w-full p-2 border rounded-md border-slate-300 bg-white" />
                </div>
                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 h-10">Agendar</button>
              </div>
            </form>
            {formError && <p className="text-red-500 text-sm mt-2">{formError}</p>}
        </div>

        {/* Card Próximas Consultas */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold mb-4 text-slate-700">Próximas Consultas</h3>
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {scheduledAppointments.length > 0 ? scheduledAppointments.map(app => (
                <div key={app.id} className="bg-slate-50 p-4 rounded-md border border-slate-200 flex flex-col sm:flex-row sm:justify-between sm:items-center">
                    <div className="mb-3 sm:mb-0">
                    <p className="font-bold text-slate-800">{app.patientName}</p>
                    <p className="text-sm text-slate-500">{new Date(app.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})} às {app.time}</p>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                        onClick={() => setModalState({ appointment: app, action: 'completed' })}
                        className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full hover:bg-emerald-200 transition-colors"
                        aria-label={`Marcar consulta de ${app.patientName} como realizada`}
                    >
                        Realizada
                    </button>
                    <button
                        onClick={() => setModalState({ appointment: app, action: 'canceled' })}
                        className="text-xs font-semibold bg-rose-100 text-rose-800 px-3 py-1 rounded-full hover:bg-rose-200 transition-colors"
                        aria-label={`Cancelar consulta de ${app.patientName}`}
                    >
                        Cancelar
                    </button>
                    </div>
                </div>
                )) : <p className="text-slate-500 text-center py-4">Nenhuma consulta agendada.</p>}
            </div>
        </div>

        {/* Card Histórico de Consultas */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold mb-4 text-slate-700">Histórico de Consultas</h3>
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {pastAppointments.length > 0 ? pastAppointments.map(app => (
                <div key={app.id} className="bg-slate-50 p-4 rounded-md border border-slate-200 flex flex-wrap justify-between items-center opacity-90">
                <div>
                    <p className="font-bold text-slate-600">{app.patientName}</p>
                    <p className="text-sm text-slate-500">{new Date(app.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})} às {app.time}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusClasses[app.status]}`}>
                    {statusLabels[app.status]}
                </span>
                </div>
            )) : <p className="text-slate-500 text-center py-4">Nenhum histórico de consultas encontrado.</p>}
            </div>
        </div>
      </div>
    </ModuleContainer>
  );
};

export default AppointmentScheduler;