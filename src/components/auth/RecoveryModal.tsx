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
    <div className="fixed inset-0 z-50 bg-[#1E3A5F]/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#F5F1E8] border border-[#E3DCCB] rounded-2xl p-6 sm:p-8 w-full max-w-lg shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-[#4A9B9D]/20 text-[#4A9B9D] flex items-center justify-center mx-auto">
            <KeyRound size={24} />
          </div>
          <h2 className="text-2xl font-serif font-bold text-[#1E3A5F]">
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
                className="w-full p-3 bg-white border border-[#E3DCCB] rounded-xl text-sm font-mono text-[#2C3E50] focus:outline-none focus:ring-2 focus:ring-[#4A9B9D]"
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
                className="flex-1 py-2.5 px-4 border border-[#E3DCCB] rounded-xl text-sm font-medium text-[#2C3E50] hover:bg-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 px-4 bg-[#4A9B9D] hover:bg-[#3A8B8D] text-white rounded-xl text-sm font-medium transition-colors shadow"
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
                className="w-full px-4 py-2.5 bg-white border border-[#E3DCCB] rounded-xl text-sm text-[#2C3E50] focus:outline-none focus:ring-2 focus:ring-[#4A9B9D]"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-[#2C3E50] mb-1">Pista Opcional</label>
              <input
                type="text"
                value={newHint}
                onChange={(e) => setNewHint(e.target.value)}
                placeholder="Ej: nombre de mi primera mascota"
                className="w-full px-4 py-2.5 bg-white border border-[#E3DCCB] rounded-xl text-sm text-[#2C3E50] focus:outline-none focus:ring-2 focus:ring-[#4A9B9D]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#5A8F6B] hover:bg-[#4A7F5B] text-white rounded-xl font-medium transition-colors shadow flex items-center justify-center gap-2"
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
