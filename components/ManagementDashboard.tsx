import React, { useMemo } from 'react';
import { View, Patient, Appointment, Transaction } from '../types';
import ModuleContainer from './ModuleContainer';
import PatientIcon from './icons/PatientIcon';
import CalendarIcon from './icons/CalendarIcon';
import DollarSignIcon from './icons/DollarSignIcon';
import ChartBarIcon from './icons/ChartBarIcon';
import { getTodayString } from '../utils/formatting';

interface ManagementDashboardProps {
  onNavigate: (view: View) => void;
  patients: Patient[];
  appointments: Appointment[];
  transactions: Transaction[];
}

interface StatCardProps {
    title: string;
    value: string;
    icon: React.ReactNode;
    color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex items-start">
        <div className={`p-3 rounded-full mr-4 ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className="text-2xl font-bold text-slate-800">{value}</p>
        </div>
    </div>
);


const ManagementDashboard: React.FC<ManagementDashboardProps> = ({ onNavigate, patients, appointments, transactions }) => {
    
    const kpis = useMemo(() => {
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        const revenueThisMonth = transactions
            .filter(t => {
                const tDate = new Date(t.date);
                return t.type === 'income' && tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
            })
            .reduce((sum, t) => sum + t.amount, 0);
        
        const appointmentsThisMonth = appointments.filter(app => {
            const appDate = new Date(app.date);
            return appDate.getMonth() === currentMonth && appDate.getFullYear() === currentYear && app.status !== 'canceled';
        }).length;

        const weekdaysInMonth = Array.from({length: new Date(currentYear, currentMonth + 1, 0).getDate()}, (_, i) => new Date(currentYear, currentMonth, i + 1))
                                   .filter(date => date.getDay() !== 0 && date.getDay() !== 6).length;
        const totalSlots = weekdaysInMonth * 8; // Assuming 8 slots per day
        const occupancy = totalSlots > 0 ? ((appointmentsThisMonth / totalSlots) * 100).toFixed(0) + '%' : '0%';

        return {
            revenueThisMonth: revenueThisMonth.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
            appointmentsThisMonth,
            occupancy,
            totalPatients: patients.filter(p => p.isActive).length
        }

    }, [patients, appointments, transactions]);
    
    const financialChartData = useMemo(() => {
        const data = Array.from({ length: 6 }, (_, i) => {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            return { month: d.toLocaleString('pt-BR', { month: 'short' }), income: 0, expense: 0 };
        }).reverse();

        transactions.forEach(t => {
            const tDate = new Date(t.date);
            const monthStr = tDate.toLocaleString('pt-BR', { month: 'short' });
            const monthData = data.find(d => d.month === monthStr);
            if(monthData) {
                if(t.type === 'income') monthData.income += t.amount;
                else monthData.expense += t.amount;
            }
        });
        
        const max = Math.max(...data.map(d => d.income), ...data.map(d => d.expense), 1); // Avoid division by zero
        return { data, max };
    }, [transactions]);

    const upcomingAppointments = useMemo(() => {
        const todayString = getTodayString();
        return appointments
            .filter(a => a.status === 'scheduled' && a.date >= todayString)
            .sort((a, b) => {
                const dateTimeA = `${a.date}T${a.time}`;
                const dateTimeB = `${b.date}T${b.time}`;
                return new Date(dateTimeA).getTime() - new Date(dateTimeB).getTime();
            })
            .slice(0, 5);
    }, [appointments]);
        
    return (
        <ModuleContainer title="Dashboard Gerencial" onBack={() => onNavigate('dashboard')}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard title="Faturamento do Mês" value={kpis.revenueThisMonth} icon={<DollarSignIcon />} color="bg-emerald-100 text-emerald-600" />
                <StatCard title="Consultas no Mês" value={String(kpis.appointmentsThisMonth)} icon={<CalendarIcon />} color="bg-violet-100 text-violet-600" />
                <StatCard title="Ocupação da Agenda" value={kpis.occupancy} icon={<ChartBarIcon />} color="bg-orange-100 text-orange-600" />
                <StatCard title="Pacientes Ativos" value={String(kpis.totalPatients)} icon={<PatientIcon />} color="bg-purple-100 text-purple-600" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-700 mb-4">Visão Financeira (Últimos 6 meses)</h3>
                    <div className="flex justify-around items-end h-64 border-l border-b border-slate-200 pl-4 pb-1">
                        {financialChartData.data.map(d => (
                            <div key={d.month} className="flex flex-col items-center w-1/6">
                                <div className="flex items-end h-full w-full justify-center gap-2">
                                    <div className="bg-indigo-500 w-6 rounded-t-sm" title={`Receita: ${d.income.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}`} style={{height: `${(d.income / financialChartData.max) * 100}%`}}></div>
                                    <div className="bg-rose-400 w-6 rounded-t-sm" title={`Despesa: ${d.expense.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}`} style={{height: `${(d.expense / financialChartData.max) * 100}%`}}></div>
                                </div>
                                <p className="text-xs font-medium text-slate-500 mt-2 uppercase">{d.month}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-700 mb-4">Próximas Consultas</h3>
                    <div className="space-y-3">
                        {upcomingAppointments.length > 0 ? upcomingAppointments.map(app => (
                            <div key={app.id} className="flex justify-between items-center text-sm">
                                <div>
                                    <p className="font-semibold text-slate-800">{app.patientName}</p>
                                    <p className="text-slate-500">{new Date(app.date).toLocaleDateString('pt-BR', {day: '2-digit', month: 'short', timeZone: 'UTC'})} - {app.time}</p>
                                </div>
                                <span className="bg-violet-100 text-violet-800 text-xs font-semibold px-2 py-1 rounded-full">Agendada</span>
                            </div>
                        )) : <p className="text-slate-500 text-sm text-center py-4">Nenhuma próxima consulta.</p>}
                    </div>
                </div>
            </div>
            
        </ModuleContainer>
    );
};

export default ManagementDashboard;