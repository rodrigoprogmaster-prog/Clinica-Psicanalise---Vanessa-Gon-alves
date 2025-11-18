import React, { useMemo, useState } from 'react';
import { View, SessionNote, Anamnesis, InternalObservation, Patient } from '../types';
import ModuleContainer from './ModuleContainer';

interface ElectronicHealthRecordProps {
  onNavigate: (view: View) => void;
  patientId: string | null;
  patients: Patient[];
  setPatients: React.Dispatch<React.SetStateAction<Patient[]>>;
  notes: SessionNote[];
  setNotes: React.Dispatch<React.SetStateAction<SessionNote[]>>;
  observations: InternalObservation[];
  setObservations: React.Dispatch<React.SetStateAction<InternalObservation[]>>;
}

const ElectronicHealthRecord: React.FC<ElectronicHealthRecordProps> = ({ 
  onNavigate, 
  patientId,
  patients,
  setPatients,
  notes,
  setNotes,
  observations,
  setObservations
}) => {
  const patient = useMemo(() => patients.find(p => p.id === patientId), [patientId, patients]);
  const patientNotes = useMemo(() => notes.filter(n => n.patientId === patientId).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [notes, patientId]);
  const patientObservations = useMemo(() => observations.filter(o => o.patientId === patientId).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [observations, patientId]);
  
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
  
  return (
    <ModuleContainer title={`PEP de ${patient.name}`} onBack={() => onNavigate('patients')}>
      <div className="bg-slate-50 p-4 rounded-lg mb-6 border grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2 text-sm text-slate-700">
          <p><span className="font-semibold">Email:</span> {patient.email}</p>
          <p><span className="font-semibold">Telefone:</span> {patient.phone || 'N/A'}</p>
          <p><span className="font-semibold">Nascimento:</span> {new Date(patient.dateOfBirth).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</p>
          <p><span className="font-semibold">Profissão:</span> {patient.occupation}</p>
          <p className="sm:col-span-2 lg:col-span-3"><span className="font-semibold">Endereço:</span> {patient.address}</p>
      </div>

      <div className="space-y-6">
        {/* Card Histórico de Sessões */}
        <div className="bg-white p-6 rounded-lg shadow-sm border animate-fade-in">
          <h3 className="text-lg font-semibold text-slate-700 mb-2">Nova Anotação de Sessão</h3>
          <textarea value={newNote} onChange={(e) => setNewNote(e.target.value)} className="w-full p-2 border rounded-md h-32 bg-white border-slate-300" placeholder="Digite as anotações da sessão aqui..."></textarea>
          <div className="text-right mt-2 mb-6">
              <button onClick={handleSaveNote} className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">Salvar Anotação</button>
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
        
        {/* Card Evolução (Placeholder for future implementation) */}
        <div className="bg-white p-6 rounded-lg shadow-sm border animate-fade-in opacity-70">
           <div className="space-y-6">
               <div>
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">Objetivos Terapêuticos</h3>
                  <textarea disabled className="w-full p-2 border rounded-md h-40 bg-slate-100 border-slate-300" placeholder="Funcionalidade de Evolução em desenvolvimento..."></textarea>
               </div>
               <div>
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">Resumo da Evolução</h3>
                  <textarea disabled className="w-full p-2 border rounded-md h-48 bg-slate-100 border-slate-300" placeholder="Funcionalidade de Evolução em desenvolvimento..."></textarea>
               </div>
               <div className="text-right">
                  <button disabled className="bg-indigo-400 text-white px-4 py-2 rounded-md cursor-not-allowed">Salvar Evolução</button>
               </div>
           </div>
        </div>
      </div>
    </ModuleContainer>
  );
};

export default ElectronicHealthRecord;