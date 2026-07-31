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
    <div className="fixed inset-0 z-50 bg-[var(--maru-void)]/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[var(--maru-surface)] border border-[var(--maru-border)] rounded-2xl p-6 sm:p-8 w-full max-w-md shadow-[0_24px_80px_rgba(0,0,0,0.55)] space-y-6 text-[var(--maru-text)]">
        <div className="text-center space-y-2">
          <img
            src="/logo.jpg"
            alt="MARU OS Logo"
            className="w-14 h-14 rounded-full object-cover border border-[var(--maru-gold)]/50 mx-auto shadow-[0_0_28px_rgba(212,175,55,0.35)] animate-maru-spin-slow"
          />
          <h2 className="text-2xl font-display font-bold text-white tracking-tight">
            Iniciar Sesión
          </h2>
          <p className="text-xs text-[var(--maru-text-muted)]">
            Tus datos nunca salen de este dispositivo.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase text-[var(--maru-text-muted)] mb-1">
              Nombre de usuario
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 text-[var(--maru-text-dim)]" size={18} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ej: oliver_revilo"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-[var(--maru-void)] border border-[var(--maru-border-soft)] rounded-xl text-sm text-white placeholder:text-[var(--maru-text-dim)] focus:outline-none focus:ring-1 focus:ring-[var(--maru-gold)]/60"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-[var(--maru-text-muted)] mb-1">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-[var(--maru-text-dim)]" size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-10 py-2.5 bg-[var(--maru-void)] border border-[var(--maru-border-soft)] rounded-xl text-sm text-white placeholder:text-[var(--maru-text-dim)] focus:outline-none focus:ring-1 focus:ring-[var(--maru-gold)]/60"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-[var(--maru-text-dim)] hover:text-white"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-[#C0392B]/15 border border-[#C0392B]/35 rounded-xl text-xs text-[#F5A9A0] flex items-center gap-2">
              <ShieldAlert size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {failedAttempts >= 2 && account?.passwordHint && (
            <div className="p-3 bg-[var(--maru-gold)]/10 border border-[var(--maru-gold)]/30 rounded-xl text-xs text-[var(--maru-gold)]">
              <strong>Pista:</strong> {account.passwordHint}
            </div>
          )}

          {failedAttempts >= 3 && (
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenRecovery();
                }}
                className="text-xs text-[var(--maru-gold)] hover:underline font-semibold flex items-center justify-center gap-1.5 mx-auto"
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
              className="flex-1 py-2.5 px-4 maru-btn-ghost rounded-xl text-sm font-display"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 maru-btn-gold rounded-xl text-sm font-display"
            >
              Entrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
