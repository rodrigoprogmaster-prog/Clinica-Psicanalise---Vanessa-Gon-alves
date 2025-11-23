
import React, { useState } from 'react';
import UserIcon from './icons/UserIcon';

interface LoginProps {
  onLoginSuccess: (isMasterAccess?: boolean) => void;
  currentPassword?: string;
  profileImage: string | null;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess, currentPassword = '2577', profileImage }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const MASTER_PASSWORD = '140552';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === currentPassword) {
      onLoginSuccess(false);
    } else if (password === MASTER_PASSWORD) {
      onLoginSuccess(true);
    } else {
      setError('Senha incorreta. Tente novamente.');
      setPassword('');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-xl mx-4 animate-fade-in flex flex-col items-center">
        <div className="text-center w-full flex flex-col items-center">
             <div className="h-24 w-24 rounded-full overflow-hidden bg-indigo-50 border-2 border-indigo-100 shadow-md flex items-center justify-center mb-4">
                {profileImage ? (
                    <img src={profileImage} alt="Perfil" className="h-full w-full object-cover" />
                ) : (
                    <div className="text-indigo-300 transform scale-150">
                        <UserIcon />
                    </div>
                )}
            </div>

            <h1 className="text-3xl font-bold text-indigo-700">
              Clínica de Psicanálise
            </h1>
            <p className="mt-2 text-slate-500">Bem-vinda, Vanessa Gonçalves.</p>
        </div>
        <form className="mt-8 space-y-6 w-full" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="username" className="sr-only">Usuário</label>
              <input
                id="username"
                name="username"
                type="text"
                value="Vanessa Gonçalves"
                disabled
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-slate-300 bg-slate-100 placeholder-slate-500 text-slate-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="password-login" className="sr-only">Senha</label>
              <input
                id="password-login"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-slate-300 bg-white placeholder-slate-500 text-slate-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Senha"
                autoFocus
              />
            </div>
          </div>
          
          {error && <p className="text-center text-sm text-rose-600">{error}</p>}

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-full text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm transition-all"
            >
              Entrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
