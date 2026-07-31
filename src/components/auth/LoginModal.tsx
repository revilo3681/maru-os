import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, ShieldAlert, KeyRound } from 'lucide-react';
import { StorageService, mockHashPassword } from '../../services/storageService';
import { MaruEnso } from '../brand/MaruEnso';

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
    if (account.passwordHash === hashedInput) {
      setErrorMsg('');
      setFailedAttempts(0);
      onSuccess();
    } else {
      const nextFail = failedAttempts + 1;
      setFailedAttempts(nextFail);
      setErrorMsg(
        nextFail >= 3
          ? 'Contraseña incorrecta. Usa «Recuperar con frase semilla» si la olvidaste.'
          : 'Contraseña incorrecta.'
      );
    }
  };

  const account = StorageService.getAccount();

  return (
    <div className="fixed inset-0 z-50 bg-[var(--maru-void)]/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="maru-panel !p-6 sm:!p-8 w-full max-w-md shadow-[var(--maru-shadow-md)] space-y-6 text-[var(--maru-text)]">
        <div className="text-center space-y-2">
          <MaruEnso size={56} showName={false} className="mx-auto" />
          <h2 className="text-2xl font-display font-bold text-[var(--maru-text)] tracking-tight">
            Iniciar sesión
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
                className="maru-field pl-10"
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
                className="maru-field pl-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1 text-[var(--maru-text-dim)] hover:text-[var(--maru-text)] p-2"
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
