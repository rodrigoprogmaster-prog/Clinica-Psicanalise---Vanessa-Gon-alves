import React, { useMemo } from 'react';
import { View, SessionNote, Patient } from '../types';
import ModuleContainer from './ModuleContainer';

interface RecordsHistoryProps {
  onNavigate: (view: View) => void;
  notes: SessionNote[];
  patients: Patient[];
  onViewPEP: (patientId: string) => void;
}

const RecordsHistory: React.FC<RecordsHistoryProps> = ({ onNavigate, notes, patients, onViewPEP }) => {

  const records = useMemo(() => {
    return notes
      .map(note => {
        const patient = patients.find(p => p.id === note.patientId);
        return {
          ...note,
          patientName: patient ? patient.name : 'Paciente Desconhecido'
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [notes, patients]);

  return (
    <ModuleContainer title="Histórico de Prontuários" onBack={() => onNavigate('dashboard')}>
      <p className="text-slate-500 mb-6">
        Abaixo estão todas as anotações de sessão salvas, ordenadas da mais recente para a mais antiga.
      </p>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-slate-600">Data</th>
              <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-slate-600">Paciente</th>
              <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-slate-600">Ação</th>
            </tr>
          </thead>
          <tbody className="text-slate-700">
            {records.length > 0 ? records.map(record => (
              <tr key={record.id} className="border-b border-slate-200 hover:bg-slate-50">
                <td className="py-3 px-4 text-sm">
                  {new Date(record.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' })}
                </td>
                <td className="py-3 px-4 font-medium">{record.patientName}</td>
                <td className="py-3 px-4">
                  <button
                    onClick={() => onViewPEP(record.patientId)}
                    className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-semibold hover:bg-indigo-200"
                  >
                    Ver no PEP
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={3} className="text-center py-10 text-slate-500">
                  Nenhum registro clínico encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </ModuleContainer>
  );
};

export default RecordsHistory;