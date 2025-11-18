import React, { useState, useCallback, useEffect } from 'react';
import { View, Patient, Appointment, SessionNote, InternalObservation, Transaction, ConsultationType } from './types';
import Dashboard from './components/Dashboard';
import PatientManagement from './components/PatientManagement';
import AppointmentScheduler from './components/AppointmentScheduler';
import ElectronicHealthRecord from './components/ElectronicHealthRecord';
import FinancialModule from './components/FinancialModule';
import AdminModule from './components/AdminModule';
import ManagementDashboard from './components/ManagementDashboard';
import HeaderClock from './components/HeaderClock';
import SettingsIcon from './components/icons/SettingsIcon';
import SettingsModule from './components/SettingsModule';
import PasswordModal from './components/PasswordModal';
import useLocalStorage from './hooks/useLocalStorage';
import Login from './components/Login';
import LogoutIcon from './components/icons/LogoutIcon';
import TodayAppointmentsModal from './components/TodayAppointmentsModal';
import MyDaySidebar from './components/MyDaySidebar';
import MyDayIcon from './components/icons/MyDayIcon';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isSettingsUnlocked, setIsSettingsUnlocked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useLocalStorage('isAuthenticated', false);
  const [showTodayModal, setShowTodayModal] = useState(false);
  const [isMyDaySidebarOpen, setIsMyDaySidebarOpen] = useState(false);

  // Centralized state with persistence
  const [patients, setPatients] = useLocalStorage<Patient[]>('patients', []);
  const [appointments, setAppointments] = useLocalStorage<Appointment[]>('appointments', []);
  const [notes, setNotes] = useLocalStorage<SessionNote[]>('notes', []);
  const [observations, setObservations] = useLocalStorage<InternalObservation[]>('observations', []);
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>('transactions', []);
  const [password, setPassword] = useLocalStorage<string>('password', '2577');
  const [consultationTypes, setConsultationTypes] = useLocalStorage<ConsultationType[]>('consultationTypes', []);
  
  const navigateTo = useCallback((view: View) => {
    setActiveView(view);
    if (view !== 'pep') {
      setSelectedPatientId(null);
    }
    if (view !== 'settings') {
        setIsSettingsUnlocked(false);
    }
  }, []);

  const handleSettingsClick = () => {
    if (isSettingsUnlocked) {
        navigateTo('settings');
    } else {
        setIsPasswordModalOpen(true);
    }
  };

  const handlePasswordSuccess = () => {
    setIsPasswordModalOpen(false);
    setIsSettingsUnlocked(true);
    navigateTo('settings');
  };

  const viewPatientPEP = useCallback((patientId: string) => {
    setSelectedPatientId(patientId);
    setActiveView('pep');
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    navigateTo('dashboard');
    const todayString = new Date().toISOString().split('T')[0];
    const todayAppointments = appointments.filter(app => app.date === todayString && app.status === 'scheduled');
    if (todayAppointments.length > 0) {
      setShowTodayModal(true);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  const renderContent = () => {
    switch (activeView) {
      case 'patients':
        return <PatientManagement onNavigate={navigateTo} onViewPEP={viewPatientPEP} patients={patients} setPatients={setPatients} />;
      case 'schedule':
        return <AppointmentScheduler 
                  onNavigate={navigateTo} 
                  patients={patients} 
                  appointments={appointments} 
                  setAppointments={setAppointments}
                  consultationTypes={consultationTypes}
                  setTransactions={setTransactions}
                />;
      case 'pep':
        return <ElectronicHealthRecord 
                onNavigate={navigateTo} 
                patientId={selectedPatientId} 
                patients={patients}
                setPatients={setPatients}
                notes={notes}
                setNotes={setNotes}
                observations={observations}
                setObservations={setObservations}
              />;
      case 'financial':
        return <FinancialModule onNavigate={navigateTo} transactions={transactions} setTransactions={setTransactions} />;
      case 'admin':
        return <AdminModule onNavigate={navigateTo} patients={patients} appointments={appointments} transactions={transactions} />;
      case 'settings':
        return <SettingsModule 
                  onNavigate={navigateTo}
                  currentPassword={password}
                  onChangePassword={setPassword}
                  consultationTypes={consultationTypes}
                  setConsultationTypes={setConsultationTypes}
                />;
      case 'managementDashboard':
        return <ManagementDashboard onNavigate={navigateTo} patients={patients} appointments={appointments} transactions={transactions} />;
      case 'dashboard':
      default:
        return <Dashboard onNavigate={navigateTo} appointments={appointments} />;
    }
  };

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 text-slate-800">
       {isPasswordModalOpen && (
        <PasswordModal 
          onClose={() => setIsPasswordModalOpen(false)}
          onSuccess={handlePasswordSuccess}
          correctPassword={password}
        />
      )}
      {showTodayModal && (
        <TodayAppointmentsModal
          appointments={appointments}
          onClose={() => setShowTodayModal(false)}
        />
      )}
      <MyDaySidebar
        appointments={appointments}
        show={isMyDaySidebarOpen}
        onClose={() => setIsMyDaySidebarOpen(false)}
      />
      <header className="bg-white shadow-md sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
          <button onClick={() => navigateTo('dashboard')} className="text-left">
            <h1 className="text-2xl md:text-3xl font-bold text-indigo-700">
              Clínica de Psicanálise | <span className="font-light">Vanessa Gonçalves</span>
            </h1>
          </button>
          <div className="flex items-center gap-4">
            <HeaderClock />
            <button 
              onClick={() => setIsMyDaySidebarOpen(true)}
              className="p-2 rounded-full text-slate-600 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
              aria-label="Meu Dia"
            >
              <MyDayIcon />
            </button>
            <button 
              onClick={handleSettingsClick} 
              className="p-2 rounded-full text-slate-600 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
              aria-label="Configurações"
            >
              <SettingsIcon />
            </button>
            <button 
              onClick={handleLogout} 
              className="p-2 rounded-full text-slate-600 hover:bg-slate-100 hover:text-rose-600 transition-colors"
              aria-label="Sair"
            >
              <LogoutIcon />
            </button>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;