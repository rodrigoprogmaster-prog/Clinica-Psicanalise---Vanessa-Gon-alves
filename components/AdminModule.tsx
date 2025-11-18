import React, { useMemo } from 'react';
import { View, Patient, Appointment, Transaction } from '../types';
import ModuleContainer from './ModuleContainer';

interface AdminModuleProps {
  onNavigate: (view: View) => void;
  patients: Patient[];
  appointments: Appointment[];
  transactions: Transaction[];
}

const AdminModule: React.FC<AdminModuleProps> = ({ onNavigate, patients, appointments, transactions }) => {

  // Financial Report Calculations
  const financialSummary = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    return {
      income,
      expense,
      balance: income - expense
    };
  }, [transactions]);
  
  // Attendance Report Calculations
  const attendanceSummary = useMemo(() => {
    const summary = new Map<string, { name: string, completed: number, canceled: number, scheduled: number }>();
    appointments.forEach(app => {
        if (!summary.has(app.patientId)) {
            summary.set(app.patientId, { name: app.patientName, completed: 0, canceled: 0, scheduled: 0 });
        }
        const patientStat = summary.get(app.patientId)!;
        patientStat[app.status]++;
    });
    return Array.from(summary.values()).sort((a,b) => a.name.localeCompare(b.name));
  }, [appointments]);

  // Occupancy Report Calculations
  const occupancySummary = useMemo(() => {
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      
      const appointmentsThisMonth = appointments.filter(app => {
          const appDate = new Date(app.date);
          return appDate.getMonth() === currentMonth && appDate.getFullYear() === currentYear && app.status !== 'canceled';
      }).length;
      
      // Assuming 8 available slots per day, 5 days a week
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const weekdaysInMonth = Array.from({length: daysInMonth}, (_, i) => new Date(currentYear, currentMonth, i + 1))
                                   .filter(date => date.getDay() !== 0 && date.getDay() !== 6).length;
      const totalSlots = weekdaysInMonth * 8;
      const occupancy = totalSlots > 0 ? (appointmentsThisMonth / totalSlots) * 100 : 0;

      return {
          appointmentsThisMonth,
          totalSlots,
          occupancy: occupancy.toFixed(1)
      }
  }, [appointments]);

  return (
    <ModuleContainer title="Módulo Administrativo" onBack={() => onNavigate('dashboard')}>
      <div className="space-y-8">
        {/* Reports Section */}
        <section>
          <h2 className="text-2xl font-bold text-slate-800 mb-4 border-b pb-2">Relatórios</h2>
          <div className="space-y-6 mt-4">
            
            {/* Financial Report Card */}
            <div className="bg-white p-6 rounded-lg shadow-sm border animate-fade-in">
              <h3 className="text-lg font-semibold text-slate-700 mb-4">Relatório Financeiro Geral</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-emerald-100 p-4 rounded-lg text-center"><h4 className="text-sm font-semibold text-emerald-800">Receitas</h4><p className="text-2xl font-bold text-emerald-900">{financialSummary.income.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</p></div>
                  <div className="bg-rose-100 p-4 rounded-lg text-center"><h4 className="text-sm font-semibold text-rose-800">Despesas</h4><p className="text-2xl font-bold text-rose-900">{financialSummary.expense.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</p></div>
                  <div className="bg-violet-100 p-4 rounded-lg text-center"><h4 className="text-sm font-semibold text-violet-800">Saldo</h4><p className={`text-2xl font-bold ${financialSummary.balance >= 0 ? 'text-violet-900' : 'text-rose-900'}`}>{financialSummary.balance.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</p></div>
              </div>
            </div>

            {/* Attendance Report Card */}
            <div className="bg-white p-6 rounded-lg shadow-sm border animate-fade-in">
              <h3 className="text-lg font-semibold text-slate-700 mb-4">Relatório de Atendimentos por Paciente</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left py-2 px-3 text-slate-600">Paciente</th>
                      <th className="text-center py-2 px-3 text-slate-600">Realizadas</th>
                      <th className="text-center py-2 px-3 text-slate-600">Canceladas</th>
                      <th className="text-center py-2 px-3 text-slate-600">Agendadas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceSummary.length > 0 ? attendanceSummary.map(p => (
                      <tr key={p.name} className="border-b">
                        <td className="py-2 px-3 font-medium">{p.name}</td>
                        <td className="py-2 px-3 text-center text-emerald-600 font-semibold">{p.completed}</td>
                        <td className="py-2 px-3 text-center text-rose-600 font-semibold">{p.canceled}</td>
                        <td className="py-2 px-3 text-center text-violet-600 font-semibold">{p.scheduled}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={4} className="text-center py-10 text-slate-500">Nenhum dado de atendimento encontrado.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Occupancy Report Card */}
            <div className="bg-white p-6 rounded-lg shadow-sm border animate-fade-in">
              <h3 className="text-lg font-semibold text-slate-700 mb-4">Relatório de Ocupação da Agenda (Mês Atual)</h3>
              <div className="bg-slate-50 border p-6 rounded-lg flex flex-col items-center">
                  <p className="text-4xl font-bold text-indigo-600">{occupancySummary.occupancy}%</p>
                  <p className="text-slate-500 mt-1">de ocupação</p>
                  <div className="w-full bg-slate-200 rounded-full h-4 mt-4">
                      <div className="bg-indigo-500 h-4 rounded-full" style={{width: `${occupancySummary.occupancy}%`}}></div>
                  </div>
                  <p className="text-sm text-slate-600 mt-2">{occupancySummary.appointmentsThisMonth} de {occupancySummary.totalSlots} horários preenchidos.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </ModuleContainer>
  );
};

export default AdminModule;