
import React, { useState, useCallback, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { View, Patient, Appointment, SessionNote, InternalObservation, Transaction, ConsultationType, NotificationLog, AuditLogEntry, ToastNotification } from './types';
import Dashboard from './components/Dashboard';
import PatientManagement from './components/PatientManagement';
import AppointmentScheduler from './components/AppointmentScheduler';
import ElectronicHealthRecord from './components/ElectronicHealthRecord';
import FinancialModule from './components/FinancialModule';
import AdminModule from './components/AdminModule';
import { ManagementDashboard } from './components/ManagementDashboard';
import HeaderClock from './components/HeaderClock';
import SettingsIcon from './components/icons/SettingsIcon';
import SettingsModule from './components/SettingsModule';
import PasswordModal from './components/PasswordModal';
import useLocalStorage from './hooks/useLocalStorage';
import Login from './components/Login';
import TodayAppointmentsModal from './components/TodayAppointmentsModal';
import MyDayModal from './components/MyDayModal';
import MyDayIcon from './components/icons/MyDayIcon';
import BellIcon from './components/icons/BellIcon';
import NotificationModal from './components/NotificationModal';
import { getTodayString, getTomorrowString } from './utils/formatting';
import RecordsHistory from './components/RecordsHistory';
import Sidebar from './components/Sidebar';
import MenuIcon from './components/icons/MenuIcon';
import ErrorBoundary from './components/ErrorBoundary';
import Toast from './components/Toast';
import WelcomeModal from './components/WelcomeModal';
import BirthdayModal from './components/BirthdayModal';
import ReminderCheckModal from './components/ReminderCheckModal';
import HelpModule from './components/HelpModule';
import { mockPatients, mockAppointments, mockNotes, mockObservations, mockTransactions, mockConsultationTypes } from './data/mockData';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordModalTarget, setPasswordModalTarget] = useState<'settings' | null>(null);
  const [isSettingsUnlocked, setIsSettingsUnlocked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useLocalStorage('isAuthenticated', false);
  const [showTodayModal, setShowTodayModal] = useState(false);
  const [isMyDayModalOpen, setIsMyDayModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [financialFilterPatient, setFinancialFilterPatient] = useState<Patient | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Master Access Session State
  const [isMasterAccessSession, setIsMasterAccessSession] = useState(false);

  // Welcome Modal State
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false);
  // New state to track if user is in initial setup flow
  const [isOnboarding, setIsOnboarding] = useState(false);
  
  // Birthday Modal State
  const [isBirthdayModalOpen, setIsBirthdayModalOpen] = useState(false);
  const [birthdayPatients, setBirthdayPatients] = useState<Patient[]>([]);

  // Reminder Modal State
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [pendingReminders, setPendingReminders] = useState<Appointment[]>([]);
  
  // Toast State
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);
  
  // Controla se o PEP foi aberto para iniciar uma consulta (ativa o timer) ou apenas visualizar (não ativa timer)
  const [isConsultationMode, setIsConsultationMode] = useState(false);
  // Controla a visibilidade do botão "Iniciar Consulta" no PEP
  const [showStartConsultationButton, setShowStartConsultationButton] = useState(true);

  // Centralized state with persistence
  const [patients, setPatients] = useLocalStorage<Patient[]>('patients', []);
  const [appointments, setAppointments] = useLocalStorage<Appointment[]>('appointments', []);
  const [notes, setNotes] = useLocalStorage<SessionNote[]>('notes', []);
  const [observations, setObservations] = useLocalStorage<InternalObservation[]>('observations', []);
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>('transactions', []);
  const [password, setPassword] = useLocalStorage<string>('password', '2577');
  const [consultationTypes, setConsultationTypes] = useLocalStorage<ConsultationType[]>('consultationTypes', []);
  const [notificationLogs, setNotificationLogs] = useLocalStorage<NotificationLog[]>('notificationLogs', []);
  const [auditLogs, setAuditLogs] = useLocalStorage<AuditLogEntry[]>('auditLogs', []);
  const [profileImage, setProfileImage] = useLocalStorage<string | null>('profileImage', null);
  const [signatureImage, setSignatureImage] = useLocalStorage<string | null>('signatureImage', null);
  
  // Force Full Screen Logic
  useEffect(() => {
    const enterFullScreen = () => {
      const doc = document.documentElement;
      if (!document.fullscreenElement) {
        doc.requestFullscreen().catch(err => {
          // Fullscreen requests often fail if not triggered by user interaction.
          // We log it silently or handle gracefully.
          console.log("Fullscreen request intercepted:", err);
        });
      }
    };

    // Attempt on mount (might fail depending on browser policy)
    enterFullScreen();

    // Attempt on first interaction
    const handleInteraction = () => {
      enterFullScreen();
      // Remove listeners once triggered to avoid repeated calls
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
    };

    document.addEventListener('click', handleInteraction);
    document.addEventListener('keydown', handleInteraction);
    document.addEventListener('touchstart', handleInteraction);

    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
    };
  }, []);

  const logAction = useCallback((action: string, details: string) => {
    const newLog: AuditLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      action,
      details,
      user: 'Vanessa Gonçalves'
    };
    setAuditLogs(prev => [newLog, ...prev]);
  }, [setAuditLogs]);

  const navigateTo = useCallback((view: View) => {
    setActiveView(view);
    if (view !== 'pep') {
      setSelectedPatientId(null);
      setIsConsultationMode(false); // Reset mode when leaving PEP
      setShowStartConsultationButton(true); // Reset visibility
    }
    // If navigating away from settings, reset settings unlock AND onboarding mode
    if (view !== 'settings') {
        setIsSettingsUnlocked(false);
        setIsOnboarding(false);
    }
    if (view !== 'financial') {
        setFinancialFilterPatient(null);
    }
  }, []);

  const handleSettingsClick = () => {
    if (isSettingsUnlocked) {
        navigateTo('settings');
    } else {
        setPasswordModalTarget('settings');
        setIsPasswordModalOpen(true);
    }
  };

  const handlePasswordSuccess = () => {
    if (passwordModalTarget === 'settings') {
      setIsSettingsUnlocked(true);
      navigateTo('settings');
    }
    setIsPasswordModalOpen(false);
    setPasswordModalTarget(null);
  };
  
  const handlePasswordModalClose = () => {
    setIsPasswordModalOpen(false);
    setPasswordModalTarget(null);
  };

  // Updated to accept consultation mode flag and start button visibility
  const viewPatientPEP = useCallback((patientId: string, isConsultation: boolean = false, showStartButton: boolean = true) => {
    setSelectedPatientId(patientId);
    setIsConsultationMode(isConsultation);
    setShowStartConsultationButton(showStartButton);
    setActiveView('pep');
  }, []);

  const handleViewPatientFinancials = useCallback((patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    if (patient) {
      setFinancialFilterPatient(patient);
      navigateTo('financial');
    }
  }, [patients, navigateTo]);

  // --- SEQUENTIAL MODAL LOGIC ---

  // 4. Check Today's Appointments
  const checkTodayAppointments = useCallback(() => {
      const todayString = getTodayString();
      const todayAppointments = appointments.filter(app => app.date === todayString && app.status === 'scheduled');
      if (todayAppointments.length > 0) {
        setShowTodayModal(true);
      }
  }, [appointments]);

  // 3. Check Reminders for Tomorrow
  const checkReminders = useCallback(() => {
      const tomorrowString = getTomorrowString();
      const pending = appointments.filter(app => 
          app.date === tomorrowString && 
          app.status === 'scheduled' && 
          !app.reminderSent
      ).sort((a, b) => a.time.localeCompare(b.time));

      if (pending.length > 0) {
          setPendingReminders(pending);
          setIsReminderModalOpen(true);
      } else {
          // If no reminders, proceed to check today's appointments
          checkTodayAppointments();
      }
  }, [appointments, checkTodayAppointments]);

  // 2. Check Birthdays
  const runBirthdayCheck = useCallback(() => {
      const today = new Date();
      const currentDay = today.getDate();
      const currentMonth = today.getMonth() + 1; // 0-11 to 1-12
      
      const todaysBirthdays = patients.filter(p => {
          if (!p.isActive || !p.dateOfBirth) return false;
          // Use split to avoid timezone issues with Date object parsing
          const parts = p.dateOfBirth.split('-');
          // Expecting YYYY-MM-DD
          if (parts.length !== 3) return false;
          
          const pMonth = parseInt(parts[1], 10);
          const pDay = parseInt(parts[2], 10);
          
          return pDay === currentDay && pMonth === currentMonth;
      });

      if (todaysBirthdays.length > 0) {
          setBirthdayPatients(todaysBirthdays);
          setIsBirthdayModalOpen(true);
      } else {
          // If no birthdays, proceed to check reminders
          checkReminders();
      }
  }, [patients, checkReminders]);

  // 1. Initial Flow (Post-Login)
  const handleLoginSuccess = (isMasterAccess: boolean = false) => {
    setIsAuthenticated(true);
    navigateTo('dashboard');
    
    if (isMasterAccess) {
        setIsMasterAccessSession(true);
        
        // Auto-populate with mock data
        setPatients(mockPatients);
        setAppointments(mockAppointments);
        setNotes(mockNotes);
        setObservations(mockObservations);
        setTransactions(mockTransactions);
        setConsultationTypes(prev => {
            // Merge mock types ensuring no duplicates by ID, or just overwrite
            const existingIds = new Set(prev.map(ct => ct.id));
            const newTypes = mockConsultationTypes.filter(ct => !existingIds.has(ct.id));
            return [...prev, ...newTypes];
        });
        addToast('Acesso Mestre: Dados de teste carregados.', 'info');
        
        // Skip Onboarding check and go directly to birthday/reminders
        runBirthdayCheck();
    } else {
        addToast('Bem-vinda de volta!', 'success');
        
        // Onboarding Check for regular login
        const isDefaultPassword = password === '2577';
        const hasNoProfileImage = !profileImage;

        if (isDefaultPassword || hasNoProfileImage) {
            // Show welcome modal if setup is incomplete
            setIsWelcomeModalOpen(true);
        } else {
            runBirthdayCheck();
        }
    }
  };

  // --- MODAL CLOSE HANDLERS (CHAIN REACTION) ---

  const handleWelcomeSetup = () => {
      setIsWelcomeModalOpen(false);
      setIsSettingsUnlocked(true); 
      setIsOnboarding(true); // Enable restricted mode
      navigateTo('settings');
  };

  const handleCloseWelcome = () => {
      setIsWelcomeModalOpen(false);
      runBirthdayCheck(); // Next step
  };

  const handleCloseBirthday = () => {
      setIsBirthdayModalOpen(false);
      checkReminders(); // Next step
  };

  const handleCloseReminder = () => {
      setIsReminderModalOpen(false);
      checkTodayAppointments(); // Next step
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setIsMasterAccessSession(false);
    addToast('Sessão encerrada com segurança.', 'info');
  };

  const handleMarkReminderSent = (appointmentId: string) => {
      setAppointments(prev => prev.map(app => 
          app.id === appointmentId ? { ...app, reminderSent: true } : app
      ));
      
      setPendingReminders(prev => prev.filter(app => app.id !== appointmentId));
      
      const app = appointments.find(a => a.id === appointmentId);
      if (app) {
          logAction('Lembrete Enviado', `Lembrete de consulta enviado para ${app.patientName} via Modal de Verificação.`);
          const logEntry: NotificationLog = {
              id: `log${Date.now()}`,
              date: new Date().toISOString(),
              patientName: app.patientName,
              type: 'sms',
              status: 'sent',
              details: `Enviado via Verificação Diária.`
          };
          setNotificationLogs(prev => [logEntry, ...prev]);
      }
  };

  const renderContent = () => {
    switch (activeView) {
      case 'patients':
        return <PatientManagement 
                  onNavigate={navigateTo} 
                  onViewPEP={viewPatientPEP} 
                  onViewFinancials={handleViewPatientFinancials} 
                  patients={patients} 
                  setPatients={setPatients} 
                  appointments={appointments}
                  onLogAction={logAction}
                  onShowToast={addToast}
                />;
      case 'schedule':
        return <AppointmentScheduler 
                  onNavigate={navigateTo} 
                  onViewPEP={viewPatientPEP}
                  patients={patients} 
                  appointments={appointments} 
                  setAppointments={setAppointments}
                  consultationTypes={consultationTypes}
                  setTransactions={setTransactions}
                  notificationLogs={notificationLogs}
                  setNotificationLogs={setNotificationLogs}
                  onLogAction={logAction}
                  onShowToast={addToast}
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
                appointments={appointments}
                setAppointments={setAppointments}
                setTransactions={setTransactions}
                isConsultationMode={isConsultationMode}
                showStartButton={showStartConsultationButton}
                onLogAction={logAction}
                onShowToast={addToast}
                signatureImage={signatureImage}
              />;
      case 'financial':
        return <FinancialModule 
                  onNavigate={navigateTo} 
                  transactions={transactions} 
                  setTransactions={setTransactions}
                  filteredPatient={financialFilterPatient}
                  onClearPatientFilter={() => setFinancialFilterPatient(null)}
                  onLogAction={logAction}
                  onShowToast={addToast}
                  patients={patients}
                  signatureImage={signatureImage}
                />;
      case 'admin':
        return <AdminModule onNavigate={navigateTo} patients={patients} appointments={appointments} transactions={transactions} />;
      case 'settings':
        return <SettingsModule 
                  onNavigate={navigateTo}
                  currentPassword={password}
                  onChangePassword={setPassword}
                  consultationTypes={consultationTypes}
                  setConsultationTypes={setConsultationTypes}
                  patients={patients}
                  appointments={appointments}
                  notes={notes}
                  observations={observations}
                  transactions={transactions}
                  setPatients={setPatients}
                  setAppointments={setAppointments}
                  setNotes={setNotes}
                  setObservations={setObservations}
                  setTransactions={setTransactions}
                  auditLogs={auditLogs}
                  setAuditLogs={setAuditLogs}
                  profileImage={profileImage}
                  setProfileImage={setProfileImage}
                  signatureImage={signatureImage}
                  setSignatureImage={setSignatureImage}
                  onShowToast={addToast}
                  onboardingMode={isOnboarding}
                  isMasterAccess={isMasterAccessSession}
                />;
      case 'managementDashboard':
        return <ManagementDashboard onNavigate={navigateTo} patients={patients} appointments={appointments} transactions={transactions} />;
      case 'recordsHistory':
        return <RecordsHistory 
                  onNavigate={navigateTo} 
                  notes={notes} 
                  patients={patients} 
                  onViewPEP={viewPatientPEP} 
                  appointments={appointments}
                />;
      case 'help':
        return <HelpModule onNavigate={navigateTo} />;
      case 'dashboard':
      default:
        return <Dashboard 
                  onNavigate={navigateTo} 
                  onViewPEP={viewPatientPEP} 
                  appointments={appointments} 
                  transactions={transactions}
                  patients={patients}
                  onNavigateToPatients={() => navigateTo('patients')} 
                />;
    }
  };

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} currentPassword={password} profileImage={profileImage} />;
  }

  return (
    <ErrorBoundary>
      <div className="flex h-screen bg-gray-50 text-slate-800 overflow-hidden">
        {isWelcomeModalOpen && (
            <WelcomeModal 
                isOpen={isWelcomeModalOpen}
                onClose={handleCloseWelcome}
                onGoToSettings={handleWelcomeSetup}
                pendingTasks={{
                    passwordChanged: password !== '2577',
                    profileImageSet: !!profileImage
                }}
            />
        )}
        {/* Birthday Modal */}
        {isBirthdayModalOpen && (
            <BirthdayModal 
                isOpen={isBirthdayModalOpen}
                onClose={handleCloseBirthday}
                patients={birthdayPatients}
            />
        )}
        {/* Reminder Check Modal */}
        {isReminderModalOpen && (
            <ReminderCheckModal 
                isOpen={isReminderModalOpen}
                onClose={handleCloseReminder}
                appointments={pendingReminders}
                patients={patients}
                onMarkAsSent={handleMarkReminderSent}
            />
        )}

        {isPasswordModalOpen && (
          <PasswordModal 
            onClose={handlePasswordModalClose}
            onSuccess={handlePasswordSuccess}
            correctPassword={password}
            target={passwordModalTarget as 'settings' | null} 
          />
        )}
        {showTodayModal && !isWelcomeModalOpen && !isBirthdayModalOpen && !isReminderModalOpen && (
          <TodayAppointmentsModal
            appointments={appointments}
            onClose={() => setShowTodayModal(false)}
          />
        )}
        {isMyDayModalOpen && (
          <MyDayModal
            appointments={appointments}
            onClose={() => setIsMyDayModalOpen(false)}
          />
        )}
        {isNotificationModalOpen && (
          <NotificationModal 
            onClose={() => setIsNotificationModalOpen(false)}
            logs={notificationLogs}
          />
        )}

        {/* Global Toast Container - Positioned Top Right */}
        <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 items-end pointer-events-none">
          {toasts.map(toast => (
            <Toast
              key={toast.id}
              id={toast.id}
              message={toast.message}
              type={toast.type}
              onClose={removeToast}
            />
          ))}
        </div>
        
        {/* Sidebar Component */}
        <Sidebar 
          activeView={activeView} 
          onNavigate={(view) => navigateTo(view)} 
          onSettingsClick={handleSettingsClick}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onLogout={handleLogout}
          profileImage={profileImage}
        />

        {/* Main Content Wrapper */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          
          {/* Top Header */}
          <header className="bg-white shadow-sm z-30 border-b border-slate-200">
              <div className="flex justify-between items-center px-4 sm:px-6 py-3">
                  <div className="flex items-center gap-3">
                      <button 
                          onClick={() => setIsSidebarOpen(true)}
                          className="p-2 -ml-2 rounded-md lg:hidden text-slate-600 hover:bg-slate-100"
                      >
                          <MenuIcon />
                      </button>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-4">
                      <div className="hidden sm:block text-slate-700">
                          <HeaderClock />
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2">
                          <button 
                          onClick={() => setIsNotificationModalOpen(true)}
                          className="p-2 rounded-full text-slate-600 hover:bg-slate-100 hover:text-indigo-600 transition-colors relative"
                          aria-label="Notificações"
                          >
                          <BellIcon />
                          </button>
                          <button 
                          onClick={() => setIsMyDayModalOpen(true)}
                          className="p-2 rounded-full text-slate-600 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
                          aria-label="Meu Dia"
                          >
                          <MyDayIcon />
                          </button>
                      </div>
                  </div>
              </div>
          </header>

          {/* Scrollable Main Content */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
              <div className="max-w-7xl mx-auto">
                  {renderContent()}
              </div>
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default App;
