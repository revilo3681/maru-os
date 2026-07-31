import React, { useState } from 'react';
import { KeyRound, CheckCircle2, ShieldAlert } from 'lucide-react';
import { StorageService, mockHashPassword } from '../../services/storageService';

interface RecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const RecoveryModal: React.FC<RecoveryModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [seedInput, setSeedInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newHint, setNewHint] = useState('');
  const [step, setStep] = useState<'phrase' | 'reset'>('phrase');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleVerifyPhrase = (e: React.FormEvent) => {
    e.preventDefault();
    const account = StorageService.getAccount();
    if (!account || !account.recoveryPhrase) {
      setErrorMsg('No se encontró frase de recuperación registrada.');
      return;
    }

    const enteredWords = seedInput.trim().toLowerCase().split(/\s+/);
    const expectedWords = account.recoveryPhrase.map(w => w.toLowerCase());

    const isMatch = enteredWords.length === 12 && enteredWords.every((w, i) => w === expectedWords[i]);

    if (isMatch) {
      setErrorMsg('');
      setStep('reset');
    } else {
      setErrorMsg('Frase incorrecta. Verifica que las 12 palabras coincidan en orden exacto.');
    }
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    const account = StorageService.getAccount();
    if (!account) return;

    account.passwordHash = mockHashPassword(newPassword);
    if (newHint) account.passwordHint = newHint;

    StorageService.saveAccount(account);
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[var(--maru-void)]/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="maru-panel !p-6 sm:!p-8 w-full max-w-lg shadow-[var(--maru-shadow-md)] space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-[#4A9B9D]/20 text-[#4A9B9D] flex items-center justify-center mx-auto">
            <KeyRound size={24} />
          </div>
          <h2 className="text-2xl font-display font-bold text-[var(--maru-text)]">
            {step === 'phrase' ? 'Recuperar Contraseña' : 'Nueva Contraseña'}
          </h2>
          <p className="text-xs text-[#6B7F8C]">
            {step === 'phrase'
              ? 'Ingresa tus 12 palabras de recuperación en orden exacto separadas por espacios.'
              : 'Escribe tu nueva contraseña segura.'}
          </p>
        </div>

        {step === 'phrase' ? (
          <form onSubmit={handleVerifyPhrase} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase text-[#2C3E50] mb-1">
                Las 12 palabras de recuperación
              </label>
              <textarea
                value={seedInput}
                onChange={(e) => setSeedInput(e.target.value)}
                rows={3}
                placeholder="manantial piedra quebrada sol andino nieve viento agua condor altura tierra fuego"
                required
                className="maru-field min-h-24 font-mono"
              />
            </div>

            {errorMsg && (
              <div className="p-3 bg-[#C0392B]/10 border border-[#C0392B]/30 rounded-xl text-xs text-[#C0392B] flex items-center gap-2">
                <ShieldAlert size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="maru-btn-secondary flex-1"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="maru-btn-primary flex-1"
              >
                Verificar Frase
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase text-[#2C3E50] mb-1">Nueva Contraseña</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                minLength={8}
                required
                className="maru-field"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-[#2C3E50] mb-1">Pista Opcional</label>
              <input
                type="text"
                value={newHint}
                onChange={(e) => setNewHint(e.target.value)}
                placeholder="Ej: nombre de mi primera mascota"
                className="maru-field"
              />
            </div>

            <button
              type="submit"
              className="maru-btn-primary w-full"
            >
              <CheckCircle2 size={18} />
              Guardar Nueva Contraseña
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
