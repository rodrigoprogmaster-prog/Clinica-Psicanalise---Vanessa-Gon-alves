import React, { useMemo, useState } from 'react';
import { View, SessionNote, Anamnesis, InternalObservation, Patient, Appointment, Transaction } from '../types';
import ModuleContainer from './ModuleContainer';
import { getTodayString } from '../utils/formatting';
import PrintIcon from './icons/PrintIcon';

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

  const handleSaveNote = () => {
    if (newNote.trim() && patientId) {
        const note: SessionNote = {
            id: `n${Date.now()}`,
            patientId,
            date: new Date().toISOString(),
            content: newNote
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
    if (todayAppointment && newNote.trim()) {
      // 1. Save the session note
      const note: SessionNote = {
          id: `n${Date.now()}`,
          patientId: todayAppointment.patientId,
          date: new Date().toISOString(),
          content: newNote,
          appointmentId: todayAppointment.id
      };
      setNotes(prev => [note, ...prev]);
      setNewNote('');

      // 2. Update appointment status
      setAppointments(prev => prev.map(app => 
        app.id === todayAppointment.id ? { ...app, status: 'completed' } : app
      ));
      
      // 3. Create transaction
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
  
  const handlePrintNote = (note: SessionNote) => {
    if (!patient) return;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        const noteDate = new Date(note.date);
        const formattedDate = noteDate.toLocaleDateString('pt-BR');
        printWindow.document.title = `${patient.name} - ${formattedDate}`;
        
        printWindow.document.write(`
            <html>
                <head>
                    <title>${patient.name} - ${formattedDate}</title>
                    <style>
                        body { font-family: 'Inter', sans-serif; margin: 2rem; color: #333; }
                        h1, h2 { color: #111; }
                        h1 { font-size: 1.5rem; }
                        h2 { font-size: 1.2rem; border-bottom: 1px solid #ccc; padding-bottom: 0.5rem; margin-top: 2rem;}
                        p { white-space: pre-wrap; line-height: 1.6; }
                        .meta { color: #555; font-size: 0.9rem; margin-bottom: 0.5rem; }
                        @media print {
                            @page { size: A4; margin: 1in; }
                            body { margin: 0; }
                        }
                    </style>
                </head>
                <body>
                    <h1>Anotação de Sessão</h1>
                    <p class="meta"><strong>Paciente:</strong> ${patient.name}</p>
                    <p class="meta"><strong>Data:</strong> ${noteDate.toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'short' })}</p>
                    <h2>Conteúdo da Anotação</h2>
                    <p>${note.content.replace(/\n/g, '<br>')}</p>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    }
  };

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

  const statusClasses: {[key: string]: string} = {
    scheduled: 'bg-violet-100 text-violet-800',
    completed: 'bg-emerald-100 text-emerald-800',
    canceled: 'bg-rose-100 text-rose-800'
  };

  const statusLabels: {[key: string]: string} = {
    scheduled: 'Agendada',
    completed: 'Realizada',
    canceled: 'Cancelada'
  };
  
  return (
    <ModuleContainer title={`PEP de ${patient.name}`} onBack={() => onNavigate('patients')}>
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
                  <p className="text-sm">Finalize a consulta após registrar as anotações da sessão.</p>
              </div>
              <button 
                onClick={handleFinalizeConsultation} 
                className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 font-semibold disabled:bg-emerald-300 disabled:cursor-not-allowed"
                disabled={!newNote.trim()}
                title={!newNote.trim() ? 'Escreva uma anotação para finalizar' : 'Finalizar Consulta'}
              >
                  Finalizar Consulta
              </button>
          </div>
      )}

      <div className="space-y-6">
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
                <div className="flex justify-between items-start">
                  <p className="font-semibold text-sm text-slate-600 mb-2">{new Date(note.date).toLocaleDateString('pt-BR', {timeZone: 'UTC', day:'2-digit', month:'long', year:'numeric'})}</p>
                  <button onClick={() => handlePrintNote(note)} className="p-1 text-slate-500 hover:text-indigo-600" title="Imprimir / Salvar PDF">
                    <PrintIcon />
                  </button>
                </div>
                <p className="text-slate-700 whitespace-pre-wrap">{note.content}</p>
              </div>
            )) : <p className="text-slate-500 text-center py-4">Nenhuma anotação de sessão encontrada.</p>}
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

        {/* Card Observações Internas */}
        <div className="bg-white p-6 rounded-lg shadow-sm border animate-fade-in">
          <h3 className="text-lg font-semibold text-slate-700 mb-2">Nova Observação Interna</h3>
           <p className="text-sm text-slate-500 mb-3">Estas notas são privadas e visíveis apenas para você.</p>
          <textarea value={newObservation} onChange={(e) => setNewObservation(e.target.value)} className="w-full p-2 border rounded-md h-32 bg-white border-slate-300" placeholder="Digite suas observações, hipóteses ou insights..."></textarea>
          <div className="text-right mt-2 mb-6">
              <button onClick={handleSaveObservation} className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">Salvar Observação</button>
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
      </div>
    </ModuleContainer>
  );
};

export default ElectronicHealthRecord;