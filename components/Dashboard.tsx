
import React, { useState, useMemo } from 'react';
import { View, Appointment } from '../types';
import Card from './Card';
import PatientIcon from './icons/PatientIcon';
import CalendarIcon from './icons/CalendarIcon';
import FileTextIcon from './icons/FileTextIcon';
import DollarSignIcon from './icons/DollarSignIcon';
import SettingsIcon from './icons/SettingsIcon';
import ChartBarIcon from './icons/ChartBarIcon';
import BellIcon from './icons/BellIcon';
import CloseIcon from './icons/CloseIcon';
import { getTodayString } from '../utils/formatting';

interface DashboardProps {
  onNavigate: (view: View) => void;
  onViewPEP: (patientId: string) => void;
  appointments: Appointment[];
  onNavigateToPatients: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate, appointments, onViewPEP, onNavigateToPatients }) => {
  const [showNotification, setShowNotification] = useState(true);

  const upcomingAppointmentsToday = useMemo(() => {
    const todayString = getTodayString();
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    return appointments
      .filter(app => app.date === todayString && app.status === 'scheduled' && app.time >= currentTime)
      .sort((a,b) => a.time.localeCompare(b.time));
  }, [appointments]);
  
  const handleCloseNotification = () => {
    setShowNotification(false);
  };

  return (
    <div>
      {showNotification && upcomingAppointmentsToday.length > 0 && (
        <div className="bg-purple-100 border-l-4 border-purple-500 text-purple-800 p-4 mb-6 rounded-md shadow-sm relative animate-fade-in" role="alert">
          <div className="flex">
            <div className="py-1">
              <BellIcon />
            </div>
            <div className="ml-3">
              <p className="font-bold">Próximas Consultas de Hoje</p>
              <ul className="list-disc list-inside text-sm mt-1">
                {upcomingAppointmentsToday.map(app => (
                  <li key={app.id}>
                    <button 
                      onClick={() => onViewPEP(app.patientId)} 
                      className="font-semibold text-purple-800 hover:underline"
                    >
                      {app.patientName}
                    </button>
                    <span> às {app.time}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <button 
            onClick={handleCloseNotification} 
            className="absolute top-3 right-3 text-purple-600 hover:text-purple-800"
            aria-label="Fechar notificação"
          >
            <CloseIcon />
          </button>
        </div>
      )}

      <h2 className="text-2xl font-semibold text-slate-700">Painel Principal</h2>
      <p className="text-slate-500 mt-1 mb-6">Bem-vinda, Vanessa Gonçalves.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card
          title="Dashboard Gerencial"
          description="Visualize KPIs, gráficos e métricas da clínica"
          icon={<ChartBarIcon />}
          onClick={() => onNavigate('managementDashboard')}
        />
        <Card
          title="Pacientes"
          description="Cadastre e gerencie os dados dos pacientes"
          icon={<PatientIcon />}
          onClick={onNavigateToPatients}
        />
        <Card
          title="Agendamento de Consultas"
          description="Visualize e agende novas consultas"
          icon={<CalendarIcon />}
          onClick={() => onNavigate('schedule')}
        />
        <Card
          title="Prontuário Eletrônico"
          description="Acesse o histórico central de anotações clínicas"
          icon={<FileTextIcon />}
          onClick={() => onNavigate('recordsHistory')}
          isActionable={true}
        />
        <Card
          title="Financeiro"
          description="Controle o fluxo de caixa, receitas e despesas"
          icon={<DollarSignIcon />}
          onClick={() => onNavigate('financial')}
        />
        <Card
          title="Administrativo"
          description="Relatórios gerais da clínica"
          icon={<SettingsIcon />}
          onClick={() => onNavigate('admin')}
        />
      </div>
    </div>
  );
};

export default Dashboard;