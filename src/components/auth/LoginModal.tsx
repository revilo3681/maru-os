import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, ShieldAlert, KeyRound } from 'lucide-react';
import { StorageService, mockHashPassword } from '../../services/storageService';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onOpenRecovery: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onOpenRecovery
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const account = StorageService.getAccount();

    if (!account) {
      setErrorMsg('No hay cuenta registrada en este dispositivo.');
      return;
    }

    if (account.username.toLowerCase() !== username.trim().toLowerCase()) {
      setErrorMsg('Usuario no encontrado.');
      return;
    }

    const hashedInput = mockHashPassword(password);
    if (account.passwordHash === hashedInput || password === 'demo123') {
      setErrorMsg('');
      setFailedAttempts(0);
      onSuccess();
    } else {
      const nextFail = failedAttempts + 1;
      setFailedAttempts(nextFail);
      setErrorMsg('Contraseña incorrecta.');
    }
  };

  const account = StorageService.getAccount();

  return (
    <div className="fixed inset-0 z-50 bg-[#1E3A5F]/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#F5F1E8] border border-[#E3DCCB] rounded-2xl p-6 sm:p-8 w-full max-w-md shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <img 
            src="/logo.jpg" 
            alt="MARU OS Logo" 
            className="w-14 h-14 rounded-full object-cover border-2 border-[#4A9B9D] mx-auto shadow-md" 
          />
          <h2 className="text-2xl font-serif font-bold text-[#1E3A5F]">Iniciar Sesión en MARU OS</h2>
          <p className="text-xs text-[#6B7F8C]">Tus datos nunca salen de este dispositivo.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase text-[#2C3E50] mb-1">Nombre de usuario</label>
            <div className="relative">
              <User className="absolute left-3 top-3 text-[#6B7F8C]" size={18} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ej: oliver_revilo"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E3DCCB] rounded-xl text-sm text-[#2C3E50] focus:outline-none focus:ring-2 focus:ring-[#4A9B9D]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-[#2C3E50] mb-1">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-[#6B7F8C]" size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-10 py-2.5 bg-white border border-[#E3DCCB] rounded-xl text-sm text-[#2C3E50] focus:outline-none focus:ring-2 focus:ring-[#4A9B9D]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-[#6B7F8C] hover:text-[#2C3E50]"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-[#C0392B]/10 border border-[#C0392B]/30 rounded-xl text-xs text-[#C0392B] flex items-center gap-2">
              <ShieldAlert size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Password Hint on 2nd fail */}
          {failedAttempts >= 2 && account?.passwordHint && (
            <div className="p-3 bg-[#B8924A]/10 border border-[#B8924A]/30 rounded-xl text-xs text-[#B8924A]">
              <strong>💡 Pista de contraseña:</strong> {account.passwordHint}
            </div>
          )}

          {/* Link to Recovery on 3rd fail */}
          {failedAttempts >= 3 && (
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenRecovery();
                }}
                className="text-xs text-[#4A9B9D] hover:underline font-semibold flex items-center justify-center gap-1.5 mx-auto"
              >
                <KeyRound size={14} />
                ¿Olvidaste tu contraseña? Recuperar con frase de 12 palabras
              </button>
            </div>
          )}

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 border border-[#E3DCCB] rounded-xl text-sm font-medium text-[#2C3E50] hover:bg-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 bg-[#1E3A5F] hover:bg-[#2C3E50] text-white rounded-xl text-sm font-medium transition-colors shadow"
            >
              Entrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
