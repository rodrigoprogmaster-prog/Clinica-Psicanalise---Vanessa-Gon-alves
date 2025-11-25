
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { View, ConsultationType, Patient, Appointment, SessionNote, InternalObservation, Transaction, AuditLogEntry } from '../types';
import ModuleContainer from './ModuleContainer';
import TrashIcon from './icons/TrashIcon';
import { formatCurrency, parseCurrency } from '../utils/formatting';
import { mockPatients, mockAppointments, mockNotes, mockObservations, mockTransactions, mockConsultationTypes } from '../data/mockData';
import FilterIcon from './icons/FilterIcon';
import SettingsIcon from './icons/SettingsIcon';
import FileTextIcon from './icons/FileTextIcon';
import DownloadIcon from './icons/DownloadIcon';
import UploadIcon from './icons/UploadIcon';
import CloseIcon from './icons/CloseIcon';
import UserIcon from './icons/UserIcon';
import CheckIcon from './icons/UserCheckIcon';
import EditIcon from './icons/EditIcon';
import BookIcon from './icons/BookIcon';

interface SettingsModuleProps {
  onNavigate: (view: View) => void;
  currentPassword?: string;
  onChangePassword: (newPassword: string) => void;
  consultationTypes: ConsultationType[];
  setConsultationTypes: React.Dispatch<React.SetStateAction<ConsultationType[]>>;
  
  patients: Patient[];
  appointments: Appointment[];
  notes: SessionNote[];
  observations: InternalObservation[];
  transactions: Transaction[];

  setPatients: React.Dispatch<React.SetStateAction<Patient[]>>;
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  setNotes: React.Dispatch<React.SetStateAction<SessionNote[]>>;
  setObservations: React.Dispatch<React.SetStateAction<InternalObservation[]>>;
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  auditLogs: AuditLogEntry[];
  setAuditLogs?: React.Dispatch<React.SetStateAction<AuditLogEntry[]>>;

  profileImage: string | null;
  setProfileImage: React.Dispatch<React.SetStateAction<string | null>>;
  
  signatureImage?: string | null;
  setSignatureImage?: React.Dispatch<React.SetStateAction<string | null>>;

  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
  onboardingMode?: boolean;
  isMasterAccess?: boolean;
}

const SettingsModule: React.FC<SettingsModuleProps> = ({ 
  onNavigate, 
  currentPassword,
  onChangePassword,
  consultationTypes,
  setConsultationTypes,
  
  patients,
  appointments,
  notes,
  observations,
  transactions,

  setPatients,
  setAppointments,
  setNotes,
  setObservations,
  setTransactions,
  auditLogs,
  setAuditLogs,

  profileImage,
  setProfileImage,
  
  signatureImage,
  setSignatureImage,

  onShowToast,
  onboardingMode = false,
  isMasterAccess = false
}) => {
  const [settingsTab, setSettingsTab] = useState<'profile' | 'security' | 'services' | 'data' | 'docs' | 'audit'>('profile');
  
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Add Consultation Type State
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypePrice, setNewTypePrice] = useState('');
  const [typeErrors, setTypeErrors] = useState({ name: '', price: '' });

  // Edit Consultation Type State
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null);
  const [editTypeName, setEditTypeName] = useState('');
  const [editTypePrice, setEditTypePrice] = useState('');
  
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [backupPasswordInput, setBackupPasswordInput] = useState('');
  const [backupError, setBackupError] = useState('');

  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [restorePasswordInput, setRestorePasswordInput] = useState('');
  const [restoreError, setRestoreError] = useState('');
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dev Mode State
  const [isDevModeUnlocked, setIsDevModeUnlocked] = useState(false);
  const [devModePassword, setDevModePassword] = useState('');

  const [auditSearch, setAuditSearch] = useState('');
  const [auditDateFilter, setAuditDateFilter] = useState('');

  const MASTER_PASSWORD = '140552';
  const DEFAULT_PASSWORD = '2577';

  // If onboarding mode is active, force specific tab
  useEffect(() => {
    if (onboardingMode) {
        setSettingsTab('profile');
    }
  }, [onboardingMode]);

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();

    if (oldPassword !== currentPassword && oldPassword !== MASTER_PASSWORD && !onboardingMode) {
      onShowToast('A senha antiga está incorreta.', 'error');
      return;
    }
    if (newPassword.length < 4) {
      onShowToast('A nova senha deve ter pelo menos 4 caracteres.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      onShowToast('As novas senhas não coincidem.', 'error');
      return;
    }

    onChangePassword(newPassword);
    onShowToast('Senha alterada com sucesso!', 'success');
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleAddConsultationType = (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseCurrency(newTypePrice);
    const errors = { name: '', price: '' };
    let isValid = true;

    if (!newTypeName.trim()) { errors.name = 'O nome é obrigatório.'; isValid = false; }
    if (isNaN(price) || price <= 0) { errors.price = 'Valor inválido.'; isValid = false; }
    setTypeErrors(errors);

    if (isValid) {
      const newType: ConsultationType = { id: `ct-${Date.now()}`, name: newTypeName.trim(), price };
      setConsultationTypes(prev => [...prev, newType].sort((a, b) => a.name.localeCompare(b.name)));
      setNewTypeName('');
      setNewTypePrice('');
      onShowToast('Tipo de consulta adicionado.', 'success');
    }
  };

  const handleDeleteConsultationType = (id: string) => {
    setConsultationTypes(prev => prev.filter(ct => ct.id !== id));
    onShowToast('Tipo de consulta removido.', 'info');
  };

  // Edit Handlers
  const handleStartEdit = (ct: ConsultationType) => {
      setEditingTypeId(ct.id);
      setEditTypeName(ct.name);
      setEditTypePrice(ct.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
  };

  const handleCancelEdit = () => {
      setEditingTypeId(null);
      setEditTypeName('');
      setEditTypePrice('');
  };

  const handleEditPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setEditTypePrice(formatCurrency(e.target.value));
  };

  const handleSaveEdit = (id: string) => {
      const price = parseCurrency(editTypePrice);
      
      if (!editTypeName.trim()) {
          onShowToast('O nome do serviço não pode estar vazio.', 'error');
          return;
      }
      if (isNaN(price) || price <= 0) {
          onShowToast('O valor deve ser maior que zero.', 'error');
          return;
      }

      setConsultationTypes(prev => prev.map(ct => 
          ct.id === id ? { ...ct, name: editTypeName, price: price } : ct
      ));
      
      onShowToast('Tipo de consulta atualizado.', 'success');
      handleCancelEdit();
  };
  
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewTypePrice(formatCurrency(e.target.value));
    if(typeErrors.price) setTypeErrors(prev => ({...prev, price: ''}));
  };

  const handleTypeNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setNewTypeName(e.target.value);
      if(typeErrors.name) setTypeErrors(prev => ({...prev, name: ''}));
  };

  const handleUnlockDevMode = (e: React.FormEvent) => {
      e.preventDefault();
      if (devModePassword === MASTER_PASSWORD) {
          setIsDevModeUnlocked(true);
          setDevModePassword('');
          onShowToast('Modo de desenvolvedor desbloqueado.', 'success');
      } else {
          onShowToast('Senha mestra incorreta.', 'error');
          setDevModePassword('');
      }
  };

  const handleLoadMockData = () => {
      setPatients(mockPatients);
      setAppointments(mockAppointments);
      setNotes(mockNotes);
      setObservations(mockObservations);
      setTransactions(mockTransactions);
      setConsultationTypes(prev => {
          const existingIds = new Set(prev.map(ct => ct.id));
          const newTypes = mockConsultationTypes.filter(ct => !existingIds.has(ct.id));
          return [...prev, ...newTypes];
      });
      onShowToast('Dados de teste carregados com sucesso!', 'success');
      setTimeout(() => { onNavigate('dashboard'); }, 1000);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setProfileImage(base64String);
        onShowToast('Foto de perfil atualizada.', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
      setProfileImage(null);
      onShowToast('Foto de perfil removida.', 'info');
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && setSignatureImage) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setSignatureImage(base64String);
        onShowToast('Assinatura digital atualizada.', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveSignature = () => {
      if(setSignatureImage) {
          setSignatureImage(null);
          onShowToast('Assinatura digital removida.', 'info');
      }
  };

  const handleInitiateBackup = () => {
      setIsBackupModalOpen(true);
      setBackupPasswordInput('');
      setBackupError('');
  };

  const confirmBackup = (e: React.FormEvent) => {
      e.preventDefault();
      if (backupPasswordInput === currentPassword || backupPasswordInput === MASTER_PASSWORD) {
          executeBackup();
      } else {
          setBackupError('Senha incorreta.');
      }
  };

  const executeBackup = () => {
      const backupData = {
          version: "2.0",
          timestamp: new Date().toISOString(),
          patients,
          appointments,
          notes,
          observations,
          transactions,
          consultationTypes,
          auditLogs,
          settings: {
            profileImage,
            signatureImage
          }
      };

      const now = new Date();
      const dateStr = now.toLocaleDateString('pt-BR').replace(/\//g, '-');
      const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }).replace(/:/g, '-');
      const filename = `backup_completo_clinica_${dateStr}_${timeStr}.json`;

      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setIsBackupModalOpen(false);
      onShowToast('Backup completo realizado e download iniciado.', 'success');
  };

  const handleTriggerRestore = () => {
      if (fileInputRef.current) {
          fileInputRef.current.click();
      }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          setRestoreFile(file);
          setIsRestoreModalOpen(true);
          setRestorePasswordInput('');
          setRestoreError('');
          e.target.value = '';
      }
  };

  const confirmRestore = (e: React.FormEvent) => {
      e.preventDefault();
      if (restorePasswordInput === currentPassword || restorePasswordInput === MASTER_PASSWORD) {
          executeRestore();
      } else {
          setRestoreError('Senha incorreta.');
      }
  };

  const executeRestore = () => {
      if (!restoreFile) return;

      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const content = e.target?.result as string;
              const data = JSON.parse(content);

              if (data && typeof data === 'object') {
                  if (data.patients) setPatients(data.patients);
                  if (data.appointments) setAppointments(data.appointments);
                  if (data.notes) setNotes(data.notes);
                  if (data.observations) setObservations(data.observations);
                  if (data.transactions) setTransactions(data.transactions);
                  if (data.consultationTypes) setConsultationTypes(data.consultationTypes);
                  
                  // Restore Audit Logs if setter is provided
                  if (data.auditLogs && setAuditLogs) {
                      setAuditLogs(data.auditLogs);
                  }

                  // Restore Settings (Images)
                  if (data.settings) {
                      if (data.settings.profileImage !== undefined) setProfileImage(data.settings.profileImage);
                      if (data.settings.signatureImage !== undefined && setSignatureImage) setSignatureImage(data.settings.signatureImage);
                  } else {
                      // Fallback for older backups
                      if (data.profileImage !== undefined) setProfileImage(data.profileImage);
                  }
                  
                  setIsRestoreModalOpen(false);
                  onShowToast('Restauração completa realizada com sucesso!', 'success');
                  setTimeout(() => onNavigate('dashboard'), 1500);
              } else {
                  setRestoreError('Arquivo de backup inválido ou corrompido.');
              }
          } catch (err) {
              setRestoreError('Erro ao processar o arquivo. Verifique se é um JSON válido.');
          }
      };
      reader.readAsText(restoreFile);
  };

  const handleFinishOnboarding = () => {
      const isPasswordChanged = currentPassword !== DEFAULT_PASSWORD;
      const isProfileSet = !!profileImage;

      if (!isPasswordChanged) {
          onShowToast('É obrigatório alterar a senha padrão para continuar.', 'error');
          return;
      }

      if (!isProfileSet) {
          onShowToast('É obrigatório definir uma foto de perfil.', 'error');
          return;
      }

      onShowToast('Configuração concluída! Bem-vinda ao sistema.', 'success');
      setTimeout(() => {
          onNavigate('dashboard');
      }, 1500);
  };

  const filteredAuditLogs = useMemo(() => {
      return auditLogs.filter(log => {
          const matchesSearch = log.details.toLowerCase().includes(auditSearch.toLowerCase()) || 
                                log.action.toLowerCase().includes(auditSearch.toLowerCase());
          const matchesDate = auditDateFilter ? log.timestamp.startsWith(auditDateFilter) : true;
          return matchesSearch && matchesDate;
      }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [auditLogs, auditSearch, auditDateFilter]);

  return (
    <ModuleContainer 
        title={onboardingMode ? "Configuração Inicial" : "Configurações do Sistema"} 
        onBack={() => onNavigate('dashboard')}
    >
      
      {isBackupModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-[70] animate-fade-in">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-800">Confirmar Backup Completo</h3>
                    <button onClick={() => setIsBackupModalOpen(false)} className="p-1 rounded-full hover:bg-slate-100"><CloseIcon/></button>
                </div>
                <p className="text-slate-600 mb-4 text-sm">Esta ação fará o download de todos os dados do sistema, incluindo pacientes, finanças e configurações. Digite sua senha para autorizar.</p>
                <form onSubmit={confirmBackup}>
                    <input 
                        type="password" 
                        placeholder="Sua senha"
                        value={backupPasswordInput}
                        onChange={(e) => setBackupPasswordInput(e.target.value)}
                        className={`w-full p-2 border rounded-md bg-white mb-2 text-center ${backupError ? 'border-red-500' : 'border-slate-300'}`}
                        autoFocus
                    />
                    {backupError && <p className="text-red-500 text-xs mb-4 text-center">{backupError}</p>}
                    
                    <div className="flex justify-end gap-3 mt-4">
                        <button type="button" onClick={() => setIsBackupModalOpen(false)} className="px-4 py-2 rounded-full bg-slate-200 text-slate-800 hover:bg-slate-300 text-sm">Cancelar</button>
                        <button type="submit" className="px-4 py-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 text-sm">Confirmar e Baixar</button>
                    </div>
                </form>
            </div>
          </div>
      )}

      {isRestoreModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-[70] animate-fade-in">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-800">Confirmar Restauração</h3>
                    <button onClick={() => setIsRestoreModalOpen(false)} className="p-1 rounded-full hover:bg-slate-100"><CloseIcon/></button>
                </div>
                <div className="bg-amber-50 border-l-4 border-amber-400 p-3 mb-4 text-sm text-amber-800">
                    <strong>Atenção:</strong> Esta ação substituirá TODOS os dados atuais do sistema pelos dados do arquivo de backup.
                </div>
                <p className="text-slate-600 mb-4 text-sm">Digite sua senha para confirmar a restauração do arquivo: <span className="font-mono text-xs bg-slate-100 p-1 rounded">{restoreFile?.name}</span></p>
                <form onSubmit={confirmRestore}>
                    <input 
                        type="password" 
                        placeholder="Sua senha"
                        value={restorePasswordInput}
                        onChange={(e) => setRestorePasswordInput(e.target.value)}
                        className={`w-full p-2 border rounded-md bg-white mb-2 text-center ${restoreError ? 'border-red-500' : 'border-slate-300'}`}
                        autoFocus
                    />
                    {restoreError && <p className="text-red-500 text-xs mb-4 text-center">{restoreError}</p>}
                    
                    <div className="flex justify-end gap-3 mt-4">
                        <button type="button" onClick={() => setIsRestoreModalOpen(false)} className="px-4 py-2 rounded-full bg-slate-200 text-slate-800 hover:bg-slate-300 text-sm">Cancelar</button>
                        <button type="submit" className="px-4 py-2 rounded-full bg-amber-600 text-white hover:bg-amber-700 text-sm">Confirmar Restauração</button>
                    </div>
                </form>
            </div>
          </div>
      )}

         <div className="animate-fade-in space-y-6">
            {/* Tabs Navigation */}
            <div className="flex border-b border-slate-200 mb-6 overflow-x-auto">
                <button 
                    onClick={() => setSettingsTab('profile')}
                    className={`py-2 px-4 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${settingsTab === 'profile' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    Perfil Profissional
                </button>
                <button 
                    onClick={() => setSettingsTab('security')}
                    className={`py-2 px-4 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${settingsTab === 'security' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    Segurança da Conta
                </button>
                {!onboardingMode && (
                    <>
                        <button 
                            onClick={() => setSettingsTab('services')}
                            className={`py-2 px-4 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${settingsTab === 'services' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                        >
                            Tipos de Consultas
                        </button>
                        <button 
                            onClick={() => setSettingsTab('data')}
                            className={`py-2 px-4 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${settingsTab === 'data' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                        >
                            Backup & Dados
                        </button>
                        <button 
                            onClick={() => setSettingsTab('docs')}
                            className={`py-2 px-4 font-medium text-sm transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${settingsTab === 'docs' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                        >
                            <span className="scale-75"><BookIcon /></span>
                            Documentação
                        </button>
                        {isMasterAccess && (
                            <button 
                                onClick={() => setSettingsTab('audit')}
                                className={`py-2 px-4 font-medium text-sm transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${settingsTab === 'audit' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                            >
                                <span className="scale-75"><FileTextIcon className="w-4 h-4"/></span>
                                Logs
                            </button>
                        )}
                    </>
                )}
            </div>

            {/* Tab Content: Profile */}
            {settingsTab === 'profile' && (
                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 animate-fade-in">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Foto de Perfil</h3>
                    <div className="flex items-center gap-6">
                        <div className="h-24 w-24 rounded-full bg-slate-100 border-2 border-slate-200 overflow-hidden flex items-center justify-center relative group">
                            {profileImage ? (
                                <img src={profileImage} alt="Perfil" className="h-full w-full object-cover" />
                            ) : (
                                <UserIcon />
                            )}
                            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <label htmlFor="profile-upload" className="cursor-pointer text-white text-xs font-bold p-1">Alterar</label>
                            </div>
                        </div>
                        <div>
                            <input 
                                type="file" 
                                id="profile-upload" 
                                accept="image/*" 
                                onChange={handleImageUpload} 
                                className="hidden" 
                            />
                            <div className="flex gap-3">
                                <label 
                                    htmlFor="profile-upload"
                                    className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium hover:bg-indigo-100 cursor-pointer transition-colors"
                                >
                                    Carregar Foto
                                </label>
                                {profileImage && (
                                    <button 
                                        onClick={handleRemoveImage}
                                        className="px-4 py-2 bg-rose-50 text-rose-700 rounded-full text-sm font-medium hover:bg-rose-100 transition-colors"
                                    >
                                        Remover
                                    </button>
                                )}
                            </div>
                            <p className="text-xs text-slate-500 mt-2">Recomendado: Imagem quadrada, min. 400x400px.</p>
                        </div>
                    </div>

                    {/* Signature Section */}
                    <div className="mt-8 border-t border-slate-100 pt-6">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">Assinatura Digital (Recibos)</h3>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                            <div className="w-full sm:w-64 h-24 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 flex items-center justify-center overflow-hidden relative">
                                {signatureImage ? (
                                    <img src={signatureImage} alt="Assinatura" className="h-full w-auto object-contain p-2" />
                                ) : (
                                    <p className="text-xs text-slate-400">Nenhuma assinatura</p>
                                )}
                            </div>
                            <div>
                                <input 
                                    type="file" 
                                    id="signature-upload" 
                                    accept="image/*" 
                                    onChange={handleSignatureUpload} 
                                    className="hidden" 
                                />
                                <div className="flex gap-3">
                                    <label 
                                        htmlFor="signature-upload"
                                        className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-full text-sm font-medium hover:bg-slate-50 cursor-pointer transition-colors shadow-sm"
                                    >
                                        Carregar Assinatura
                                    </label>
                                    {signatureImage && (
                                        <button 
                                            onClick={handleRemoveSignature}
                                            className="px-4 py-2 bg-rose-50 text-rose-700 rounded-full text-sm font-medium hover:bg-rose-100 transition-colors"
                                        >
                                            Remover
                                        </button>
                                    )}
                                </div>
                                <p className="text-xs text-slate-500 mt-2">
                                    Carregue uma imagem da sua assinatura (fundo transparente recomendado). 
                                    Ela será inserida automaticamente nos recibos emitidos.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tab Content: Security */}
            {settingsTab === 'security' && (
                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 animate-fade-in">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Alterar Senha</h3>
                    <form onSubmit={handlePasswordChange} className="max-w-md space-y-4">
                        {!onboardingMode && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Senha Antiga</label>
                                <input 
                                    type="password" 
                                    value={oldPassword} 
                                    onChange={e => setOldPassword(e.target.value)} 
                                    className="w-full p-2 border rounded-md"
                                />
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Nova Senha</label>
                            <input 
                                type="password" 
                                value={newPassword} 
                                onChange={e => setNewPassword(e.target.value)} 
                                className="w-full p-2 border rounded-md"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Confirmar Nova Senha</label>
                            <input 
                                type="password" 
                                value={confirmPassword} 
                                onChange={e => setConfirmPassword(e.target.value)} 
                                className="w-full p-2 border rounded-md"
                            />
                        </div>
                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700">Alterar Senha</button>
                    </form>
                </div>
            )}

            {/* Tab Content: Services (Consultation Types) */}
            {settingsTab === 'services' && !onboardingMode && (
                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 animate-fade-in">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Gerenciar Tipos de Consulta</h3>
                    <div className="space-y-4 mb-6">
                        {consultationTypes.map(ct => {
                            const isEditing = editingTypeId === ct.id;
                            return (
                                <div key={ct.id} className="flex flex-col sm:flex-row justify-between items-center p-3 bg-slate-50 rounded border border-slate-100 gap-3">
                                    {isEditing ? (
                                        <div className="flex-grow flex gap-2 w-full">
                                            <input 
                                                type="text" 
                                                value={editTypeName} 
                                                onChange={(e) => setEditTypeName(e.target.value)}
                                                className="flex-grow p-1.5 border rounded text-sm"
                                                placeholder="Nome do Serviço"
                                            />
                                            <input 
                                                type="text" 
                                                value={editTypePrice} 
                                                onChange={handleEditPriceChange}
                                                className="w-28 p-1.5 border rounded text-sm"
                                                placeholder="Preço"
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex-grow text-center sm:text-left">
                                            <span className="font-medium text-slate-700">{ct.name}</span>
                                            <span className="text-slate-500 text-sm ml-2">- {ct.price.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</span>
                                        </div>
                                    )}
                                    
                                    <div className="flex items-center gap-2">
                                        {isEditing ? (
                                            <>
                                                <button onClick={() => handleSaveEdit(ct.id)} className="text-emerald-600 hover:text-emerald-800 flex items-center gap-1 text-xs font-medium px-3 py-1 bg-emerald-50 rounded-full border border-emerald-200 transition-colors">
                                                    <CheckIcon /> Salvar
                                                </button>
                                                <button onClick={handleCancelEdit} className="text-slate-600 hover:text-slate-800 flex items-center gap-1 text-xs font-medium px-3 py-1 bg-slate-200 rounded-full border border-slate-300 transition-colors">
                                                    <CloseIcon /> Cancelar
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button onClick={() => handleStartEdit(ct)} className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 text-xs font-medium px-3 py-1 bg-indigo-50 rounded-full border border-indigo-200 transition-colors">
                                                    <EditIcon className="w-3 h-3" /> Editar
                                                </button>
                                                <button onClick={() => handleDeleteConsultationType(ct.id)} className="text-rose-600 hover:text-rose-800 flex items-center gap-1 text-xs font-medium px-3 py-1 bg-rose-50 rounded-full border border-rose-200 transition-colors">
                                                    <TrashIcon /> Excluir
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <form onSubmit={handleAddConsultationType} className="flex flex-col sm:flex-row gap-4 items-end bg-slate-50 p-4 rounded-lg">
                        <div className="w-full">
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Nome do Serviço</label>
                            <input type="text" value={newTypeName} onChange={handleTypeNameChange} className="w-full p-2 border rounded-md bg-white text-sm" placeholder="Ex: Sessão Online" />
                            {typeErrors.name && <p className="text-red-500 text-xs mt-1">{typeErrors.name}</p>}
                        </div>
                        <div className="w-full sm:w-32">
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Valor</label>
                            <input type="text" value={newTypePrice} onChange={handlePriceChange} className="w-full p-2 border rounded-md bg-white text-sm" placeholder="R$ 0,00" />
                            {typeErrors.price && <p className="text-red-500 text-xs mt-1">{typeErrors.price}</p>}
                        </div>
                        <button type="submit" className="w-full sm:w-auto px-4 py-2 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 text-sm font-medium whitespace-nowrap">Adicionar</button>
                    </form>
                </div>
            )}

            {/* Tab Content: Data Management */}
            {settingsTab === 'data' && !onboardingMode && (
                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 animate-fade-in space-y-8">
                    
                    {/* Backup Section */}
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">Backup de Segurança Completo</h3>
                        <p className="text-sm text-slate-600 mb-6">Gera um arquivo contendo todos os pacientes, consultas, financeiro, prontuários, logs e configurações (incluindo foto e assinatura).</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button onClick={handleInitiateBackup} className="flex flex-col items-center justify-center p-6 border-2 border-slate-100 rounded-lg hover:border-indigo-100 hover:bg-indigo-50 transition-all group">
                                <div className="text-indigo-500 mb-3 group-hover:scale-110 transition-transform bg-white p-3 rounded-full shadow-sm">
                                    <DownloadIcon />
                                </div>
                                <span className="font-bold text-slate-700">Fazer Backup Completo</span>
                                <span className="text-xs text-slate-400 text-center mt-1">Salvar todos os dados e configurações</span>
                            </button>
                            
                            <button onClick={handleTriggerRestore} className="flex flex-col items-center justify-center p-6 border-2 border-slate-100 rounded-lg hover:border-amber-100 hover:bg-amber-50 transition-all group relative">
                                <div className="text-amber-500 mb-3 group-hover:scale-110 transition-transform bg-white p-3 rounded-full shadow-sm">
                                    <UploadIcon />
                                </div>
                                <span className="font-bold text-slate-700">Restaurar Sistema</span>
                                <span className="text-xs text-slate-400 text-center mt-1">Carregar arquivo de backup</span>
                                <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".json" className="hidden" />
                            </button>
                        </div>
                    </div>

                    <hr className="border-slate-100" />

                    {/* Developer Section */}
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                            Área do Desenvolvedor
                            {isDevModeUnlocked && <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-full">Desbloqueado</span>}
                        </h3>
                        
                        {!isDevModeUnlocked ? (
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                <p className="text-sm text-slate-600 mb-3">Funcionalidades avançadas para testes. Insira a senha mestra para liberar.</p>
                                <form onSubmit={handleUnlockDevMode} className="flex gap-2">
                                    <input 
                                        type="password" 
                                        placeholder="Senha Mestra"
                                        value={devModePassword}
                                        onChange={(e) => setDevModePassword(e.target.value)}
                                        className="p-2 border rounded-md text-sm flex-grow"
                                    />
                                    <button type="submit" className="px-4 py-2 bg-slate-800 text-white rounded-md text-sm font-medium hover:bg-slate-900">Desbloquear</button>
                                </form>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <button onClick={handleLoadMockData} className="flex flex-col items-center justify-center p-4 border-2 border-slate-100 rounded-lg hover:border-emerald-100 hover:bg-emerald-50 transition-all group">
                                    <div className="text-emerald-500 mb-2 group-hover:scale-110 transition-transform"><span className="text-xl font-bold">M</span></div>
                                    <span className="font-medium text-slate-700">Carregar Teste</span>
                                    <span className="text-xs text-slate-400 text-center mt-1">Dados fictícios</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Tab Content: Documentation */}
            {settingsTab === 'docs' && !onboardingMode && (
                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 animate-fade-in space-y-8 text-slate-700">
                    <div>
                        <h3 className="text-xl font-bold text-indigo-800 mb-4">Documentação do Sistema</h3>
                        <p className="text-sm text-slate-600 leading-relaxed">
                            Bem-vinda ao Sistema de Gestão Clínica da Dra. Vanessa Gonçalves. 
                            Esta plataforma foi projetada para otimizar o dia a dia do consultório, unificando agendamentos, prontuários e controle financeiro em um ambiente seguro e intuitivo.
                        </p>
                    </div>

                    <div>
                        <h4 className="text-lg font-semibold text-slate-800 mb-3 pb-2 border-b border-slate-100">Principais Funcionalidades</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <h5 className="font-bold text-slate-700 mb-1">Gestão de Pacientes</h5>
                                <p className="text-xs text-slate-500">
                                    Cadastro completo, histórico de contatos, visualização rápida de status (ativo/inativo) e acesso direto ao prontuário e financeiro individual.
                                </p>
                            </div>
                            <div>
                                <h5 className="font-bold text-slate-700 mb-1">Agendamento Inteligente</h5>
                                <p className="text-xs text-slate-500">
                                    Agenda visual com calendário, prevenção de conflitos de horário, status de consultas (Agendada, Realizada, Cancelada) e envio de lembretes via WhatsApp.
                                </p>
                            </div>
                            <div>
                                <h5 className="font-bold text-slate-700 mb-1">Prontuário Eletrônico (PEP)</h5>
                                <p className="text-xs text-slate-500">
                                    Ficha de anamnese detalhada, registro cronológico de sessões, avaliação de evolução com gráficos e cronômetro de consulta integrado.
                                </p>
                            </div>
                            <div>
                                <h5 className="font-bold text-slate-700 mb-1">Módulo Financeiro</h5>
                                <p className="text-xs text-slate-500">
                                    Controle de receitas e despesas, emissão de recibos automáticos após consultas, relatórios semanais/mensais em PDF e dashboard administrativo.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-lg font-semibold text-slate-800 mb-3 pb-2 border-b border-slate-100">Fluxo de Trabalho Sugerido</h4>
                        <ol className="list-decimal list-inside text-sm text-slate-600 space-y-2">
                            <li>Cadastre o paciente no módulo <strong>Pacientes</strong>.</li>
                            <li>Vá para <strong>Agendamento</strong> e marque a consulta.</li>
                            <li>No dia do atendimento, utilize o botão <strong>Iniciar</strong> no Dashboard ou Agenda.</li>
                            <li>O sistema abrirá o <strong>Prontuário</strong> e iniciará o cronômetro.</li>
                            <li>Realize as anotações da sessão e salve.</li>
                            <li>Ao finalizar, clique em <strong>Encerrar Atendimento</strong>.</li>
                            <li>Confirme o pagamento para gerar o lançamento financeiro e o recibo automaticamente.</li>
                        </ol>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mt-8">
                        <h4 className="text-sm font-bold text-slate-700 mb-2">Garantia e Direitos Autorais</h4>
                        <p className="text-xs text-slate-500 mb-2">
                            Este software é uma ferramenta profissional licenciada exclusivamente para uso na Clínica de Psicanálise Vanessa Gonçalves.
                        </p>
                        <p className="text-xs text-slate-500">
                            © 2025 Sistema de Gestão Clínica. Todos os direitos reservados. A reprodução não autorizada, engenharia reversa ou distribuição deste software é estritamente proibida e protegida pelas leis de propriedade intelectual vigentes.
                        </p>
                    </div>
                </div>
            )}

            {/* Tab Content: Audit Log (Restricted) */}
            {settingsTab === 'audit' && isMasterAccess && !onboardingMode && (
                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 animate-fade-in">
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                        <h3 className="text-lg font-semibold text-slate-800">Logs de Atividade</h3>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <input 
                            type="text" 
                            placeholder="Buscar nos logs..." 
                            value={auditSearch}
                            onChange={e => setAuditSearch(e.target.value)}
                            className="p-2 border rounded-md text-sm flex-grow"
                            />
                            <input 
                            type="date"
                            value={auditDateFilter}
                            onChange={e => setAuditDateFilter(e.target.value)}
                            className="p-2 border rounded-md text-sm"
                            />
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="text-left py-3 px-4 font-semibold text-slate-600">Data/Hora</th>
                                    <th className="text-left py-3 px-4 font-semibold text-slate-600">Ação</th>
                                    <th className="text-left py-3 px-4 font-semibold text-slate-600">Detalhes</th>
                                    <th className="text-left py-3 px-4 font-semibold text-slate-600">Usuário</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredAuditLogs.length > 0 ? filteredAuditLogs.map(log => (
                                    <tr key={log.id} className="hover:bg-slate-50">
                                        <td className="py-2 px-4 whitespace-nowrap text-slate-500">{new Date(log.timestamp).toLocaleString('pt-BR')}</td>
                                        <td className="py-2 px-4 font-medium text-slate-700">{log.action}</td>
                                        <td className="py-2 px-4 text-slate-600">{log.details}</td>
                                        <td className="py-2 px-4 text-slate-500 text-xs">{log.user}</td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={4} className="text-center py-8 text-slate-500">Nenhum registro encontrado.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {onboardingMode && (
                <div className="flex justify-end pt-4">
                    <button 
                        onClick={handleFinishOnboarding}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-full font-bold shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2"
                    >
                        <CheckIcon />
                        Concluir Configuração
                    </button>
                </div>
            )}
         </div>

    </ModuleContainer>
  );
};

export default SettingsModule;
