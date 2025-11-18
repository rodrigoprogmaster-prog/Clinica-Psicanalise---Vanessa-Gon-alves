import React, { useMemo, useState } from 'react';
import { View, SessionNote, Anamnesis, InternalObservation, Patient, Appointment, Transaction } from '../types';
import ModuleContainer from './ModuleContainer';
import { getTodayString } from '../utils/formatting';
import PrintIcon from './icons/PrintIcon';

const Tooltip: React.FC<{ text: string }> = ({ text }) => (
  <span className="absolute right-0 bottom-full mb-2 w-max max-w-xs p-2 text-xs text-white bg-slate-700 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
    {text}
    <svg className="absolute text-slate-700 h-2 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255">
      <polygon className="fill-current" points="0,0 127.5,127.5 255,0"/>
    </svg>
  </span>
);

interface ElectronicHealthRecordProps {
  onNavigate: (view: View) => void;
  patientId: string | null;
  patients: Patient[];
  setPatients: React.Dispatch<React.SetStateAction<Patient[]>>;
  notes: SessionNote[];
  setNotes: React.Dispatch<React.SetStateAction<SessionNote[]>>;
  observations: InternalObservation[];
  setObservations: React.Dispatch<React.SetStateAction<InternalObservation[]>>;
  appointments: Appointment[];
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
}

const ElectronicHealthRecord: React.FC<ElectronicHealthRecordProps> = ({ 
  onNavigate, 
  patientId,
  patients,
  setPatients,
  notes,
  setNotes,
  observations,
  setObservations,
  appointments,
  setAppointments,
  setTransactions
}) => {
  const patient = useMemo(() => patients.find(p => p.id === patientId), [patientId, patients]);
  const patientNotes = useMemo(() => notes.filter(n => n.patientId === patientId).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [notes, patientId]);
  const patientObservations = useMemo(() => observations.filter(o => o.patientId === patientId).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [observations, patientId]);
  const patientAppointments = useMemo(() => appointments.filter(a => a.patientId === patientId).sort((a,b) => new Date(`${b.date}T${b.time}`).getTime() - new Date(`${a.date}T${a.time}`).getTime()), [appointments, patientId]);

  const todayAppointment = useMemo(() => {
    const todayString = getTodayString();
    return appointments.find(app => app.patientId === patientId && app.date === todayString && app.status === 'scheduled');
  }, [appointments, patientId]);

  const [newNote, setNewNote] = useState('');
  const [newObservation, setNewObservation] = useState('');
  const [isAnamnesisFormVisible, setIsAnamnesisFormVisible] = useState(!patient?.anamnesis);
  const [anamnesisForm, setAnamnesisForm] = useState<Anamnesis>(patient?.anamnesis || {
    mainComplaint: '', historyOfComplaint: '', personalHistory: '', familyHistory: ''
  });

  const isAnamnesisComplete = useMemo(() => {
    return patient?.anamnesis &&
           patient.anamnesis.mainComplaint.trim() !== '' &&
           patient.anamnesis.historyOfComplaint.trim() !== '' &&
           patient.anamnesis.personalHistory.trim() !== '' &&
           patient.anamnesis.familyHistory.trim() !== '';
  }, [patient?.anamnesis]);

  const hasTodayNoteSaved = useMemo(() => {
    if (!todayAppointment) return false;
    return patientNotes.some(note => note.appointmentId === todayAppointment.id);
  }, [patientNotes, todayAppointment]);
  
  const canFinalize = isAnamnesisComplete && hasTodayNoteSaved;
  
  const statusClasses: {[key: string]: string} = {
    scheduled: 'bg-violet-100 text-violet-800 status-scheduled',
    completed: 'bg-emerald-100 text-emerald-800 status-completed',
    canceled: 'bg-rose-100 text-rose-800 status-canceled'
  };

  const statusLabels: {[key: string]: string} = {
    scheduled: 'Agendada',
    completed: 'Realizada',
    canceled: 'Cancelada'
  };

  const handleSaveNote = () => {
    if (newNote.trim() && patientId) {
        const note: SessionNote = {
            id: `n${Date.now()}`,
            patientId,
            date: new Date().toISOString(),
            content: newNote,
            appointmentId: todayAppointment?.id
        };
        setNotes(prev => [note, ...prev]);
        setNewNote('');
    }
  };

  const handleSaveObservation = () => {
    if (newObservation.trim() && patientId) {
        const observation: InternalObservation = {
            id: `o${Date.now()}`,
            patientId,
            date: new Date().toISOString(),
            content: newObservation
        };
        setObservations(prev => [observation, ...prev]);
        setNewObservation('');
    }
  };

  const handleSaveAnamnesis = () => {
    if(patient) {
      const updatedPatient = {...patient, anamnesis: anamnesisForm };
      setPatients(prev => prev.map(p => p.id === patient.id ? updatedPatient : p));
    }
    setIsAnamnesisFormVisible(false);
  };

  const handleFinalizeConsultation = () => {
    if (todayAppointment && canFinalize) {
      if(newObservation.trim() !== '') {
        handleSaveObservation();
      }
      setAppointments(prev => prev.map(app => 
        app.id === todayAppointment.id ? { ...app, status: 'completed' } : app
      ));
      const newTransaction: Transaction = {
        id: `t${Date.now()}`,
        description: `Consulta - ${todayAppointment.patientName}`,
        amount: todayAppointment.price,
        type: 'income',
        date: todayAppointment.date,
        patientId: todayAppointment.patientId,
      };
      setTransactions(prev => [newTransaction, ...prev]);
    }
  };
  
  const handleExportPEPToPDF = () => {
    if (!patient) return;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        const todayString = new Date().toISOString().slice(0, 10);
        printWindow.document.title = `Prontuário - ${patient.name} - ${todayString}`;
        
        let reportHTML = `
            <html>
                <head>
                    <title>Prontuário - ${patient.name}</title>
                    <style>
                        body { font-family: 'Inter', sans-serif; margin: 2rem; color: #333; font-size: 12px; }
                        h1, h2, h3 { color: #111; margin: 0; padding: 0;}
                        h1 { font-size: 24px; text-align: center; margin-bottom: 1rem; color: #3730a3; }
                        h2 { font-size: 18px; border-bottom: 2px solid #3730a3; color: #3730a3; padding-bottom: 0.5rem; margin-top: 2rem; margin-bottom: 1rem; }
                        h3 { font-size: 14px; font-weight: bold; margin-top: 1rem; color: #4338ca; }
                        p { margin: 0.5rem 0; line-height: 1.6; white-space: pre-wrap; }
                        .patient-info { background-color: #f3f4f6; padding: 1rem; border-radius: 8px; margin-bottom: 2rem; border: 1px solid #e5e7eb; }
                        .patient-info p { margin: 0.25rem 0; }
                        .section { margin-bottom: 1.5rem; page-break-inside: avoid; }
                        .history-item { border: 1px solid #e5e7eb; border-radius: 8px; padding: 1rem; margin-bottom: 1rem; background: #fafafa; }
                        .history-item-header { font-weight: bold; color: #555; margin-bottom: 0.5rem; }
                        .appointment-item { display: flex; justify-content: space-between; padding: 0.75rem 0.5rem; border-bottom: 1px solid #eee; }
                        .appointment-item:last-child { border-bottom: none; }
                        .status-scheduled { color: #5b21b6; font-weight: bold; }
                        .status-completed { color: #059669; font-weight: bold; }
                        .status-canceled { color: #dc2626; font-weight: bold; }
                        @media print {
                            @page { size: A4; margin: 1in; }
                            body { margin: 0; font-size: 10pt; }
                            .no-print { display: none; }
                        }
                    </style>
                </head>
                <body>
                    <h1>Prontuário Clínico</h1>`;

        reportHTML += `
            <div class="patient-info">
                <h3>Dados do Paciente</h3>
                <p><strong>Nome:</strong> ${patient.name}</p>
                <p><strong>Email:</strong> ${patient.email}</p>
                <p><strong>Telefone:</strong> ${patient.phone || 'N/A'}</p>
                <p><strong>Nascimento:</strong> ${new Date(patient.dateOfBirth).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</p>
            </div>`;

        reportHTML += `<div class="section"><h2>Anamnese / Ficha Clínica Inicial</h2>`;
        if (patient.anamnesis && isAnamnesisComplete) {
            reportHTML += `
                <h3>Queixa Principal</h3><p>${patient.anamnesis.mainComplaint}</p>
                <h3>Histórico da Queixa Atual</h3><p>${patient.anamnesis.historyOfComplaint}</p>
                <h3>História Pessoal Relevante</h3><p>${patient.anamnesis.personalHistory}</p>
                <h3>História Familiar</h3><p>${patient.anamnesis.familyHistory}</p>`;
        } else {
            reportHTML += `<p>Anamnese não preenchida.</p>`;
        }
        reportHTML += `</div>`;
        
        reportHTML += `<div class="section"><h2>Histórico de Anotações de Sessão</h2>`;
        if (patientNotes.length > 0) {
            [...patientNotes].reverse().forEach(note => {
                reportHTML += `<div class="history-item"><p class="history-item-header">Data: ${new Date(note.date).toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short', timeZone: 'UTC' })}</p><p>${note.content.replace(/\n/g, '<br>')}</p></div>`;
            });
        } else {
            reportHTML += `<p>Nenhuma anotação de sessão encontrada.</p>`;
        }
        reportHTML += `</div>`;

        reportHTML += `<div class="section"><h2>Histórico de Observações Internas</h2>`;
        if (patientObservations.length > 0) {
            [...patientObservations].reverse().forEach(obs => {
                reportHTML += `<div class="history-item"><p class="history-item-header">Data: ${new Date(obs.date).toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short', timeZone: 'UTC' })}</p><p>${obs.content.replace(/\n/g, '<br>')}</p></div>`;
            });
        } else {
            reportHTML += `<p>Nenhuma observação interna encontrada.</p>`;
        }
        reportHTML += `</div>`;

        reportHTML += `<div class="section"><h2>Histórico de Consultas</h2>`;
        if (patientAppointments.length > 0) {
            patientAppointments.forEach(app => {
                reportHTML += `<div class="appointment-item"><span>${new Date(app.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})} às ${app.time}</span><span class="${statusClasses[app.status]}">${statusLabels[app.status]}</span></div>`;
            });
        } else {
            reportHTML += `<p>Nenhum histórico de consultas encontrado.</p>`;
        }
        reportHTML += `</div>`;
        
        reportHTML += `</body></html>`;
        
        printWindow.document.write(reportHTML);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
    }
  };

  const moduleActions = (
    <div className="group relative">
        <button
            onClick={handleExportPEPToPDF}
            className="p-2 rounded-full text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Exportar Prontuário para PDF"
        >
            <PrintIcon />
        </button>
        <Tooltip text="Exportar Prontuário para PDF" />
    </div>
  );

  if (!patient) {
    return (
      <ModuleContainer title="Prontuário Eletrônico" onBack={() => onNavigate('patients')}>
        <div className="text-center p-8">
          <p className="text-slate-500">Paciente não encontrado ou não selecionado.</p>
          <button onClick={() => onNavigate('patients')} className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">
            Voltar para Pacientes
          </button>
        </div>
      </ModuleContainer>
    );
  }
  
  const getFinalizeButtonTooltip = () => {
    if (canFinalize) return 'Finalizar Consulta';
    const missing = [];
    if (!isAnamnesisComplete) missing.push('Anamnese salva');
    if (!hasTodayNoteSaved) missing.push('Anotação de sessão salva');
    return `Pendente: ${missing.join(', ')}`;
  };

  return (
    <ModuleContainer title={`PEP de ${patient.name}`} onBack={() => onNavigate('patients')} actions={moduleActions}>
      <div className="bg-slate-50 p-4 rounded-lg mb-6 border grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2 text-sm text-slate-700">
          <p><span className="font-semibold">Email:</span> {patient.email}</p>
          <p><span className="font-semibold">Telefone:</span> {patient.phone || 'N/A'}</p>
          <p><span className="font-semibold">Nascimento:</span> {new Date(patient.dateOfBirth).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</p>
          <p><span className="font-semibold">Profissão:</span> {patient.occupation}</p>
          <p className="sm:col-span-2 lg:col-span-3"><span className="font-semibold">Endereço:</span> {patient.address}</p>
      </div>

      {todayAppointment && (
          <div className="bg-emerald-100 border-l-4 border-emerald-500 text-emerald-800 p-4 mb-6 rounded-md shadow-sm flex justify-between items-center">
              <div>
                  <p className="font-bold">Consulta agendada para hoje às {todayAppointment.time}.</p>
                  <p className="text-sm">Salve a Anamnese e a Anotação de Sessão para finalizar.</p>
              </div>
              <button 
                onClick={handleFinalizeConsultation} 
                className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 font-semibold disabled:bg-emerald-300 disabled:cursor-not-allowed"
                disabled={!canFinalize}
                title={getFinalizeButtonTooltip()}
              >
                  Finalizar Consulta
              </button>
          </div>
      )}

      <div className="space-y-6">
        {/* Card Anamnese */}
        <div className="bg-white p-6 rounded-lg shadow-sm border animate-fade-in">
          <h3 className="text-lg font-semibold text-slate-700 mb-4">Anamnese / Ficha Clínica Inicial</h3>
          {isAnamnesisFormVisible ? (
            <div className="space-y-4">
              <div>
                <label className="font-semibold text-slate-600 block mb-1">Queixa Principal</label>
                <textarea value={anamnesisForm.mainComplaint} onChange={e => setAnamnesisForm({...anamnesisForm, mainComplaint: e.target.value})} className="w-full p-2 border rounded-md h-24 bg-white border-slate-300"></textarea>
              </div>
              <div>
                <label className="font-semibold text-slate-600 block mb-1">Histórico da Queixa Atual</label>
                <textarea value={anamnesisForm.historyOfComplaint} onChange={e => setAnamnesisForm({...anamnesisForm, historyOfComplaint: e.target.value})} className="w-full p-2 border rounded-md h-32 bg-white border-slate-300"></textarea>
              </div>
               <div>
                <label className="font-semibold text-slate-600 block mb-1">História Pessoal Relevante</label>
                <textarea value={anamnesisForm.personalHistory} onChange={e => setAnamnesisForm({...anamnesisForm, personalHistory: e.target.value})} className="w-full p-2 border rounded-md h-32 bg-white border-slate-300"></textarea>
              </div>
               <div>
                <label className="font-semibold text-slate-600 block mb-1">História Familiar</label>
                <textarea value={anamnesisForm.familyHistory} onChange={e => setAnamnesisForm({...anamnesisForm, familyHistory: e.target.value})} className="w-full p-2 border rounded-md h-32 bg-white border-slate-300"></textarea>
              </div>
              <div className="text-right mt-4">
                <button onClick={handleSaveAnamnesis} className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700">Salvar Anamnese</button>
              </div>
            </div>
          ) : (
             <div className="space-y-4 bg-slate-50 p-4 rounded-md border">
                <div><h4 className="font-semibold text-slate-600">Queixa Principal</h4><p className="text-slate-700 whitespace-pre-wrap">{patient.anamnesis?.mainComplaint || 'Não preenchido.'}</p></div>
                <div className="pt-2 border-t"><h4 className="font-semibold text-slate-600">Histórico da Queixa Atual</h4><p className="text-slate-700 whitespace-pre-wrap">{patient.anamnesis?.historyOfComplaint || 'Não preenchido.'}</p></div>
                <div className="pt-2 border-t"><h4 className="font-semibold text-slate-600">História Pessoal Relevante</h4><p className="text-slate-700 whitespace-pre-wrap">{patient.anamnesis?.personalHistory || 'Não preenchido.'}</p></div>
                <div className="pt-2 border-t"><h4 className="font-semibold text-slate-600">História Familiar</h4><p className="text-slate-700 whitespace-pre-wrap">{patient.anamnesis?.familyHistory || 'Não preenchido.'}</p></div>
                <div className="text-right mt-4">
                    <button onClick={() => setIsAnamnesisFormVisible(true)} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">Editar Anamnese</button>
                </div>
            </div>
          )}
        </div>

        {/* Card Histórico de Sessões */}
        <div className="bg-white p-6 rounded-lg shadow-sm border animate-fade-in">
          <h3 className="text-lg font-semibold text-slate-700 mb-2">Nova Anotação de Sessão</h3>
          <textarea value={newNote} onChange={(e) => setNewNote(e.target.value)} className="w-full p-2 border rounded-md h-32 bg-white border-slate-300" placeholder="Digite as anotações da sessão aqui..."></textarea>
          <div className="text-right mt-2 mb-6">
              <button onClick={handleSaveNote} className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700" disabled={!newNote.trim()}>Salvar Anotação</button>
          </div>
          <div className="space-y-4">
            {patientNotes.length > 0 ? patientNotes.map(note => (
              <div key={note.id} className="bg-slate-50 p-4 rounded-md border border-slate-200">
                <p className="font-semibold text-sm text-slate-600 mb-2">{new Date(note.date).toLocaleDateString('pt-BR', {timeZone: 'UTC', day:'2-digit', month:'long', year:'numeric'})}</p>
                <p className="text-slate-700 whitespace-pre-wrap">{note.content}</p>
              </div>
            )) : <p className="text-slate-500 text-center py-4">Nenhuma anotação de sessão encontrada.</p>}
          </div>
        </div>
        
        {/* Card Observações Internas */}
        <div className="bg-white p-6 rounded-lg shadow-sm border animate-fade-in">
          <h3 className="text-lg font-semibold text-slate-700 mb-2">Nova Observação Interna</h3>
           <p className="text-sm text-slate-500 mb-3">Estas notas são privadas e visíveis apenas para você.</p>
          <textarea value={newObservation} onChange={(e) => setNewObservation(e.target.value)} className="w-full p-2 border rounded-md h-32 bg-white border-slate-300" placeholder="Digite suas observações, hipóteses ou insights..."></textarea>
          <div className="text-right mt-2 mb-6">
              <button onClick={handleSaveObservation} className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700" disabled={!newObservation.trim()}>Salvar Observação</button>
          </div>
          <div className="space-y-4">
            {patientObservations.length > 0 ? patientObservations.map(obs => (
              <div key={obs.id} className="bg-amber-50 p-4 rounded-md border border-amber-200">
                <p className="font-semibold text-sm text-slate-600 mb-2">{new Date(obs.date).toLocaleDateString('pt-BR', {timeZone: 'UTC', day:'2-digit', month:'long', year:'numeric'})}</p>
                <p className="text-slate-700 whitespace-pre-wrap">{obs.content}</p>
              </div>
            )) : <p className="text-slate-500 text-center py-4">Nenhuma observação interna encontrada.</p>}
          </div>
        </div>

        {/* Card Histórico de Consultas */}
        <div className="bg-white p-6 rounded-lg shadow-sm border animate-fade-in">
            <h3 className="text-lg font-semibold text-slate-700 mb-4">Histórico de Consultas</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {patientAppointments.length > 0 ? patientAppointments.map(app => (
                <div key={app.id} className="bg-slate-50 p-3 rounded-md border border-slate-200 flex flex-wrap justify-between items-center">
                    <div>
                        <p className="font-semibold text-slate-600">{new Date(app.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})} às {app.time}</p>
                        <p className="text-sm text-slate-500">{app.patientName}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusClasses[app.status]}`}>
                        {statusLabels[app.status]}
                    </span>
                </div>
            )) : <p className="text-slate-500 text-center py-4">Nenhum histórico de consultas para este paciente.</p>}
            </div>
        </div>
      </div>
    </ModuleContainer>
  );
};

export default ElectronicHealthRecord;