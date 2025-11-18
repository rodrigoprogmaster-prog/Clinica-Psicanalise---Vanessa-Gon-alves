import React, { useMemo, useState } from 'react';
import { View, SessionNote, Patient } from '../types';
import ModuleContainer from './ModuleContainer';

interface RecordsHistoryProps {
  onNavigate: (view: View) => void;
  notes: SessionNote[];
  patients: Patient[];
  onViewPEP: (patientId: string) => void;
}

const RecordsHistory: React.FC<RecordsHistoryProps> = ({ onNavigate, notes, patients, onViewPEP }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');

  const patientRecords = useMemo(() => {
    // Create a map of patientId -> latest note date
    const latestNotesMap = new Map<string, string>();
    notes.forEach(note => {
        const existingDate = latestNotesMap.get(note.patientId);
        if (!existingDate || new Date(note.date) > new Date(existingDate)) {
            latestNotesMap.set(note.patientId, note.date);
        }
    });

    // Map patients to records, including the latest note date
    let records = patients
        .filter(patient => latestNotesMap.has(patient.id)) // Only patients with notes
        .map(patient => ({
            patientId: patient.id,
            patientName: patient.name,
            lastNoteDate: latestNotesMap.get(patient.id)!
        }));

    // Apply search term filter
    if (searchTerm) {
        records = records.filter(record =>
            record.patientName.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    // Apply date filter (check if ANY note for that patient was on that date)
    if (filterDate) {
        const patientIdsOnDate = new Set(
            notes.filter(note => note.date.startsWith(filterDate)).map(note => note.patientId)
        );
        records = records.filter(record => patientIdsOnDate.has(record.patientId));
    }

    // Sort by most recent note date
    return records.sort((a, b) => new Date(b.lastNoteDate).getTime() - new Date(a.lastNoteDate).getTime());
  }, [notes, patients, searchTerm, filterDate]);

  return (
    <ModuleContainer title="Histórico de Prontuários" onBack={() => onNavigate('dashboard')}>
      <p className="text-slate-500 mb-6">
        Busque por pacientes que possuem registros clínicos. Acesse o PEP para ver o histórico completo de anotações.
      </p>
      
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Buscar por nome do paciente..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full p-2 border rounded-md bg-white border-slate-300 flex-grow"
          />
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
              className="w-full sm:w-auto p-2 border rounded-md bg-white border-slate-300"
            />
            <button
              onClick={() => { setSearchTerm(''); setFilterDate(''); }}
              className="px-4 py-2 rounded-md bg-slate-200 text-slate-800 hover:bg-slate-300"
            >
              Limpar
            </button>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-slate-600">Data do Último Registro</th>
              <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-slate-600">Paciente</th>
              <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-slate-600">Ação</th>
            </tr>
          </thead>
          <tbody className="text-slate-700">
            {patientRecords.length > 0 ? patientRecords.map(record => (
              <tr key={record.patientId} className="border-b border-slate-200 hover:bg-slate-50">
                <td className="py-3 px-4 text-sm">
                  {new Date(record.lastNoteDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' })}
                </td>
                <td className="py-3 px-4 font-medium">{record.patientName}</td>
                <td className="py-3 px-4">
                  <button
                    onClick={() => onViewPEP(record.patientId)}
                    className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-semibold hover:bg-indigo-200"
                  >
                    Acessar PEP
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={3} className="text-center py-10 text-slate-500">
                  Nenhum registro clínico encontrado para os filtros aplicados.
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