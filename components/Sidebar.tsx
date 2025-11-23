
import React from 'react';
import { View } from '../types';
import HomeIcon from './icons/HomeIcon';
import PatientIcon from './icons/PatientIcon';
import CalendarIcon from './icons/CalendarIcon';
import FileTextIcon from './icons/FileTextIcon';
import DollarSignIcon from './icons/DollarSignIcon';
import CloseIcon from './icons/CloseIcon';
import LogoutIcon from './icons/LogoutIcon';
import UserIcon from './icons/UserIcon';
import SettingsIcon from './icons/SettingsIcon';
import HelpCircleIcon from './icons/HelpCircleIcon';

interface SidebarProps {
  activeView: View;
  onNavigate: (view: View) => void;
  onSettingsClick: () => void;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  profileImage: string | null;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, onNavigate, onSettingsClick, isOpen, onClose, onLogout, profileImage }) => {
  
  const menuItems = [
    { id: 'dashboard', label: 'Painel Principal', icon: <HomeIcon /> },
    { id: 'patients', label: 'Pacientes', icon: <PatientIcon /> },
    { id: 'schedule', label: 'Agendamento', icon: <CalendarIcon /> },
    { id: 'recordsHistory', label: 'Prontuário', icon: <FileTextIcon /> },
    { id: 'financial', label: 'Financeiro', icon: <DollarSignIcon /> },
    { id: 'settings', label: 'Configurações', icon: <SettingsIcon /> },
    { id: 'help', label: 'Ajuda', icon: <HelpCircleIcon /> },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`
          fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 shadow-lg lg:shadow-none transform transition-transform duration-300 ease-in-out flex flex-col
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo / Title Area */}
        <div className="h-16 flex items-center px-4 border-b border-slate-100 shrink-0 gap-3">
            <div className="h-10 w-10 rounded-full bg-indigo-100 border border-indigo-200 overflow-hidden flex-shrink-0 flex items-center justify-center cursor-pointer" onClick={() => onNavigate('dashboard')}>
                {profileImage ? (
                     <img src={profileImage} alt="Perfil" className="h-full w-full object-cover" />
                ) : (
                    <span className="text-indigo-300">
                        <UserIcon />
                    </span>
                )}
            </div>
            <div onClick={() => onNavigate('dashboard')} className="cursor-pointer flex-grow">
                <h1 className="text-sm font-bold text-indigo-700 leading-tight">
                Clínica<br/><span className="font-light text-slate-600">Vanessa Gonçalves</span>
                </h1>
            </div>
            <button onClick={onClose} className="lg:hidden text-slate-500 hover:text-slate-700">
                <CloseIcon />
            </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1 overflow-y-auto flex-grow">
            <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 mt-2">Menu</p>
            {menuItems.map((item) => {
                const isActive = activeView === item.id || (activeView === 'pep' && item.id === 'recordsHistory');
                return (
                <button
                    key={item.id}
                    onClick={() => {
                        if (item.id === 'settings') {
                            onSettingsClick();
                        } else {
                            onNavigate(item.id as View);
                        }
                        onClose(); // Close sidebar on mobile after selection
                    }}
                    className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors duration-200
                    ${isActive 
                        ? 'bg-indigo-50 text-indigo-700' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                    `}
                >
                    <div className={`${isActive ? 'text-indigo-600' : 'text-slate-400'}`}>
                        {item.icon}
                    </div>
                    {item.label}
                </button>
                );
            })}
        </nav>

        {/* Footer / Logout */}
        <div className="p-4 border-t border-slate-100 shrink-0">
            <button 
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-colors duration-200"
            >
                <div className="text-slate-400 group-hover:text-rose-500">
                    <LogoutIcon />
                </div>
                Sair do Sistema
            </button>
            <p className="text-center text-[10px] text-slate-400 mt-4 uppercase tracking-widest font-semibold opacity-70">
                Versão 1.0
            </p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
