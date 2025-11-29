
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { View, SessionNote, Anamnesis, InternalObservation, Patient, Appointment, Transaction } from '../types';
import ModuleContainer from './ModuleContainer';
import { getTodayString } from '../utils/formatting';
import PrintIcon from './icons/PrintIcon';
import CloseIcon from './icons/CloseIcon';
import PlayIcon from './icons/PlayIcon';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import EditIcon from './icons/EditIcon';

const Tooltip: React.FC<{ text: string }> = ({ text }) => (
  <span className="absolute right-0 bottom-full mb-2 w-max max-w-xs p-2 text-xs text-white bg-slate-700 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50">
    {text}
    <svg className="absolute text-slate-700 h-2 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255">
      <polygon className="fill-current" points="0,0 127.5,127.5 255,0"/>
    </svg>
  </span>
);

interface ElectronicHealthRecordProps {
  onNavigate: (view: View) => void;
  patientId: string | null;
  patients: Patient[];
  setPatients: React.Dispatch<React.SetStateAction<Patient[]>>;
  notes: SessionNote[];
  setNotes: React.Dispatch<React.SetStateAction<SessionNote[]>>;
  observations: InternalObservation[];
  setObservations: React.Dispatch<React.SetStateAction<InternalObservation[]>>;
  appointments: Appointment[];
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  isConsultationMode: boolean;
  showStartButton?: boolean;
  onLogAction: (action: string, details: string) => void;
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
  signatureImage?: string | null;
  onModalStateChange?: (isOpen: boolean) => void;
}

const initialAnamnesisForm: Anamnesis = {
  civilStatus: '', hasChildren: '', numberOfChildren: '', hadAbortion: '', occupation: '', educationLevel: '',
  mothersName: '', mothersRelationship: '', fathersName: '', fathersRelationship: '', hasSiblings: '',
  numberOfSiblings: '', siblingsRelationship: '', childhoodDescription: '',
  continuousMedication: '', medicationsDetails: '', relevantMedicalDiagnosis: '',
  substanceUse_marijuana: false, substanceUse_cocaine: false, substanceUse_alcohol: false,
  substanceUse_cigarette: false, substanceUse_none: false, sleepQuality: '',
  mainSymptoms_sadness: false, mainSymptoms_depression: false, mainSymptoms_anxiety: false,
  mainSymptoms_nervousness: false, mainSymptoms_phobias: false, mainSymptoms_otherFear: '',
  anxietyLevel: '', irritabilityLevel: '', sadnessLevel: '', carriesGuilt: '', carriesInjustice: '',
  suicidalThoughts: '', suicidalThoughtsComment: '',
  hasCloseFriends: '', socialConsideration: 'expansivo(a)', physicalActivity: '', financialStatus: '', dailyRoutine: '',
  howFoundAnalysis: '', howFoundAnalysisOther: '', previousTherapy: '', previousTherapyDuration: '',
  mainReason: '', situationStart: '', triggeringEvent: '', expectationsAnalysis: '',
  generalObservations: '',
};

const ElectronicHealthRecord: React.FC<ElectronicHealthRecordProps> = ({
  onNavigate,
  patientId,
  patients,
  setPatients,
  notes,
  setNotes,
  observations,
  setObservations,
  appointments,
  setAppointments,
  setTransactions,
  isConsultationMode,
  showStartButton = true,
  onLogAction,
  onShowToast,
  signatureImage,
  onModalStateChange
}) => {
  const patient = useMemo(() => patients.find(p => p.id === patientId), [patientId, patients]);
  const patientNotes = useMemo(() => notes.filter(n => n.patientId === patientId).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [notes, patientId]);
  
  const todayAppointment = useMemo(() => {
    const todayString = getTodayString();
    return appointments.find(app => app.patientId === patientId && app.date === todayString && app.status === 'scheduled');
  }, [appointments, patientId]);

  const [activeTab, setActiveTab] = useState<'anamnese' | 'prontuario' | 'evolucao'>('anamnese');
  const [newNote, setNewNote] = useState('');
  const [isAnamnesisFormVisible, setIsAnamnesisFormVisible] = useState(false);
  const [anamnesisForm, setAnamnesisForm] = useState<Anamnesis>(patient?.anamnesis || initialAnamnesisForm);
  
  // Evaluation Modal State
  const [isEvaluationModalOpen, setIsEvaluationModalOpen] = useState(false);
  const [selectedEvaluation, setSelectedEvaluation] = useState<'pessimo' | 'ruim' | 'bom' | 'otimo' | null>(null);

  // Edit Note State
  const [editingNote, setEditingNote] = useState<SessionNote | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editEvaluation, setEditEvaluation] = useState<'pessimo' | 'ruim' | 'bom' | 'otimo' | null>(null);

  useEffect(() => {
    if (patient) {
      setAnamnesisForm(patient.anamnesis || initialAnamnesisForm);
      setIsAnamnesisFormVisible(false);
    }
  }, [patient]);


  const [timer, setTimer] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);

  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [isEndConsultationModalOpen, setIsEndConsultationModalOpen] = useState(false);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Pix');

  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<{name: string, amount: number, method: string, date: string} | null>(null);

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Modal State Notification for Sidebar
  const hasOpenModal = isStartModalOpen || isEndConsultationModalOpen || isPaymentModalOpen || isReceiptModalOpen || isExportModalOpen || isEvaluationModalOpen || !!editingNote;
  useEffect(() => {
    if (onModalStateChange) {
      onModalStateChange(hasOpenModal);
    }
    return () => {
      if (onModalStateChange) onModalStateChange(false);
    };
  }, [hasOpenModal, onModalStateChange]);

  useEffect(() => {
    if (isConsultationMode) {
        setIsTimerActive(true);
    } else {
        setIsTimerActive(false);
        setTimer(0);
    }
  }, [isConsultationMode]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isTimerActive) {
        interval = setInterval(() => {
            setTimer((prev) => prev + 1);
        }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerActive]);

  const formatTimer = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleStartConsultation = () => {
      setIsTimerActive(true);
      setIsStartModalOpen(true);
      setTimeout(() => {
          setIsStartModalOpen(false);
      }, 2000);
  };

  const handleEndConsultation = () => {
      setIsEndConsultationModalOpen(true);
  };

  const confirmEndConsultation = () => {
      setIsTimerActive(false);
      setIsEndConsultationModalOpen(false);
      if (todayAppointment && todayAppointment.status !== 'completed') {
          setIsPaymentModalOpen(true);
      }
  };

  const isAnamnesisComplete = useMemo(() => {
    return !!patient?.anamnesis && Object.values(patient.anamnesis).some(val => val !== '' && val !== false && val !== 0);
  }, [patient?.anamnesis]);


  const hasTodayNoteSaved = useMemo(() => {
    if (!todayAppointment) return false;
    return patientNotes.some(note => note.appointmentId === todayAppointment.id);
  }, [patientNotes, todayAppointment]);

  const canFinalize = isAnamnesisComplete && hasTodayNoteSaved;

  const handleInitiateSaveNote = () => {
      if (newNote.trim() && patientId) {
          setIsEvaluationModalOpen(true);
          setSelectedEvaluation(null);
      }
  };

  const handleConfirmSaveNote = () => {
    if (newNote.trim() && patientId && selectedEvaluation) {
        const note: SessionNote = {
            id: `n${Date.now()}`,
            patientId,
            date: new Date().toISOString(),
            content: newNote,
            appointmentId: todayAppointment?.id,
            evaluation: selectedEvaluation
        };
        setNotes(prev => [note, ...prev]);
        onLogAction('Anotação de Sessão Criada', `Paciente: ${patient?.name} - Avaliação: ${selectedEvaluation}`);
        onShowToast('Anotação e avaliação salvas com sucesso!', 'success');
        setNewNote('');
        setIsEvaluationModalOpen(false);
        setSelectedEvaluation(null);
    } else if (!selectedEvaluation) {
        onShowToast('Por favor, selecione uma opção de avaliação.', 'error');
    }
  };

  // Edit Note Functions
  const handleOpenEditNote = (note: SessionNote) => {
      setEditingNote(note);
      setEditContent(note.content);
      setEditEvaluation(note.evaluation || null);
  };

  const handleCloseEditNote = () => {
      setEditingNote(null);
      setEditContent('');
      setEditEvaluation(null);
  };

  const handleSaveEditedNote = () => {
      if (editingNote && editContent.trim()) {
          const updatedNotes = notes.map(n => 
              n.id === editingNote.id 
                  ? { ...n, content: editContent, evaluation: editEvaluation || undefined }
                  : n
          );
          setNotes(updatedNotes);
          onLogAction('Anotação Editada', `Paciente: ${patient?.name}, Nota ID: ${editingNote.id}`);
          onShowToast('Anotação atualizada com sucesso!', 'success');
          handleCloseEditNote();
      } else {
          onShowToast('O conteúdo da anotação não pode estar vazio.', 'error');
      }
  };

  const handleAnamnesisFormChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    // Type narrowing for checkbox
    const checked = (e.target as HTMLInputElement).checked;

    setAnamnesisForm(prev => {
        let newState = { ...prev };

        if (type === 'checkbox') {
            const isSubstanceUse = name.startsWith('substanceUse_');
            
            if (isSubstanceUse) {
                if (name === 'substanceUse_none') {
                    // If 'none' is checked, uncheck others. If unchecked, just uncheck itself.
                    if (checked) {
                         newState = {
                            ...newState,
                            substanceUse_marijuana: false,
                            substanceUse_cocaine: false,
                            substanceUse_alcohol: false,
                            substanceUse_cigarette: false,
                            substanceUse_none: true,
                        };
                    } else {
                         newState = { ...newState, substanceUse_none: false };
                    }
                } else {
                     // If any other substance is checked, uncheck 'none'
                     newState = {
                        ...newState,
                        [name]: checked,
                        substanceUse_none: false,
                    };
                }
            } else {
                // Normal checkbox (symptoms)
                newState = { ...newState, [name]: checked };
            }
        } else if (type === 'number') {
            newState = { ...newState, [name]: value === '' ? '' : Number(value) };
        } else {
            newState = { ...newState, [name]: value };
        }
        return newState;
    });
  }, []);

  const handleSaveAnamnesis = () => {
    if(patient) {
      const updatedPatient = {...patient, anamnesis: anamnesisForm };
      setPatients(prev => prev.map(p => p.id === patient.id ? updatedPatient : p));
      onLogAction('Anamnese Atualizada', `Paciente: ${patient.name}`);
      onShowToast('Ficha de anamnese atualizada.', 'success');
    }
    setIsAnamnesisFormVisible(false);

    if (todayAppointment && todayAppointment.status !== 'completed' && !isTimerActive && canFinalize) {
        setIsPaymentModalOpen(true);
    }
  };

  const handleConfirmPaymentAndFinalize = () => {
    if (todayAppointment) {
      setReceiptData({
          name: todayAppointment.patientName,
          amount: todayAppointment.price,
          method: paymentMethod,
          date: todayAppointment.date
      });

      setIsTimerActive(false);
      
      setAppointments(prev => prev.map(app =>
        app.id === todayAppointment.id ? { ...app, status: 'completed' } : app
      ));
      const newTransaction: Transaction = {
        id: `t${Date.now()}`,
        description: `Consulta - ${todayAppointment.patientName} (${paymentMethod})`,
        amount: todayAppointment.price,
        type: 'income',
        date: todayAppointment.date,
        patientId: todayAppointment.patientId,
      };
      setTransactions(prev => [...prev, newTransaction]);
      onLogAction('Consulta Finalizada e Paga', `Paciente: ${todayAppointment.patientName}. Valor: ${todayAppointment.price}. Método: ${paymentMethod}`);
      onShowToast('Consulta finalizada com sucesso.', 'success');

      setIsPaymentModalOpen(false);
      setIsReceiptModalOpen(true);
    }
  };

  const handleGenerateReceipt = async () => {
      if (!receiptData) return;

      // Fix Fullscreen conflict
      if (document.fullscreenElement) {
        try {
            await document.exitFullscreen();
        } catch (e) {
            console.error("Error exiting fullscreen", e);
        }
      }

      setIsReceiptModalOpen(false);

      setTimeout(() => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            const todayString = new Date().toISOString().slice(0, 10);
            printWindow.document.title = `Recibo - ${receiptData.name} - ${todayString}`;
            
            const signatureContent = signatureImage 
              ? `<img src="${signatureImage}" class="sig-img" alt="Assinatura" />` 
              : `<div class="line"></div>`;

            const styles = `
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
              body { font-family: 'Inter', sans-serif; margin: 0; padding: 0; color: #444; min-height: 100vh; display: flex; justify-content: center; align-items: center; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .receipt-container { width: 80%; max-width: 700px; border: 2px solid #3730a3; padding: 40px; background-color: rgba(255, 255, 255, 0.95); }
              .header { text-align: center; border-bottom: 1px solid #ddd; padding-bottom: 20px; margin-bottom: 30px; }
              .header h1 { color: #3730a3; margin: 0; font-size: 28px; letter-spacing: 2px; }
              .content { font-size: 16px; line-height: 2; }
              .signature { margin-top: 60px; text-align: center; }
              .line { border-top: 1px solid #333; width: 60%; margin: 0 auto 10px auto; }
              .sig-img { max-height: 80px; display: block; margin: 0 auto 5px auto; max-width: 200px; }
            `;
            const reportHTML = `
              <html><head><title>Recibo</title><style>${styles}</style></head>
                  <body>
                      <div class="receipt-container">
                          <div class="header"><h1>RECIBO</h1></div>
                          <div class="content">
                              <p>Recebi de <strong>${receiptData.name}</strong></p>
                              <p>A importância de <strong>${receiptData.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></p>
                              <p>Referente a <strong>Atendimento Psicológico / Psicanálise</strong>.</p>
                              <p>Data do atendimento: ${new Date(receiptData.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</p>
                              <p>Forma de pagamento: ${receiptData.method}</p>
                          </div>
                          <div class="signature">${signatureContent}<p><strong>Vanessa Gonçalves</strong></p><p>Psicanalista Clínica</p></div>
                      </div>
                  </body>
              </html>
            `;
            printWindow.document.write(reportHTML);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
        }
      }, 100);
  };

  const handleExportPDF = async (type: 'full' | 'blank') => {
    if (!patient) return;
    
    // Fix Fullscreen conflict
    if (document.fullscreenElement) {
        try {
            await document.exitFullscreen();
        } catch (e) {
            console.error("Error exiting fullscreen", e);
        }
    }

    setIsExportModalOpen(false);
    onLogAction('Exportação de Prontuário', `Tipo: ${type === 'full' ? 'Completo' : 'Em Branco'}. Paciente: ${patient.name}`);
    onShowToast('Gerando documento...', 'info');

    setTimeout(() => {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
          const todayString = new Date().toISOString().slice(0, 10);
          
          const docTitle = type === 'full' ? "Ficha clínica, Anamnese" : `Ficha Clínica em Branco`;
          printWindow.document.title = `${docTitle} - ${patient.name} - ${todayString}`;

          const styles = `
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
              @media print {
                  @page { size: A4; margin: 20mm; }
                  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                  .no-print { display: none; }
              }
              body { font-family: 'Inter', sans-serif; margin: 0; padding: 20px; color: #111827; font-size: 10pt; line-height: 1.4; background: #fff; }
              .page-container { width: 100%; max-width: 210mm; margin: 0 auto; }
              
              .header { text-align: center; margin-bottom: 2rem; border-bottom: 2px solid #3730a3; padding-bottom: 1rem; }
              h1.doc-title { font-size: 16pt; margin: 0; color: #3730a3; text-transform: uppercase; letter-spacing: 1px; }
              .doc-subtitle { font-size: 10pt; color: #6b7280; margin-top: 5px; }
              
              .section { margin-bottom: 1.5rem; break-inside: avoid; }
              .section-title { 
                  font-size: 11pt; 
                  font-weight: 700; 
                  color: #1e1b4b; 
                  background-color: #e0e7ff; 
                  padding: 6px 10px; 
                  margin-bottom: 10px; 
                  border-left: 4px solid #3730a3; 
                  text-transform: uppercase;
              }
              
              .row { display: flex; flex-wrap: wrap; margin-bottom: 6px; }
              .col { flex: 1; min-width: 150px; margin-right: 15px; margin-bottom: 4px; }
              .col.full { width: 100%; flex: 100%; }
              
              .label { font-weight: 700; color: #4b5563; font-size: 9pt; margin-right: 4px; }
              .value { color: #000; font-weight: 400; }
              
              .list-value { display: inline-block; background: #f3f4f6; padding: 1px 6px; border-radius: 4px; font-size: 9pt; margin-right: 4px; border: 1px solid #e5e7eb; }
              
              .blank-line { border-bottom: 1px solid #d1d5db; height: 24px; margin-bottom: 8px; }
              
              .session-note { border-bottom: 1px dashed #cbd5e1; padding-bottom: 10px; margin-bottom: 10px; }
              .session-header { display: flex; justify-content: space-between; font-weight: bold; font-size: 9pt; color: #3730a3; margin-bottom: 4px; }
              .session-content { font-size: 10pt; text-align: justify; white-space: pre-wrap; }
              
              .evaluation-tag { font-size: 8pt; font-weight: bold; padding: 1px 5px; border-radius: 3px; color: white; text-transform: capitalize; }
              .eval-pessimo { background-color: #e11d48; }
              .eval-ruim { background-color: #f59e0b; }
              .eval-bom { background-color: #10b981; }
              .eval-otima { background-color: #3b82f6; }
              
              .footer { position: fixed; bottom: 0; left: 0; right: 0; text-align: center; font-size: 8pt; color: #9ca3af; padding-top: 10px; background: white; border-top: 1px solid #eee; }

              /* CSS for Blank Form */
              .line-fill { border-bottom: 1px solid #999; display: inline-block; flex-grow: 1; margin-left: 5px; min-width: 50px; }
              .check-opt { margin-right: 10px; font-size: 9pt; }
              .check-opt::before { content: "( ) "; font-family: monospace; }
              .big-space { height: 80px; border-bottom: 1px solid #ddd; margin-bottom: 10px; }
          `;

          let bodyContent = `
              <div class="page-container">
                  <div class="header">
                      <h1 class="doc-title">${docTitle}</h1>
                      <p class="doc-subtitle">Clínica Vanessa Gonçalves • Paciente: ${patient.name}</p>
                  </div>
          `;

          // Helper to format text
          const fmt = (val: string | number | undefined | null) => {
              if (val === undefined || val === null || val === '') return '-';
              return String(val).charAt(0).toUpperCase() + String(val).slice(1);
          };

          // Helper to format lists (symptoms/substances)
          const fmtList = (items: string[]) => {
              if (items.length === 0) return '-';
              return items.map(i => `<span class="list-value">${i}</span>`).join('');
          };

          if (type === 'blank') {
              bodyContent += `
                  <div class="section">
                      <div class="section-title">1. Dados Pessoais</div>
                      <div class="row">
                          <div class="col full"><span class="label">Nome:</span> ${patient.name}</div>
                      </div>
                      <div class="row">
                          <div class="col full"><span class="label">Estado Civil:</span> 
                              <span class="check-opt">Solteiro(a)</span> 
                              <span class="check-opt">Casado(a)</span> 
                              <span class="check-opt">Divorciado(a)</span> 
                              <span class="check-opt">Viúvo(a)</span>
                          </div>
                      </div>
                      <div class="row">
                          <div class="col"><span class="label">Possui Filhos?</span> <span class="check-opt">Sim</span> <span class="check-opt">Não</span> Quantos? ______</div>
                          <div class="col"><span class="label">Aborto?</span> <span class="check-opt">Sim</span> <span class="check-opt">Não</span></div>
                      </div>
                      <div class="row">
                          <div class="col full" style="display:flex;"><span class="label">Profissão:</span> <div class="line-fill"></div></div>
                      </div>
                      <div class="row">
                          <div class="col full"><span class="label">Escolaridade:</span> 
                              <span class="check-opt">Fundamental</span> 
                              <span class="check-opt">Médio</span> 
                              <span class="check-opt">Graduação</span> 
                              <span class="check-opt">Pós-Grad.</span>
                          </div>
                      </div>
                  </div>

                  <div class="section">
                      <div class="section-title">2. Histórico Familiar</div>
                      <div class="row">
                          <div class="col full" style="display:flex;"><span class="label">Mãe:</span> <div class="line-fill"></div></div>
                      </div>
                      <div class="row">
                          <div class="col full"><span class="label">Relação com Mãe:</span> <span class="check-opt">Péssima</span> <span class="check-opt">Ruim</span> <span class="check-opt">Boa</span> <span class="check-opt">Ótima</span></div>
                      </div>
                      <div class="row">
                          <div class="col full" style="display:flex;"><span class="label">Pai:</span> <div class="line-fill"></div></div>
                      </div>
                      <div class="row">
                          <div class="col full"><span class="label">Relação com Pai:</span> <span class="check-opt">Péssima</span> <span class="check-opt">Ruim</span> <span class="check-opt">Boa</span> <span class="check-opt">Ótima</span></div>
                      </div>
                      <div class="row">
                          <div class="col"><span class="label">Irmãos?</span> <span class="check-opt">Sim</span> <span class="check-opt">Não</span> Quantos? ______</div>
                          <div class="col"><span class="label">Relação:</span> <span class="check-opt">Péssima</span> <span class="check-opt">Ruim</span> <span class="check-opt">Boa</span> <span class="check-opt">Ótima</span></div>
                      </div>
                      <div class="row">
                          <div class="col full"><span class="label">Infância:</span> <span class="check-opt">Péssima</span> <span class="check-opt">Ruim</span> <span class="check-opt">Boa</span> <span class="check-opt">Ótima</span></div>
                      </div>
                  </div>

                  <div class="section">
                      <div class="section-title">3. Saúde Geral</div>
                      <div class="row">
                          <div class="col full" style="display:flex;"><span class="label">Medicação Contínua:</span> <div class="line-fill"></div></div>
                      </div>
                      <div class="row">
                          <div class="col full" style="display:flex;"><span class="label">Diagnóstico Relevante:</span> <div class="line-fill"></div></div>
                      </div>
                      <div class="row">
                          <div class="col full"><span class="label">Uso de Substâncias:</span> 
                              <span class="check-opt">Maconha</span> 
                              <span class="check-opt">Cocaína</span>
                              <span class="check-opt">Álcool</span>
                              <span class="check-opt">Cigarro</span>
                              <span class="check-opt">Nenhuma</span>
                          </div>
                      </div>
                      <div class="row">
                          <div class="col full"><span class="label">Qualidade do Sono:</span> <span class="check-opt">Péssima</span> <span class="check-opt">Ruim</span> <span class="check-opt">Boa</span> <span class="check-opt">Ótima</span></div>
                      </div>
                  </div>

                  <div class="section">
                      <div class="section-title">4. Aspectos Psicológicos</div>
                      <div class="row">
                          <div class="col full"><span class="label">Sintomas:</span> 
                              <span class="check-opt">Tristeza</span> <span class="check-opt">Depressão</span> <span class="check-opt">Ansiedade</span> <span class="check-opt">Nervosismo</span>
                          </div>
                          <div class="col full"><span class="label">Fobias/Medos:</span> <div class="line-fill"></div></div>
                      </div>
                      <div class="row">
                          <div class="col"><span class="label">Ansiedade:</span> ( )Baixo ( )Normal ( )Alto</div>
                          <div class="col"><span class="label">Irritabilidade:</span> ( )Baixo ( )Normal ( )Alto</div>
                          <div class="col"><span class="label">Tristeza:</span> ( )Baixo ( )Normal ( )Alto</div>
                      </div>
                      <div class="row">
                          <div class="col"><span class="label">Culpa?</span> <span class="check-opt">Sim</span> <span class="check-opt">Não</span></div>
                          <div class="col"><span class="label">Injustiça?</span> <span class="check-opt">Sim</span> <span class="check-opt">Não</span></div>
                      </div>
                      <div class="row">
                          <div class="col full"><span class="label">Ideias Suicidas?</span> <span class="check-opt">Sim</span> <span class="check-opt">Não</span> Comentário: _______________________________</div>
                      </div>
                  </div>

                  <div class="section">
                      <div class="section-title">5. Vida Social e Rotina</div>
                      <div class="row">
                          <div class="col"><span class="label">Amigos Próximos?</span> <span class="check-opt">Sim</span> <span class="check-opt">Não</span></div>
                          <div class="col"><span class="label">Socialmente:</span> <span class="check-opt">Expansivo</span> <span class="check-opt">Reservado</span></div>
                          <div class="col"><span class="label">Ativ. Física?</span> <span class="check-opt">Sim</span> <span class="check-opt">Não</span></div>
                      </div>
                      <div class="row">
                          <div class="col"><span class="label">Financeiro:</span> <span class="check-opt">Ruim</span> <span class="check-opt">Estável</span> <span class="check-opt">Bom</span> <span class="check-opt">Ótimo</span></div>
                      </div>
                      <div class="row">
                          <div class="col full"><span class="label">Rotina Diária:</span></div>
                          <div class="blank-line"></div><div class="blank-line"></div>
                      </div>
                  </div>

                  <div class="section">
                      <div class="section-title">6. Buscando Ajuda</div>
                      <div class="row">
                          <div class="col full"><span class="label">Como chegou?</span> <span class="check-opt">Indicação</span> <span class="check-opt">Internet</span> Outro: _________________</div>
                      </div>
                      <div class="row">
                          <div class="col full"><span class="label">Terapia Anterior?</span> <span class="check-opt">Sim</span> <span class="check-opt">Não</span> Tempo: _______________</div>
                      </div>
                      <div class="row"><div class="col full"><span class="label">Motivo Principal:</span></div><div class="blank-line"></div><div class="blank-line"></div></div>
                      <div class="row"><div class="col full" style="display:flex;"><span class="label">Início:</span> <div class="line-fill"></div></div></div>
                      <div class="row"><div class="col full"><span class="label">Evento Desencadeador:</span></div><div class="blank-line"></div></div>
                      <div class="row"><div class="col full"><span class="label">Expectativas:</span></div><div class="blank-line"></div></div>
                  </div>

                  <div class="section">
                      <div class="section-title">7. Observações Gerais</div>
                      <div class="blank-line"></div><div class="blank-line"></div><div class="blank-line"></div>
                  </div>
              `;
          } else if (patient.anamnesis) {
              const a = patient.anamnesis;
              
              // 1. Dados Pessoais
              bodyContent += `
                  <div class="section">
                      <div class="section-title">1. Dados Pessoais</div>
                      <div class="row">
                          <div class="col"><span class="label">Nome:</span> <span class="value">${patient.name}</span></div>
                          <div class="col"><span class="label">Nascimento:</span> <span class="value">${new Date(patient.dateOfBirth).toLocaleDateString('pt-BR', {timeZone:'UTC'})}</span></div>
                      </div>
                      <div class="row">
                          <div class="col"><span class="label">Estado Civil:</span> <span class="value">${fmt(a.civilStatus).replace('(a)', '')}</span></div>
                          <div class="col"><span class="label">Filhos:</span> <span class="value">${fmt(a.hasChildren)} ${a.hasChildren === 'sim' ? `(${a.numberOfChildren})` : ''}</span></div>
                          <div class="col"><span class="label">Aborto:</span> <span class="value">${fmt(a.hadAbortion)}</span></div>
                      </div>
                      <div class="row">
                          <div class="col"><span class="label">Profissão:</span> <span class="value">${fmt(a.occupation)}</span></div>
                          <div class="col"><span class="label">Escolaridade:</span> <span class="value">${fmt(a.educationLevel).replace('_', ' ')}</span></div>
                      </div>
                  </div>
              `;

              // 2. Histórico Familiar
              bodyContent += `
                  <div class="section">
                      <div class="section-title">2. Histórico Familiar</div>
                      <div class="row">
                          <div class="col full"><span class="label">Mãe:</span> <span class="value">${a.mothersName || '-'} (Relação: ${fmt(a.mothersRelationship)})</span></div>
                      </div>
                      <div class="row">
                          <div class="col full"><span class="label">Pai:</span> <span class="value">${a.fathersName || '-'} (Relação: ${fmt(a.fathersRelationship)})</span></div>
                      </div>
                      <div class="row">
                          <div class="col"><span class="label">Irmãos:</span> <span class="value">${fmt(a.hasSiblings)} ${a.hasSiblings === 'sim' ? `(${a.numberOfSiblings}) - Relação: ${fmt(a.siblingsRelationship)}` : ''}</span></div>
                      </div>
                      <div class="row">
                          <div class="col full"><span class="label">Infância:</span> <span class="value">${fmt(a.childhoodDescription)}</span></div>
                      </div>
                  </div>
              `;

              // 3. Saúde Geral
              const substances = [
                  a.substanceUse_marijuana && 'Maconha', a.substanceUse_cocaine && 'Cocaína',
                  a.substanceUse_alcohol && 'Álcool', a.substanceUse_cigarette && 'Cigarro',
                  a.substanceUse_none && 'Nenhuma'
              ].filter(Boolean) as string[];

              bodyContent += `
                  <div class="section">
                      <div class="section-title">3. Saúde Geral</div>
                      <div class="row">
                          <div class="col full"><span class="label">Medicação Contínua:</span> <span class="value">${fmt(a.continuousMedication)} ${a.continuousMedication === 'sim' ? `(${a.medicationsDetails})` : ''}</span></div>
                      </div>
                      <div class="row">
                          <div class="col full"><span class="label">Diagnóstico Médico:</span> <span class="value">${fmt(a.relevantMedicalDiagnosis)}</span></div>
                      </div>
                      <div class="row">
                          <div class="col"><span class="label">Uso de Substâncias:</span> <span class="value">${fmtList(substances)}</span></div>
                          <div class="col"><span class="label">Qualidade do Sono:</span> <span class="value">${fmt(a.sleepQuality)}</span></div>
                      </div>
                  </div>
              `;

              // 4. Aspectos Psicológicos
              const symptoms = [
                  a.mainSymptoms_sadness && 'Tristeza', a.mainSymptoms_depression && 'Depressão',
                  a.mainSymptoms_anxiety && 'Ansiedade', a.mainSymptoms_nervousness && 'Nervosismo',
                  a.mainSymptoms_phobias && 'Fobias'
              ].filter(Boolean) as string[];
              if(a.mainSymptoms_otherFear) symptoms.push(`Outro: ${a.mainSymptoms_otherFear}`);

              bodyContent += `
                  <div class="section">
                      <div class="section-title">4. Aspectos Psicológicos e Emocionais</div>
                      <div class="row">
                          <div class="col full"><span class="label">Principais Sintomas:</span> <span class="value">${fmtList(symptoms)}</span></div>
                      </div>
                      <div class="row">
                          <div class="col"><span class="label">Nível Ansiedade:</span> <span class="value">${fmt(a.anxietyLevel)}</span></div>
                          <div class="col"><span class="label">Nível Irritabilidade:</span> <span class="value">${fmt(a.irritabilityLevel)}</span></div>
                          <div class="col"><span class="label">Nível Tristeza:</span> <span class="value">${fmt(a.sadnessLevel)}</span></div>
                      </div>
                      <div class="row">
                          <div class="col"><span class="label">Culpa:</span> <span class="value">${fmt(a.carriesGuilt)}</span></div>
                          <div class="col"><span class="label">Injustiça:</span> <span class="value">${fmt(a.carriesInjustice)}</span></div>
                      </div>
                      <div class="row">
                          <div class="col full"><span class="label">Pensamentos Suicidas:</span> <span class="value">${fmt(a.suicidalThoughts)} ${a.suicidalThoughts === 'sim' ? `(${a.suicidalThoughtsComment})` : ''}</span></div>
                      </div>
                  </div>
              `;

              // 5. Vida Social
              bodyContent += `
                  <div class="section">
                      <div class="section-title">5. Vida Social e Rotina</div>
                      <div class="row">
                          <div class="col"><span class="label">Amigos Próximos:</span> <span class="value">${fmt(a.hasCloseFriends)}</span></div>
                          <div class="col"><span class="label">Socialmente:</span> <span class="value">${fmt(a.socialConsideration)}</span></div>
                          <div class="col"><span class="label">Atividade Física:</span> <span class="value">${fmt(a.physicalActivity)}</span></div>
                      </div>
                      <div class="row">
                          <div class="col"><span class="label">Financeiro:</span> <span class="value">${fmt(a.financialStatus)}</span></div>
                      </div>
                      <div class="row">
                          <div class="col full"><span class="label">Rotina Diária:</span> <span class="value">${fmt(a.dailyRoutine)}</span></div>
                      </div>
                  </div>
              `;

              // 6. Buscando Ajuda
              bodyContent += `
                  <div class="section">
                      <div class="section-title">6. Buscando Ajuda</div>
                      <div class="row">
                          <div class="col"><span class="label">Origem:</span> <span class="value">${fmt(a.howFoundAnalysis)} ${a.howFoundAnalysis === 'outro' ? `(${a.howFoundAnalysisOther})` : ''}</span></div>
                          <div class="col"><span class="label">Terapia Anterior:</span> <span class="value">${fmt(a.previousTherapy)} ${a.previousTherapy === 'sim' ? `(${a.previousTherapyDuration})` : ''}</span></div>
                      </div>
                      <div class="row"><div class="col full"><span class="label">Motivo Principal:</span> <span class="value">${fmt(a.mainReason)}</span></div></div>
                      <div class="row"><div class="col full"><span class="label">Início:</span> <span class="value">${fmt(a.situationStart)}</span></div></div>
                      <div class="row"><div class="col full"><span class="label">Evento Desencadeador:</span> <span class="value">${fmt(a.triggeringEvent)}</span></div></div>
                      <div class="row"><div class="col full"><span class="label">Expectativas:</span> <span class="value">${fmt(a.expectationsAnalysis)}</span></div></div>
                  </div>
              `;

              // 7. Observações
              if(a.generalObservations) {
                  bodyContent += `
                      <div class="section">
                          <div class="section-title">7. Observações Gerais</div>
                          <p class="value">${a.generalObservations}</p>
                      </div>
                  `;
              }

              // Prontuário / Sessões
              if (patientNotes.length > 0) {
                  bodyContent += `<div class="section"><div class="section-title">Histórico de Sessões</div>`;
                  patientNotes.forEach(n => {
                      let evalTag = '';
                      if(n.evaluation) {
                          const evalColor = n.evaluation === 'pessimo' ? 'eval-pessimo' : n.evaluation === 'ruim' ? 'eval-ruim' : n.evaluation === 'bom' ? 'eval-bom' : 'eval-otima';
                          const evalLabel = n.evaluation.charAt(0).toUpperCase() + n.evaluation.slice(1);
                          evalTag = `<span class="evaluation-tag ${evalColor}">${evalLabel}</span>`;
                      }
                      bodyContent += `
                          <div class="session-note">
                              <div class="session-header">
                                  <span>Data: ${new Date(n.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</span>
                                  ${evalTag}
                              </div>
                              <div class="session-content">${n.content}</div>
                          </div>
                      `;
                  })
                  bodyContent += `</div>`;
              }
          }
          
          bodyContent += `
              <div class="footer">
                  Documento gerado em ${new Date().toLocaleString('pt-BR')} • Documento Confidencial
              </div>
          </div>`;

          printWindow.document.write(`<html><head><title>${docTitle}</title><style>${styles}</style></head><body>${bodyContent}</body></html>`);
          printWindow.document.close();
          printWindow.focus();
          setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
      }
    }, 100);
  };

  const getEvaluationLabel = (evaluation: string) => {
      switch(evaluation) {
          case 'pessimo': return { label: 'Péssimo', color: 'bg-rose-100 text-rose-800 border-rose-200', value: 1, chartColor: '#e11d48' };
          case 'ruim': return { label: 'Ruim', color: 'bg-amber-100 text-amber-800 border-amber-200', value: 2, chartColor: '#f59e0b' };
          case 'bom': return { label: 'Bom', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', value: 3, chartColor: '#10b981' };
          case 'otimo': return { label: 'Ótimo', color: 'bg-blue-100 text-blue-800 border-blue-200', value: 4, chartColor: '#3b82f6' };
          default: return { label: '', color: '', value: 0, chartColor: '#cbd5e1' };
      }
  };

  // Calculate Evolution Data
  const evolutionData = useMemo(() => {
      // Sort notes by date ascending (oldest first) for the chart
      const sortedNotes = [...patientNotes].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      const points = sortedNotes
        .filter(n => n.evaluation)
        .map(n => {
            const evalData = getEvaluationLabel(n.evaluation!);
            return {
                id: n.id,
                date: n.date,
                dateLabel: new Date(n.date).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'}),
                value: evalData.value,
                label: evalData.label,
                color: evalData.chartColor,
                content: n.content
            };
        });
      return points;
  }, [patientNotes]);

  const moduleActions = (
    <div className="flex items-center gap-4">
        {isTimerActive ? (
            <div className="flex items-center gap-3 bg-slate-900 border-l-4 border-emerald-500 shadow-lg px-5 py-3 rounded animate-fade-in mr-4">
                <div className="flex relative">
                    <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </div>
                <div className="flex flex-col items-start">
                    <span className="text-[10px] font-bold uppercase text-emerald-400 leading-none tracking-wider mb-1">Em Atendimento</span>
                    <span className="font-mono text-xl font-bold text-white leading-none tracking-widest">{formatTimer(timer)}</span>
                </div>
            </div>
        ) : (
            showStartButton && todayAppointment && todayAppointment.status !== 'completed' && !isPaymentModalOpen && !isStartModalOpen && (
              <button
                  onClick={handleStartConsultation}
                  className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-full hover:bg-emerald-700 transition-colors font-semibold shadow-sm mr-2"
                  aria-label="Iniciar Consulta"
              >
                  <PlayIcon className="w-4 h-4" />
                  Iniciar Consulta
              </button>
            )
        )}
        
        <button
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-full hover:bg-slate-50 transition-colors text-sm font-medium shadow-sm"
        >
            <PrintIcon />
            Imprimir
        </button>
    </div>
  );

  // Helper to safely format text for display
  const displayFmt = (val: string | number | undefined | null) => {
      if (val === undefined || val === null || val === '') return '-';
      return String(val).charAt(0).toUpperCase() + String(val).slice(1);
  };

  if (!patient) {
    return (
      <ModuleContainer title="Prontuário Eletrônico" onBack={() => onNavigate('patients')}>
        <div className="text-center p-8">
          <p className="text-slate-500">Paciente não encontrado ou não selecionado.</p>
          <button onClick={() => onNavigate('patients')} className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-full hover:bg-indigo-700">
            Voltar para Pacientes
          </button>
        </div>
      </ModuleContainer>
    );
  }

  return (
    <ModuleContainer title={`PEP de ${patient.name}`} onBack={() => onNavigate('patients')} actions={moduleActions}>
      {isStartModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-[90] animate-fade-in">
            <div className="bg-white p-8 rounded-lg shadow-xl text-center animate-slide-up transform max-w-sm mx-4">
                <div className="mb-4 flex justify-center text-emerald-500">
                     <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-slate-800">Consulta Iniciada</h2>
                <p className="text-slate-600 mt-2">O cronômetro foi iniciado.</p>
            </div>
          </div>
      )}

      {isEvaluationModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-[100] animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4 text-center animate-slide-up" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Avaliação da Sessão</h3>
                <p className="text-slate-600 mb-6">Como você avalia a evolução do paciente nesta sessão?</p>
                
                <div className="grid grid-cols-2 gap-3 mb-8">
                    <button 
                        onClick={() => setSelectedEvaluation('pessimo')}
                        className={`p-4 rounded-3xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${selectedEvaluation === 'pessimo' ? 'border-rose-500 bg-rose-50' : 'border-slate-200 hover:border-rose-300 hover:bg-rose-50/50'}`}
                    >
                        <span className="text-2xl">😞</span>
                        <span className="font-semibold text-sm text-slate-700">Péssimo</span>
                    </button>
                    <button 
                        onClick={() => setSelectedEvaluation('ruim')}
                        className={`p-4 rounded-3xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${selectedEvaluation === 'ruim' ? 'border-amber-500 bg-amber-50' : 'border-slate-200 hover:border-amber-300 hover:bg-amber-50/50'}`}
                    >
                        <span className="text-2xl">😐</span>
                        <span className="font-semibold text-sm text-slate-700">Ruim</span>
                    </button>
                    <button 
                        onClick={() => setSelectedEvaluation('bom')}
                        className={`p-4 rounded-3xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${selectedEvaluation === 'bom' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50'}`}
                    >
                        <span className="text-2xl">🙂</span>
                        <span className="font-semibold text-sm text-slate-700">Bom</span>
                    </button>
                    <button 
                        onClick={() => setSelectedEvaluation('otimo')}
                        className={`p-4 rounded-3xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${selectedEvaluation === 'otimo' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50/50'}`}
                    >
                        <span className="text-2xl">😄</span>
                        <span className="font-semibold text-sm text-slate-700">Ótimo</span>
                    </button>
                </div>

                <div className="flex justify-center gap-3">
                    <button 
                        onClick={() => setIsEvaluationModalOpen(false)}
                        className="px-6 py-2 rounded-full bg-slate-200 text-slate-800 hover:bg-slate-300 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleConfirmSaveNote}
                        className={`px-6 py-2 rounded-full text-white transition-colors shadow-sm ${selectedEvaluation ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-indigo-300 cursor-not-allowed'}`}
                        disabled={!selectedEvaluation}
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Edit Note Modal */}
      {editingNote && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-[100] animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full mx-4 animate-slide-up" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-slate-800">Editar Anotação</h3>
                    <button onClick={handleCloseEditNote} className="p-1 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800">
                        <CloseIcon />
                    </button>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Conteúdo da Anotação</label>
                        <textarea 
                            value={editContent} 
                            onChange={(e) => setEditContent(e.target.value)} 
                            className="w-full p-2.5 border rounded-md h-48 bg-white border-slate-300 focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
                            placeholder="Edite o conteúdo aqui..."
                        ></textarea>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Avaliação da Sessão</label>
                        <div className="grid grid-cols-4 gap-2">
                            {['pessimo', 'ruim', 'bom', 'otimo'].map((evalKey) => {
                                const isSelected = editEvaluation === evalKey;
                                let label = '';
                                let icon = '';
                                switch(evalKey) {
                                    case 'pessimo': label = 'Péssimo'; icon = '😞'; break;
                                    case 'ruim': label = 'Ruim'; icon = '😐'; break;
                                    case 'bom': label = 'Bom'; icon = '🙂'; break;
                                    case 'otimo': label = 'Ótimo'; icon = '😄'; break;
                                }
                                
                                let btnClass = "p-2 rounded-2xl border transition-all flex flex-col items-center justify-center gap-1 text-xs font-medium ";
                                if (isSelected) {
                                    if(evalKey === 'pessimo') btnClass += "border-rose-500 bg-rose-50 text-rose-800";
                                    if(evalKey === 'ruim') btnClass += "border-amber-500 bg-amber-50 text-amber-800";
                                    if(evalKey === 'bom') btnClass += "border-emerald-500 bg-emerald-50 text-emerald-800";
                                    if(evalKey === 'otimo') btnClass += "border-blue-500 bg-blue-50 text-blue-800";
                                } else {
                                    btnClass += "border-slate-200 hover:bg-slate-50 text-slate-600";
                                }

                                return (
                                    <button 
                                        key={evalKey}
                                        onClick={() => setEditEvaluation(evalKey as any)}
                                        className={btnClass}
                                    >
                                        <span className="text-lg">{icon}</span>
                                        {label}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                    <button 
                        onClick={handleCloseEditNote}
                        className="px-4 py-2 rounded-full bg-slate-200 text-slate-800 hover:bg-slate-300 transition-colors font-medium"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleSaveEditedNote}
                        className="px-6 py-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-colors font-medium shadow-sm"
                    >
                        Salvar Alterações
                    </button>
                </div>
            </div>
        </div>
      )}
      
      {isEndConsultationModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-[90] animate-fade-in">
            <div className="bg-white p-8 rounded-lg shadow-xl text-center animate-slide-up transform max-w-sm mx-4">
                <div className="mb-4 flex justify-center text-rose-500">
                     <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="6" y="4" width="4" height="16"></rect>
                        <rect x="14" y="4" width="4" height="16"></rect>
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-slate-800">Atendimento Encerrado</h2>
                <p className="text-slate-600 mt-2 mb-4">Preencha o prontuário posteriormente.</p>
                <button onClick={confirmEndConsultation} className="px-6 py-2 bg-rose-600 text-white rounded-full hover:bg-rose-700 transition-colors">
                    OK
                </button>
            </div>
          </div>
      )}

      {isReceiptModalOpen && receiptData && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-[80] animate-fade-in" onClick={(e) => e.stopPropagation()}>
             <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-4 text-center" onClick={(e) => e.stopPropagation()}>
                <div className="mb-4 flex justify-center text-emerald-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Pagamento Confirmado!</h3>
                <p className="text-slate-600 mb-6">Deseja emitir o recibo para <strong>{receiptData.name}</strong>?</p>

                <div className="flex justify-center gap-3">
                    <button onClick={() => setIsReceiptModalOpen(false)} className="px-4 py-2 rounded-full bg-slate-200 text-slate-800 hover:bg-slate-300 transition-colors">
                        Não, obrigado
                    </button>
                    <button onClick={handleGenerateReceipt} className="px-4 py-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-colors flex items-center gap-2">
                        <PrintIcon /> Sim, emitir recibo
                    </button>
                </div>
             </div>
          </div>
      )}

      {isPaymentModalOpen && todayAppointment && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-[70] animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
               <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-slate-800">Registrar Pagamento</h3>
                  <button onClick={() => setIsPaymentModalOpen(false)} className="p-1 rounded-full hover:bg-slate-100"><CloseIcon/></button>
               </div>

               <div className="space-y-4">
                  <p className="text-sm text-slate-600">Confirme o valor e o método de pagamento para finalizar a consulta.</p>

                  <div className="bg-slate-50 p-3 rounded-md border border-slate-200 text-center">
                      <p className="text-xs text-slate-500 uppercase font-semibold">Valor a Receber</p>
                      <p className="text-2xl font-bold text-emerald-600">{todayAppointment.price.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</p>
                  </div>

                  <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Forma de Pagamento</label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full p-2 border rounded-md bg-white border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                          <option value="Pix">Pix</option>
                          <option value="Cartão de Crédito">Cartão de Crédito</option>
                          <option value="Cartão de Débito">Cartão de Débito</option>
                          <option value="Dinheiro">Dinheiro</option>
                      </select>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                      <button
                        onClick={() => setIsPaymentModalOpen(false)}
                        className="px-4 py-2 rounded-full bg-slate-200 text-slate-800 hover:bg-slate-300 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleConfirmPaymentAndFinalize}
                        className="px-4 py-2 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm"
                      >
                        Confirmar Pagamento
                      </button>
                  </div>
               </div>
            </div>
          </div>
      )}

      {isExportModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-[70] animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
               <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-slate-800">Exportar Prontuário</h3>
                  <button onClick={() => setIsExportModalOpen(false)} className="p-1 rounded-full hover:bg-slate-100"><CloseIcon/></button>
               </div>

               <div className="space-y-4">
                  <p className="text-sm text-slate-600 mb-4">Selecione o tipo de documento que deseja gerar:</p>

                  <button
                    onClick={() => handleExportPDF('full')}
                    className="w-full bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-semibold py-3 px-4 rounded-3xl transition-colors text-left flex items-center justify-between group"
                  >
                    <span>Prontuário Completo</span>
                    <span className="text-xs font-normal bg-white px-2 py-1 rounded-full border border-indigo-200 group-hover:border-indigo-300">Preenchido</span>
                  </button>

                  <button
                    onClick={() => handleExportPDF('blank')}
                    className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold py-3 px-4 rounded-3xl transition-colors text-left flex items-center justify-between group"
                  >
                    <span>Ficha Clínica em Branco</span>
                    <span className="text-xs font-normal bg-white px-2 py-1 rounded-full border border-slate-200 group-hover:border-slate-300">Para Impressão</span>
                  </button>
               </div>
            </div>
          </div>
      )}

      <div className="bg-slate-50 p-4 rounded-lg mb-6 border grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2 text-sm text-slate-700">
          <p><span className="font-semibold">E-mail:</span> {patient.email}</p>
          <p><span className="font-semibold">Telefone:</span> {patient.phone || 'N/A'}</p>
          <p><span className="font-semibold">Nascimento:</span> {new Date(patient.dateOfBirth).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</p>
          <p><span className="font-semibold">Profissão:</span> {patient.occupation}</p>
          <p className="sm:col-span-2 lg:col-span-3"><span className="font-semibold">Endereço:</span> {patient.address}</p>
      </div>

      <div className="flex border-b border-slate-200 mb-6 overflow-x-auto">
        <button
          className={`py-2 px-4 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === 'anamnese' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          onClick={() => setActiveTab('anamnese')}
        >
          Anamnese
        </button>
        <button
          className={`py-2 px-4 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === 'prontuario' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          onClick={() => setActiveTab('prontuario')}
        >
          Prontuário
        </button>
        <button
          className={`py-2 px-4 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === 'evolucao' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          onClick={() => setActiveTab('evolucao')}
        >
          Evolução
        </button>
      </div>

      <div className="space-y-6">
        {activeTab === 'anamnese' && (
          <div className="bg-white p-6 rounded-lg shadow-sm border animate-fade-in">
            {isAnamnesisFormVisible ? (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 border-b border-indigo-100 pb-4">
                    <div>
                        <h3 className="text-lg font-semibold text-indigo-800">FICHA DE ANAMNESE – PSICANÁLISE</h3>
                        <div className="bg-blue-50 px-2 py-1 rounded text-xs text-blue-800 mt-1 inline-block">
                            {patient.anamnesis ? "Editando ficha existente" : "Nova ficha clínica"}
                        </div>
                    </div>
                    {isTimerActive && (
                        <button
                          onClick={handleEndConsultation}
                          className="bg-rose-600 text-white px-5 py-2.5 rounded-full hover:bg-rose-700 font-semibold shadow-sm flex items-center gap-2 text-sm transition-all"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            </svg>
                            Encerrar Atendimento
                        </button>
                    )}
                </div>
                
                {/* 1. Dados Pessoais */}
                <div>
                   <h4 className="font-bold text-indigo-700 border-b border-indigo-100 pb-2 mb-4">1. Dados Pessoais</h4>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                         <label className="block text-sm font-medium text-slate-600 mb-1">Estado Civil</label>
                         <div className="flex flex-wrap gap-3 text-sm">
                             {['solteiro(a)', 'casado(a)', 'divorciado(a)', 'viuvo(a)'].map(status => (
                                 <label key={status} className="flex items-center gap-1 cursor-pointer">
                                     <input type="radio" name="civilStatus" value={status} checked={anamnesisForm.civilStatus === status} onChange={handleAnamnesisFormChange} className="text-indigo-600" />
                                     <span className="capitalize">{status.replace('(a)', '')}</span>
                                 </label>
                             ))}
                         </div>
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-600 mb-1">Possui Filhos?</label>
                          <div className="flex items-center gap-3 text-sm">
                               <label className="flex items-center gap-1"><input type="radio" name="hasChildren" value="sim" checked={anamnesisForm.hasChildren === 'sim'} onChange={handleAnamnesisFormChange} /> Sim</label>
                               <label className="flex items-center gap-1"><input type="radio" name="hasChildren" value="nao" checked={anamnesisForm.hasChildren === 'nao'} onChange={handleAnamnesisFormChange} /> Não</label>
                               {anamnesisForm.hasChildren === 'sim' && (
                                   <input type="number" name="numberOfChildren" value={anamnesisForm.numberOfChildren} onChange={handleAnamnesisFormChange} placeholder="Quantos?" className="w-20 p-1 border rounded text-sm" />
                               )}
                          </div>
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-600 mb-1">Sofreu Algum Aborto?</label>
                          <div className="flex items-center gap-3 text-sm">
                               <label className="flex items-center gap-1"><input type="radio" name="hadAbortion" value="sim" checked={anamnesisForm.hadAbortion === 'sim'} onChange={handleAnamnesisFormChange} /> Sim</label>
                               <label className="flex items-center gap-1"><input type="radio" name="hadAbortion" value="nao" checked={anamnesisForm.hadAbortion === 'nao'} onChange={handleAnamnesisFormChange} /> Não</label>
                          </div>
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-600 mb-1">Grau de Escolaridade</label>
                          <select name="educationLevel" value={anamnesisForm.educationLevel} onChange={handleAnamnesisFormChange} className="w-full p-2 border rounded-md text-sm bg-white">
                              <option value="">Selecione...</option>
                              <option value="fundamental">Ensino Fundamental</option>
                              <option value="medio">Ensino Médio</option>
                              <option value="graduacao">Graduação</option>
                              <option value="graduacao_incompleta">Graduação Incompleta</option>
                              <option value="pos_graduacao">Pós-graduação</option>
                          </select>
                      </div>
                      <div className="sm:col-span-2">
                          <label className="block text-sm font-medium text-slate-600 mb-1">Profissão</label>
                          <input type="text" name="occupation" value={anamnesisForm.occupation} onChange={handleAnamnesisFormChange} className="w-full p-2 border rounded-md text-sm" />
                      </div>
                   </div>
                </div>

                {/* 2. Histórico Familiar */}
                <div className="mt-6">
                   <h4 className="font-bold text-indigo-700 border-b border-indigo-100 pb-2 mb-4">2. Histórico Familiar</h4>
                   <div className="grid grid-cols-1 gap-4">
                       <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center bg-slate-50 p-3 rounded">
                            <div className="sm:col-span-2">
                                <label className="block text-xs font-semibold text-slate-500 uppercase">Nome da Mãe</label>
                                <input type="text" name="mothersName" value={anamnesisForm.mothersName} onChange={handleAnamnesisFormChange} className="w-full p-1.5 border rounded text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase">Relação Atual</label>
                                <select name="mothersRelationship" value={anamnesisForm.mothersRelationship} onChange={handleAnamnesisFormChange} className="w-full p-1.5 border rounded text-sm bg-white">
                                    <option value="">Selecione...</option>
                                    <option value="pessima">Péssima</option>
                                    <option value="ruim">Ruim</option>
                                    <option value="boa">Boa</option>
                                    <option value="otima">Ótima</option>
                                </select>
                            </div>
                       </div>
                       <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center bg-slate-50 p-3 rounded">
                            <div className="sm:col-span-2">
                                <label className="block text-xs font-semibold text-slate-500 uppercase">Nome do Pai</label>
                                <input type="text" name="fathersName" value={anamnesisForm.fathersName} onChange={handleAnamnesisFormChange} className="w-full p-1.5 border rounded text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase">Relação Atual</label>
                                <select name="fathersRelationship" value={anamnesisForm.fathersRelationship} onChange={handleAnamnesisFormChange} className="w-full p-1.5 border rounded text-sm bg-white">
                                    <option value="">Selecione...</option>
                                    <option value="pessima">Péssima</option>
                                    <option value="ruim">Ruim</option>
                                    <option value="boa">Boa</option>
                                    <option value="otima">Ótima</option>
                                </select>
                            </div>
                       </div>
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Possui Irmãos?</label>
                                <div className="flex items-center gap-3 text-sm">
                                    <label className="flex items-center gap-1"><input type="radio" name="hasSiblings" value="sim" checked={anamnesisForm.hasSiblings === 'sim'} onChange={handleAnamnesisFormChange} /> Sim</label>
                                    <label className="flex items-center gap-1"><input type="radio" name="hasSiblings" value="nao" checked={anamnesisForm.hasSiblings === 'nao'} onChange={handleAnamnesisFormChange} /> Não</label>
                                    {anamnesisForm.hasSiblings === 'sim' && (
                                        <input type="number" name="numberOfSiblings" value={anamnesisForm.numberOfSiblings} onChange={handleAnamnesisFormChange} placeholder="Quantos?" className="w-20 p-1 border rounded text-sm" />
                                    )}
                                </div>
                           </div>
                           {anamnesisForm.hasSiblings === 'sim' && (
                               <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">Relação com Irmãos</label>
                                    <select name="siblingsRelationship" value={anamnesisForm.siblingsRelationship} onChange={handleAnamnesisFormChange} className="w-full p-2 border rounded-md text-sm bg-white">
                                        <option value="">Selecione...</option>
                                        <option value="pessima">Péssima</option>
                                        <option value="ruim">Ruim</option>
                                        <option value="boa">Boa</option>
                                        <option value="otima">Ótima</option>
                                    </select>
                               </div>
                           )}
                       </div>
                       <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Como Descreve Sua Infância?</label>
                            <div className="flex flex-wrap gap-4 text-sm">
                                {['pessima', 'ruim', 'boa', 'otima'].map(opt => (
                                    <label key={opt} className="flex items-center gap-1 cursor-pointer">
                                        <input type="radio" name="childhoodDescription" value={opt} checked={anamnesisForm.childhoodDescription === opt} onChange={handleAnamnesisFormChange} />
                                        <span className="capitalize">{opt}</span>
                                    </label>
                                ))}
                            </div>
                       </div>
                   </div>
                </div>

                {/* 3. Saúde Geral */}
                <div className="mt-6">
                   <h4 className="font-bold text-indigo-700 border-b border-indigo-100 pb-2 mb-4">3. Saúde Geral</h4>
                   <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Medicação Contínua?</label>
                            <div className="flex gap-4 items-center mb-2 text-sm">
                                <label className="flex items-center gap-1"><input type="radio" name="continuousMedication" value="sim" checked={anamnesisForm.continuousMedication === 'sim'} onChange={handleAnamnesisFormChange} /> Sim</label>
                                <label className="flex items-center gap-1"><input type="radio" name="continuousMedication" value="nao" checked={anamnesisForm.continuousMedication === 'nao'} onChange={handleAnamnesisFormChange} /> Não</label>
                            </div>
                            {anamnesisForm.continuousMedication === 'sim' && (
                                <input type="text" name="medicationsDetails" value={anamnesisForm.medicationsDetails} onChange={handleAnamnesisFormChange} placeholder="Quais medicamentos?" className="w-full p-2 border rounded-md text-sm" />
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Diagnóstico Médico Relevante?</label>
                            <input type="text" name="relevantMedicalDiagnosis" value={anamnesisForm.relevantMedicalDiagnosis} onChange={handleAnamnesisFormChange} className="w-full p-2 border rounded-md text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Uso de Substâncias</label>
                            <div className="flex flex-wrap gap-3 text-sm">
                                <label className="flex items-center gap-1"><input type="checkbox" name="substanceUse_marijuana" checked={anamnesisForm.substanceUse_marijuana} onChange={handleAnamnesisFormChange} /> Maconha</label>
                                <label className="flex items-center gap-1"><input type="checkbox" name="substanceUse_cocaine" checked={anamnesisForm.substanceUse_cocaine} onChange={handleAnamnesisFormChange} /> Cocaína</label>
                                <label className="flex items-center gap-1"><input type="checkbox" name="substanceUse_alcohol" checked={anamnesisForm.substanceUse_alcohol} onChange={handleAnamnesisFormChange} /> Álcool</label>
                                <label className="flex items-center gap-1"><input type="checkbox" name="substanceUse_cigarette" checked={anamnesisForm.substanceUse_cigarette} onChange={handleAnamnesisFormChange} /> Cigarro</label>
                                <label className="flex items-center gap-1"><input type="checkbox" name="substanceUse_none" checked={anamnesisForm.substanceUse_none} onChange={handleAnamnesisFormChange} /> Nenhuma</label>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Qualidade do Sono</label>
                            <div className="flex flex-wrap gap-4 text-sm">
                                {['pessima', 'ruim', 'boa', 'otima'].map(opt => (
                                    <label key={opt} className="flex items-center gap-1 cursor-pointer">
                                        <input type="radio" name="sleepQuality" value={opt} checked={anamnesisForm.sleepQuality === opt} onChange={handleAnamnesisFormChange} />
                                        <span className="capitalize">{opt}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                   </div>
                </div>

                {/* 4. Aspectos Psicológicos e Emocionais */}
                <div className="mt-6">
                   <h4 className="font-bold text-indigo-700 border-b border-indigo-100 pb-2 mb-4">4. Aspectos Psicológicos e Emocionais</h4>
                   <div className="grid grid-cols-1 gap-4">
                       <div>
                           <label className="block text-sm font-medium text-slate-600 mb-1">Principais Sintomas</label>
                           <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                               <label className="flex items-center gap-1"><input type="checkbox" name="mainSymptoms_sadness" checked={anamnesisForm.mainSymptoms_sadness} onChange={handleAnamnesisFormChange} /> Tristeza</label>
                               <label className="flex items-center gap-1"><input type="checkbox" name="mainSymptoms_depression" checked={anamnesisForm.mainSymptoms_depression} onChange={handleAnamnesisFormChange} /> Depressão</label>
                               <label className="flex items-center gap-1"><input type="checkbox" name="mainSymptoms_anxiety" checked={anamnesisForm.mainSymptoms_anxiety} onChange={handleAnamnesisFormChange} /> Ansiedade</label>
                               <label className="flex items-center gap-1"><input type="checkbox" name="mainSymptoms_nervousness" checked={anamnesisForm.mainSymptoms_nervousness} onChange={handleAnamnesisFormChange} /> Nervosismo</label>
                               <label className="flex items-center gap-1"><input type="checkbox" name="mainSymptoms_phobias" checked={anamnesisForm.mainSymptoms_phobias} onChange={handleAnamnesisFormChange} /> Fobias</label>
                           </div>
                           <input type="text" name="mainSymptoms_otherFear" value={anamnesisForm.mainSymptoms_otherFear} onChange={handleAnamnesisFormChange} placeholder="Outro medo/fobia?" className="w-full p-2 border rounded-md text-sm mt-2" />
                       </div>
                       
                       <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-3 rounded">
                           {['Ansiedade', 'Irritabilidade', 'Tristeza'].map(item => {
                               const key = item === 'Ansiedade' ? 'anxietyLevel' : item === 'Irritabilidade' ? 'irritabilityLevel' : 'sadnessLevel';
                               return (
                                   <div key={item}>
                                       <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Nível de {item}</label>
                                       <select name={key} value={anamnesisForm[key as keyof Anamnesis] as string} onChange={handleAnamnesisFormChange} className="w-full p-1.5 border rounded text-sm bg-white">
                                            <option value="">Selecione...</option>
                                            <option value="baixo">Baixo</option>
                                            <option value="normal">Normal</option>
                                            <option value="alto">Alto</option>
                                       </select>
                                   </div>
                               )
                           })}
                       </div>

                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Sentimento de Culpa?</label>
                                <div className="flex gap-4 text-sm">
                                    <label><input type="radio" name="carriesGuilt" value="sim" checked={anamnesisForm.carriesGuilt === 'sim'} onChange={handleAnamnesisFormChange} /> Sim</label>
                                    <label><input type="radio" name="carriesGuilt" value="nao" checked={anamnesisForm.carriesGuilt === 'nao'} onChange={handleAnamnesisFormChange} /> Não</label>
                                </div>
                           </div>
                           <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Sentimento de Injustiça?</label>
                                <div className="flex gap-4 text-sm">
                                    <label><input type="radio" name="carriesInjustice" value="sim" checked={anamnesisForm.carriesInjustice === 'sim'} onChange={handleAnamnesisFormChange} /> Sim</label>
                                    <label><input type="radio" name="carriesInjustice" value="nao" checked={anamnesisForm.carriesInjustice === 'nao'} onChange={handleAnamnesisFormChange} /> Não</label>
                                </div>
                           </div>
                       </div>
                       
                       <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Pensamentos de Morte ou Suicídio?</label>
                            <div className="flex gap-4 mb-2 text-sm">
                                <label><input type="radio" name="suicidalThoughts" value="sim" checked={anamnesisForm.suicidalThoughts === 'sim'} onChange={handleAnamnesisFormChange} /> Sim</label>
                                <label><input type="radio" name="suicidalThoughts" value="nao" checked={anamnesisForm.suicidalThoughts === 'nao'} onChange={handleAnamnesisFormChange} /> Não</label>
                            </div>
                            {anamnesisForm.suicidalThoughts === 'sim' && (
                                <input type="text" name="suicidalThoughtsComment" value={anamnesisForm.suicidalThoughtsComment} onChange={handleAnamnesisFormChange} placeholder="Comentário (opcional)" className="w-full p-2 border rounded-md text-sm" />
                            )}
                       </div>
                   </div>
                </div>

                {/* 5. Vida Social e Rotina */}
                <div className="mt-6">
                   <h4 className="font-bold text-indigo-700 border-b border-indigo-100 pb-2 mb-4">5. Vida Social e Rotina</h4>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       <div>
                           <label className="block text-sm font-medium text-slate-600 mb-1">Amigos Próximos?</label>
                           <div className="flex gap-4 text-sm">
                                <label><input type="radio" name="hasCloseFriends" value="sim" checked={anamnesisForm.hasCloseFriends === 'sim'} onChange={handleAnamnesisFormChange} /> Sim</label>
                                <label><input type="radio" name="hasCloseFriends" value="nao" checked={anamnesisForm.hasCloseFriends === 'nao'} onChange={handleAnamnesisFormChange} /> Não</label>
                           </div>
                       </div>
                       <div>
                           <label className="block text-sm font-medium text-slate-600 mb-1">Socialmente</label>
                           <div className="flex gap-4 text-sm">
                                <label><input type="radio" name="socialConsideration" value="expansivo(a)" checked={anamnesisForm.socialConsideration === 'expansivo(a)'} onChange={handleAnamnesisFormChange} /> Expansivo(a)</label>
                                <label><input type="radio" name="socialConsideration" value="reservado(a)" checked={anamnesisForm.socialConsideration === 'reservado(a)'} onChange={handleAnamnesisFormChange} /> Reservado(a)</label>
                           </div>
                       </div>
                       <div>
                           <label className="block text-sm font-medium text-slate-600 mb-1">Atividade Física?</label>
                           <div className="flex gap-4 text-sm">
                                <label><input type="radio" name="physicalActivity" value="sim" checked={anamnesisForm.physicalActivity === 'sim'} onChange={handleAnamnesisFormChange} /> Sim</label>
                                <label><input type="radio" name="physicalActivity" value="nao" checked={anamnesisForm.physicalActivity === 'nao'} onChange={handleAnamnesisFormChange} /> Não</label>
                           </div>
                       </div>
                       <div>
                           <label className="block text-sm font-medium text-slate-600 mb-1">Situação Financeira</label>
                           <select name="financialStatus" value={anamnesisForm.financialStatus} onChange={handleAnamnesisFormChange} className="w-full p-2 border rounded-md text-sm bg-white">
                                <option value="">Selecione...</option>
                                <option value="ruim">Ruim</option>
                                <option value="estavel">Estável</option>
                                <option value="boa">Boa</option>
                                <option value="otima">Ótima</option>
                           </select>
                       </div>
                       <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-slate-600 mb-1">Rotina Diária</label>
                            <textarea name="dailyRoutine" value={anamnesisForm.dailyRoutine} onChange={handleAnamnesisFormChange} className="w-full p-2 border rounded-md text-sm h-20"></textarea>
                       </div>
                   </div>
                </div>

                {/* 6. Buscando Ajuda */}
                <div className="mt-6">
                   <h4 className="font-bold text-indigo-700 border-b border-indigo-100 pb-2 mb-4">6. Buscando Ajuda</h4>
                   <div className="grid grid-cols-1 gap-4">
                       <div>
                           <label className="block text-sm font-medium text-slate-600 mb-1">Como Chegou até a Análise?</label>
                           <div className="flex gap-4 mb-2 text-sm">
                                <label><input type="radio" name="howFoundAnalysis" value="indicacao" checked={anamnesisForm.howFoundAnalysis === 'indicacao'} onChange={handleAnamnesisFormChange} /> Indicação</label>
                                <label><input type="radio" name="howFoundAnalysis" value="internet" checked={anamnesisForm.howFoundAnalysis === 'internet'} onChange={handleAnamnesisFormChange} /> Internet</label>
                                <label><input type="radio" name="howFoundAnalysis" value="outro" checked={anamnesisForm.howFoundAnalysis === 'outro'} onChange={handleAnamnesisFormChange} /> Outro</label>
                           </div>
                           {anamnesisForm.howFoundAnalysis === 'outro' && (
                               <input type="text" name="howFoundAnalysisOther" value={anamnesisForm.howFoundAnalysisOther} onChange={handleAnamnesisFormChange} placeholder="Especifique" className="w-full p-2 border rounded-md text-sm" />
                           )}
                       </div>
                       <div>
                           <label className="block text-sm font-medium text-slate-600 mb-1">Já Fez Terapia Antes?</label>
                           <div className="flex gap-4 mb-2 text-sm">
                                <label><input type="radio" name="previousTherapy" value="sim" checked={anamnesisForm.previousTherapy === 'sim'} onChange={handleAnamnesisFormChange} /> Sim</label>
                                <label><input type="radio" name="previousTherapy" value="nao" checked={anamnesisForm.previousTherapy === 'nao'} onChange={handleAnamnesisFormChange} /> Não</label>
                           </div>
                           {anamnesisForm.previousTherapy === 'sim' && (
                               <input type="text" name="previousTherapyDuration" value={anamnesisForm.previousTherapyDuration} onChange={handleAnamnesisFormChange} placeholder="Por quanto tempo?" className="w-full p-2 border rounded-md text-sm" />
                           )}
                       </div>
                       <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Motivo Principal</label>
                            <textarea name="mainReason" value={anamnesisForm.mainReason} onChange={handleAnamnesisFormChange} className="w-full p-2 border rounded-md text-sm h-16"></textarea>
                       </div>
                       <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Quando Começou?</label>
                            <input type="text" name="situationStart" value={anamnesisForm.situationStart} onChange={handleAnamnesisFormChange} className="w-full p-2 border rounded-md text-sm" />
                       </div>
                       <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Evento Desencadeador</label>
                            <textarea name="triggeringEvent" value={anamnesisForm.triggeringEvent} onChange={handleAnamnesisFormChange} className="w-full p-2 border rounded-md text-sm h-16"></textarea>
                       </div>
                       <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Expectativas</label>
                            <textarea name="expectationsAnalysis" value={anamnesisForm.expectationsAnalysis} onChange={handleAnamnesisFormChange} className="w-full p-2 border rounded-md text-sm h-16"></textarea>
                       </div>
                   </div>
                </div>

                {/* 7. Observações Gerais */}
                <div className="mt-6">
                    <h4 className="font-bold text-indigo-700 border-b border-indigo-100 pb-2 mb-4">7. Observações Gerais</h4>
                    <div>
                        <label htmlFor="generalObservations" className="block text-sm font-medium text-slate-600 mb-1">Informações Adicionais:</label>
                        <textarea id="generalObservations" name="generalObservations" value={anamnesisForm.generalObservations} onChange={handleAnamnesisFormChange} className="w-full p-2 border rounded-md h-32 bg-white border-slate-300"></textarea>
                    </div>
                </div>

                <div className="text-right mt-8 flex justify-end gap-3">
                   {patient.anamnesis && (
                       <button onClick={() => setIsAnamnesisFormVisible(false)} className="px-4 py-2 rounded-full bg-slate-200 text-slate-800 hover:bg-slate-300">Cancelar</button>
                   )}
                  <button onClick={handleSaveAnamnesis} className="bg-emerald-600 text-white px-4 py-2 rounded-full hover:bg-emerald-700">Salvar Anamnese</button>
                </div>
              </div>
            ) : (
               <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-6">
                      <div>
                          <h3 className="text-lg font-semibold text-slate-700">FICHA DE ANAMNESE – PSICANÁLISE</h3>
                          <p className="text-slate-500 text-sm mt-1">Ficha de anamnese registrada.</p>
                      </div>
                      <div className="flex items-center gap-3">
                          {isTimerActive && (
                            <button
                              onClick={handleEndConsultation}
                              className="bg-rose-600 text-white px-5 py-2.5 rounded-full hover:bg-rose-700 font-semibold shadow-sm flex items-center gap-2 text-sm transition-all"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                </svg>
                                Encerrar Atendimento
                            </button>
                          )}
                          <button 
                            onClick={() => setIsAnamnesisFormVisible(true)} 
                            className="bg-indigo-600 text-white px-5 py-2.5 rounded-full hover:bg-indigo-700 font-semibold shadow-sm text-sm transition-all flex items-center gap-2"
                          >
                            <EditIcon className="w-4 h-4" />
                            Editar / Visualizar Completo
                          </button>
                      </div>
                  </div>
                  
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-6 text-sm text-slate-800">
                      
                      {/* Section 1 */}
                      <div>
                          <h5 className="font-bold text-indigo-800 border-b border-indigo-100 pb-1 mb-2">1. Dados Pessoais</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               <p><span className="font-semibold text-slate-600">Estado Civil:</span> {displayFmt(anamnesisForm.civilStatus).replace('(a)', '')}</p>
                               <p><span className="font-semibold text-slate-600">Filhos:</span> {displayFmt(anamnesisForm.hasChildren)} {anamnesisForm.hasChildren === 'sim' ? `(${anamnesisForm.numberOfChildren})` : ''}</p>
                               <p><span className="font-semibold text-slate-600">Aborto:</span> {displayFmt(anamnesisForm.hadAbortion)}</p>
                               <p><span className="font-semibold text-slate-600">Escolaridade:</span> {displayFmt(anamnesisForm.educationLevel).replace('_', ' ')}</p>
                               <p className="md:col-span-2"><span className="font-semibold text-slate-600">Profissão:</span> {anamnesisForm.occupation || '-'}</p>
                          </div>
                      </div>

                      {/* Section 2 */}
                      <div>
                          <h5 className="font-bold text-indigo-800 border-b border-indigo-100 pb-1 mb-2">2. Histórico Familiar</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               <p><span className="font-semibold text-slate-600">Mãe:</span> {anamnesisForm.mothersName || '-'} ({displayFmt(anamnesisForm.mothersRelationship)})</p>
                               <p><span className="font-semibold text-slate-600">Pai:</span> {anamnesisForm.fathersName || '-'} ({displayFmt(anamnesisForm.fathersRelationship)})</p>
                               <p><span className="font-semibold text-slate-600">Irmãos:</span> {displayFmt(anamnesisForm.hasSiblings)} {anamnesisForm.hasSiblings === 'sim' ? `(${anamnesisForm.numberOfSiblings})` : ''}</p>
                               <p><span className="font-semibold text-slate-600">Rel. Irmãos:</span> {displayFmt(anamnesisForm.siblingsRelationship)}</p>
                               <p className="md:col-span-2"><span className="font-semibold text-slate-600">Infância:</span> {displayFmt(anamnesisForm.childhoodDescription)}</p>
                          </div>
                      </div>

                      {/* Section 3 */}
                      <div>
                          <h5 className="font-bold text-indigo-800 border-b border-indigo-100 pb-1 mb-2">3. Saúde Geral</h5>
                          <div className="grid grid-cols-1 gap-2">
                               <p><span className="font-semibold text-slate-600">Medicação Contínua:</span> {anamnesisForm.continuousMedication === 'sim' ? anamnesisForm.medicationsDetails : 'Não'}</p>
                               <p><span className="font-semibold text-slate-600">Diagnóstico:</span> {anamnesisForm.relevantMedicalDiagnosis || '-'}</p>
                               <p><span className="font-semibold text-slate-600">Substâncias:</span> {[
                                  anamnesisForm.substanceUse_marijuana && 'Maconha',
                                  anamnesisForm.substanceUse_cocaine && 'Cocaína',
                                  anamnesisForm.substanceUse_alcohol && 'Álcool',
                                  anamnesisForm.substanceUse_cigarette && 'Cigarro',
                                  anamnesisForm.substanceUse_none && 'Nenhuma'
                              ].filter(Boolean).join(', ') || '-'}</p>
                               <p><span className="font-semibold text-slate-600">Sono:</span> {displayFmt(anamnesisForm.sleepQuality)}</p>
                          </div>
                      </div>

                      {/* Section 4 */}
                      <div>
                          <h5 className="font-bold text-indigo-800 border-b border-indigo-100 pb-1 mb-2">4. Aspectos Psicológicos</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               <p className="md:col-span-2"><span className="font-semibold text-slate-600">Sintomas:</span> {[
                                  anamnesisForm.mainSymptoms_sadness && 'Tristeza',
                                  anamnesisForm.mainSymptoms_depression && 'Depressão',
                                  anamnesisForm.mainSymptoms_anxiety && 'Ansiedade',
                                  anamnesisForm.mainSymptoms_nervousness && 'Nervosismo',
                                  anamnesisForm.mainSymptoms_phobias && 'Fobias'
                               ].filter(Boolean).join(', ') || '-'} {anamnesisForm.mainSymptoms_otherFear ? `(${anamnesisForm.mainSymptoms_otherFear})` : ''}</p>
                               
                               <p><span className="font-semibold text-slate-600">Ansiedade:</span> {displayFmt(anamnesisForm.anxietyLevel)}</p>
                               <p><span className="font-semibold text-slate-600">Irritabilidade:</span> {displayFmt(anamnesisForm.irritabilityLevel)}</p>
                               <p><span className="font-semibold text-slate-600">Tristeza:</span> {displayFmt(anamnesisForm.sadnessLevel)}</p>
                               
                               <p><span className="font-semibold text-slate-600">Culpa:</span> {displayFmt(anamnesisForm.carriesGuilt)}</p>
                               <p><span className="font-semibold text-slate-600">Injustiça:</span> {displayFmt(anamnesisForm.carriesInjustice)}</p>
                               
                               <p className="md:col-span-2"><span className="font-semibold text-slate-600 text-rose-600">Ideias Suicidas:</span> {displayFmt(anamnesisForm.suicidalThoughts)} {anamnesisForm.suicidalThoughts === 'sim' ? `(${anamnesisForm.suicidalThoughtsComment})` : ''}</p>
                          </div>
                      </div>

                      {/* Section 5 */}
                      <div>
                          <h5 className="font-bold text-indigo-800 border-b border-indigo-100 pb-1 mb-2">5. Vida Social e Rotina</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               <p><span className="font-semibold text-slate-600">Amigos Próximos:</span> {displayFmt(anamnesisForm.hasCloseFriends)}</p>
                               <p><span className="font-semibold text-slate-600">Socialmente:</span> {displayFmt(anamnesisForm.socialConsideration)}</p>
                               <p><span className="font-semibold text-slate-600">Atividade Física:</span> {displayFmt(anamnesisForm.physicalActivity)}</p>
                               <p><span className="font-semibold text-slate-600">Financeiro:</span> {displayFmt(anamnesisForm.financialStatus)}</p>
                               <div className="md:col-span-2">
                                   <span className="font-semibold text-slate-600 block mb-1">Rotina Diária:</span>
                                   <p className="text-slate-600 bg-white p-2 rounded border border-slate-100 text-xs italic">{anamnesisForm.dailyRoutine || '-'}</p>
                               </div>
                          </div>
                      </div>

                      {/* Section 6 */}
                      <div>
                          <h5 className="font-bold text-indigo-800 border-b border-indigo-100 pb-1 mb-2">6. Buscando Ajuda</h5>
                          <div className="grid grid-cols-1 gap-2">
                               <p><span className="font-semibold text-slate-600">Origem:</span> {displayFmt(anamnesisForm.howFoundAnalysis)} {anamnesisForm.howFoundAnalysis === 'outro' ? `(${anamnesisForm.howFoundAnalysisOther})` : ''}</p>
                               <p><span className="font-semibold text-slate-600">Terapia Anterior:</span> {displayFmt(anamnesisForm.previousTherapy)} {anamnesisForm.previousTherapy === 'sim' ? `(${anamnesisForm.previousTherapyDuration})` : ''}</p>
                               
                               <div className="mt-2">
                                   <span className="font-semibold text-slate-600 block mb-1">Motivo Principal:</span>
                                   <p className="text-slate-600 bg-white p-2 rounded border border-slate-100 text-xs italic">{anamnesisForm.mainReason || '-'}</p>
                               </div>
                               
                               <p><span className="font-semibold text-slate-600">Início:</span> {anamnesisForm.situationStart || '-'}</p>
                               
                               <div className="mt-2">
                                   <span className="font-semibold text-slate-600 block mb-1">Evento Desencadeador:</span>
                                   <p className="text-slate-600 bg-white p-2 rounded border border-slate-100 text-xs italic">{anamnesisForm.triggeringEvent || '-'}</p>
                               </div>
                               
                               <div className="mt-2">
                                   <span className="font-semibold text-slate-600 block mb-1">Expectativas:</span>
                                   <p className="text-slate-600 bg-white p-2 rounded border border-slate-100 text-xs italic">{anamnesisForm.expectationsAnalysis || '-'}</p>
                               </div>
                          </div>
                      </div>

                      {/* Section 7 */}
                      {anamnesisForm.generalObservations && (
                          <div className="bg-amber-50 p-3 rounded border border-amber-100 text-sm">
                              <h5 className="font-bold text-amber-800 mb-1">7. Observações Gerais</h5>
                              <p>{anamnesisForm.generalObservations}</p>
                          </div>
                      )}
                  </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'evolucao' && (
           <div className="bg-white p-6 rounded-lg shadow-sm border animate-fade-in">
                <h3 className="text-lg font-semibold text-slate-700 mb-4">Evolução do Paciente</h3>
                
                {evolutionData.length > 0 ? (
                    <div className="space-y-6">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                             <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-center">
                                 <p className="text-xs text-slate-500 uppercase font-semibold">Sessões Avaliadas</p>
                                 <p className="text-2xl font-bold text-slate-800">{evolutionData.length}</p>
                             </div>
                             <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-center">
                                 <p className="text-xs text-slate-500 uppercase font-semibold">Última Avaliação</p>
                                 <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold mt-1 ${evolutionData[evolutionData.length - 1].value >= 3 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                     {evolutionData[evolutionData.length - 1].label}
                                 </span>
                             </div>
                        </div>

                        {/* Custom CSS Chart */}
                        <div className="relative h-64 w-full bg-white border-l border-b border-slate-200 mt-4">
                             {/* Y Axis Labels */}
                             <div className="absolute -left-12 h-full flex flex-col justify-between text-xs text-slate-400 py-2 font-medium text-right w-10">
                                 <span>Ótimo</span>
                                 <span>Bom</span>
                                 <span>Ruim</span>
                                 <span>Péssimo</span>
                             </div>

                             {/* Grid Lines */}
                             <div className="absolute inset-0 flex flex-col justify-between py-4">
                                 <div className="border-t border-slate-100 w-full h-0"></div>
                                 <div className="border-t border-slate-100 w-full h-0"></div>
                                 <div className="border-t border-slate-100 w-full h-0"></div>
                                 <div className="border-t border-slate-100 w-full h-0"></div>
                             </div>

                             {/* SVG Data Line */}
                             <svg className="absolute inset-0 h-full w-full overflow-visible" preserveAspectRatio="none">
                                 <polyline
                                    fill="none"
                                    stroke="#6366f1"
                                    strokeWidth="2"
                                    points={evolutionData.map((point, i) => {
                                        const x = (i / (evolutionData.length - 1 || 1)) * 100;
                                        // Invert Y because SVG 0 is top. Value 4 (Otimo) should be 10%, Value 1 (Pessimo) should be 90%
                                        // Formula: Y% = 100 - ((Value - 1) / 3) * 80 - 10
                                        // 4 -> 100 - (3/3)*80 - 10 = 10%
                                        // 1 -> 100 - (0/3)*80 - 10 = 90%
                                        const y = 100 - (((point.value - 1) / 3) * 80) - 10; 
                                        return `${x}% ${y}%`;
                                    }).join(', ')}
                                 />
                                 {/* Dots */}
                                 {evolutionData.map((point, i) => {
                                     const x = (i / (evolutionData.length - 1 || 1)) * 100;
                                     const y = 100 - (((point.value - 1) / 3) * 80) - 10;
                                     return (
                                         <g key={point.id} className="group">
                                            <circle
                                                cx={`${x}%`}
                                                cy={`${y}%`}
                                                r="5"
                                                fill={point.color}
                                                stroke="white"
                                                strokeWidth="2"
                                                className="cursor-pointer hover:r-7 transition-all"
                                            />
                                            {/* Tooltip via ForeignObject for simpler text handling in SVG or absolute div */}
                                         </g>
                                     );
                                 })}
                             </svg>

                             {/* Tooltips (Rendered as absolute divs for better z-index handling) */}
                             {evolutionData.map((point, i) => {
                                 const x = (i / (evolutionData.length - 1 || 1)) * 100;
                                 const y = 100 - (((point.value - 1) / 3) * 80) - 10;
                                 return (
                                     <div 
                                        key={`tooltip-${point.id}`} 
                                        className="absolute group" 
                                        style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)', width: '20px', height: '20px' }}
                                     >
                                         <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-800 text-white text-xs rounded p-2 w-48 z-50 pointer-events-none shadow-xl">
                                             <p className="font-bold">{point.dateLabel} - {point.label}</p>
                                             <p className="line-clamp-2 opacity-80 mt-1 font-normal">{point.content}</p>
                                         </div>
                                     </div>
                                 );
                             })}
                        </div>

                         {/* X Axis Labels */}
                        <div className="flex justify-between mt-2 text-xs text-slate-400 px-1">
                             {evolutionData.length > 1 ? (
                                 <>
                                    <span>{evolutionData[0].dateLabel}</span>
                                    {evolutionData.length > 2 && <span>...</span>}
                                    <span>{evolutionData[evolutionData.length - 1].dateLabel}</span>
                                 </>
                             ) : (
                                 <span className="w-full text-center">{evolutionData[0].dateLabel}</span>
                             )}
                        </div>
                        
                        <p className="text-center text-slate-400 text-xs mt-4 italic">Passe o mouse sobre os pontos para ver detalhes da sessão.</p>
                    </div>
                ) : (
                    <div className="text-center py-16 border border-dashed border-slate-200 rounded-lg bg-slate-50">
                        <p className="text-slate-500 mb-2">Nenhuma avaliação registrada ainda.</p>
                        <p className="text-sm text-slate-400">As avaliações feitas ao salvar as sessões aparecerão aqui.</p>
                    </div>
                )}
           </div>
        )}

        {activeTab === 'prontuario' && (
          <div className="animate-fade-in space-y-6">
             {todayAppointment && (
                <div className="bg-slate-50 border-l-4 border-slate-400 text-slate-700 p-4 rounded-md shadow-sm flex justify-between items-center">
                    <div>
                        <p className="font-bold">Consulta agendada para hoje às {todayAppointment.time}.</p>
                        <p className="text-sm">Salve a Anamnese e a Anotação de Sessão.</p>
                    </div>
                </div>
            )}

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-slate-700 mb-2">Nova Anotação de Sessão</h3>
              <textarea value={newNote} onChange={(e) => setNewNote(e.target.value)} className="w-full p-2 border rounded-md h-32 bg-white border-slate-300" placeholder="Digite as anotações da sessão aqui..."></textarea>
              <div className="text-right mt-2">
                  <button onClick={handleInitiateSaveNote} className="bg-indigo-600 text-white px-4 py-2 rounded-full hover:bg-indigo-700" disabled={!newNote.trim()}>Salvar Anotação</button>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-slate-700 mb-4">Histórico de Sessões</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4 w-40">Data</th>
                      <th className="py-3 px-4 w-32">Avaliação</th>
                      <th className="py-3 px-4">Resumo da Anotação</th>
                      <th className="py-3 px-4 w-32 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {patientNotes.length > 0 ? patientNotes.map(note => {
                        const evalData = note.evaluation ? getEvaluationLabel(note.evaluation) : null;
                        return (
                            <tr key={note.id} className="hover:bg-slate-50 transition-colors">
                                <td className="py-3 px-4 text-slate-600 align-top whitespace-nowrap">
                                {new Date(note.date).toLocaleDateString('pt-BR', {timeZone: 'UTC', day:'2-digit', month:'2-digit', year:'numeric'})}
                                </td>
                                <td className="py-3 px-4 align-top">
                                    {evalData ? (
                                        <span className={`px-2 py-1 rounded text-xs font-semibold border ${evalData.color}`}>
                                            {evalData.label}
                                        </span>
                                    ) : (
                                        <span className="text-slate-400 text-xs">-</span>
                                    )}
                                </td>
                                <td className="py-3 px-4 text-slate-600 align-top">
                                <p className="line-clamp-2" title={note.content}>{note.content}</p>
                                </td>
                                <td className="py-3 px-4 align-top text-center">
                                    <button 
                                        onClick={() => handleOpenEditNote(note)}
                                        className="px-3 py-1 text-xs font-medium bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 rounded-full transition-colors shadow-sm flex items-center gap-1 mx-auto"
                                    >
                                        <EditIcon className="w-3 h-3" /> Editar
                                    </button>
                                </td>
                            </tr>
                        );
                    }) : (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-500">Nenhuma anotação de sessão encontrada.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </ModuleContainer>
  );
};

export default ElectronicHealthRecord;
