
import React from 'react';
import { NotificationLog } from '../types';
import CloseIcon from './icons/CloseIcon';

interface NotificationModalProps {
  onClose: () => void;
  logs: NotificationLog[];
}

const NotificationModal: React.FC<NotificationModalProps> = ({ onClose, logs }) => {
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
            <h3 className="text-xl font-bold text-slate-800">Notificações</h3>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                <CloseIcon />
            </button>
        </div>
        
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
            {logs.length > 0 ? (
                logs.map(log => (
                    <div key={log.id} className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm">
                        <div className="flex justify-between items-start mb-1">
                            <p className="font-bold text-slate-700">{log.patientName}</p>
                            <span className="text-xs text-slate-400">{new Date(log.date).toLocaleString()}</span>
                        </div>
                        <p className="text-slate-600">{log.details}</p>
                        <div className="mt-2 flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${log.status === 'sent' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                                {log.status === 'sent' ? 'Enviado' : 'Pendente'}
                            </span>
                            <span className="text-xs text-slate-400 uppercase font-semibold">{log.type}</span>
                        </div>
                    </div>
                ))
            ) : (
                <div className="text-center py-8 text-slate-500">
                    <p>Nenhuma notificação registrada.</p>
                </div>
            )}
        </div>

        <div className="flex justify-end p-6 border-t border-slate-100">
          <button onClick={onClose} className="px-6 py-2.5 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium transition-colors">
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;
