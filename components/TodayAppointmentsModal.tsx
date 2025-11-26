
import React, { useMemo } from 'react';
import { Appointment } from '../types';
import CloseIcon from './icons/CloseIcon';
import { getTodayString } from '../utils/formatting';

interface TodayAppointmentsModalProps {
  onClose: () => void;
  appointments: Appointment[];
}

const TodayAppointmentsModal: React.FC<TodayAppointmentsModalProps> = ({ onClose, appointments }) => {
  const todayAppointments = useMemo(() => {
    const todayString = getTodayString();
    return appointments
      .filter(app => app.date === todayString && app.status === 'scheduled')
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [appointments]);

  if (todayAppointments.length === 0) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 transition-opacity duration-300 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 transform transition-transform duration-300 animate-slide-up overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
            <h3 className="text-xl font-bold text-slate-800">Consultas de Hoje</h3>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                <CloseIcon />
            </button>
        </div>
        
        <div className="p-6 space-y-3 max-h-80 overflow-y-auto">
            {todayAppointments.map(app => (
                <div key={app.id} className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex justify-between items-center">
                    <div>
                        <p className="font-semibold text-slate-700">{app.patientName}</p>
                        <p className="text-sm text-slate-500">Horário: {app.time}</p>
                    </div>
                    <span className="bg-violet-100 text-violet-800 text-xs font-semibold px-3 py-1 rounded-full">
                        Agendada
                    </span>
                </div>
            ))}
        </div>

        <div className="flex justify-end p-6 border-t border-slate-100">
          <button 
            onClick={onClose} 
            className="px-6 py-2.5 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-colors font-medium shadow-sm"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default TodayAppointmentsModal;
