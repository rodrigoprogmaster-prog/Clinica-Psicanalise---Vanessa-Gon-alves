import React, { useMemo } from 'react';
import { Appointment } from '../types';
import CloseIcon from './icons/CloseIcon';

interface MyDaySidebarProps {
  show: boolean;
  onClose: () => void;
  appointments: Appointment[];
}

const MyDaySidebar: React.FC<MyDaySidebarProps> = ({ show, onClose, appointments }) => {
  const { todayAppointments, tomorrowAppointments } = useMemo(() => {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    
    const todayString = today.toISOString().split('T')[0];
    const tomorrowString = tomorrow.toISOString().split('T')[0];
    
    const todayApps = appointments
      .filter(app => app.date === todayString && app.status === 'scheduled')
      .sort((a, b) => a.time.localeCompare(b.time));
      
    const tomorrowApps = appointments
      .filter(app => app.date === tomorrowString && app.status === 'scheduled')
      .sort((a, b) => a.time.localeCompare(b.time));
      
    return { todayAppointments: todayApps, tomorrowAppointments: tomorrowApps };
  }, [appointments]);

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black bg-opacity-60 z-40 transition-opacity duration-300 ${show ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      ></div>
      <aside 
        className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${show ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="p-4 border-b flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-800">Meu Dia</h3>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800">
                <CloseIcon />
            </button>
        </div>
        <div className="p-4 space-y-6 overflow-y-auto h-[calc(100vh-65px)]">
            <section>
                <h4 className="font-semibold text-slate-700 mb-2">Consultas de Hoje</h4>
                {todayAppointments.length > 0 ? (
                    <div className="space-y-2">
                        {todayAppointments.map(app => (
                            <div key={app.id} className="bg-slate-50 p-2.5 rounded-md border border-slate-200">
                                <p className="font-semibold text-sm text-slate-700">{app.patientName}</p>
                                <p className="text-xs text-slate-500">Horário: {app.time}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-slate-500 text-center py-4">Nenhuma consulta para hoje.</p>
                )}
            </section>
            <section>
                <h4 className="font-semibold text-slate-700 mb-2">Consultas de Amanhã</h4>
                {tomorrowAppointments.length > 0 ? (
                    <div className="space-y-2">
                        {tomorrowAppointments.map(app => (
                            <div key={app.id} className="bg-slate-50 p-2.5 rounded-md border border-slate-200">
                                <p className="font-semibold text-sm text-slate-700">{app.patientName}</p>
                                <p className="text-xs text-slate-500">Horário: {app.time}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-slate-500 text-center py-4">Nenhuma consulta para amanhã.</p>
                )}
            </section>
        </div>
      </aside>
    </>
  );
};

export default MyDaySidebar;