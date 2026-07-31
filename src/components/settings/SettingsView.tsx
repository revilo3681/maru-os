import React, { useState } from 'react';
import {
  ShieldCheck,
  Flame,
  Volume2,
  KeyRound,
  Download,
  Trash2,
  AlertTriangle,
  Mail
} from 'lucide-react';
import { StorageService } from '../../services/storageService';
import { AppSettings } from '../../types';

interface SettingsViewProps {
  onWipeData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onWipeData }) => {
  const [settings, setSettings] = useState<AppSettings>(() => StorageService.getSettings());
  const [showSeed, setShowSeed] = useState(false);
  const [showWipeModal, setShowWipeModal] = useState(false);
  const [wipeConfirmText, setWipeConfirmText] = useState('');
  const [gmailEmail, setGmailEmail] = useState(() => localStorage.getItem('maru_gmail_email') || '');
  const [gmailAppPass, setGmailAppPass] = useState(() => localStorage.getItem('maru_gmail_app_pass') || '');
  const [gmailSaved, setGmailSaved] = useState(false);

  const account = StorageService.getAccount();

  const handleToggleSettings = (key: keyof AppSettings) => {
    const updated = { ...settings, [key]: !settings[key] };
    StorageService.saveSettings(updated);
    setSettings(updated);
  };

  const handleExportJSON = () => {
    const jsonStr = StorageService.exportAllDataJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `maru-os-export-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleConfirmWipe = () => {
    if (wipeConfirmText === 'BORRAR TODO') {
      StorageService.wipeAllData();
      onWipeData();
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 bg-[var(--maru-bg)] text-[var(--maru-text)]">
      <div className="space-y-1">
        <div className="text-xs font-mono uppercase tracking-wider text-[var(--maru-text-muted)]">Configuración & Privacidad</div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-[var(--maru-text)]">
          Ajustes del Sistema MARU OS
        </h1>
        <p className="text-xs text-[var(--maru-text-muted)]">
          Controla la privacidad, seguridad, modo efímero y exportación de tus datos.
        </p>
      </div>

      {/* Privacidad & Modo Efímero */}
      <div className="bg-white border border-[var(--maru-border-soft)] p-6 rounded-2xl shadow-sm space-y-4">
        <h3 className="font-display font-semibold text-lg text-[var(--maru-text)] border-b border-[var(--maru-border-soft)] pb-2 flex items-center gap-2">
          <ShieldCheck className="text-[#34C759]" size={20} />
          Privacidad & Modos de Memoria
        </h3>

        <div className="space-y-3">
          {/* Ephemeral Mode Toggle */}
          <div className="flex items-center justify-between p-4 bg-[#F2F2F7] rounded-xl border border-transparent">
            <div className="space-y-0.5">
              <div className="font-bold text-sm text-[var(--maru-text)] flex items-center gap-2">
                <Flame size={18} className="text-[#FF3B30]" />
                Modo Efímero (Sin Guardar Historial)
              </div>
              <p className="text-xs text-[var(--maru-text-muted)]">
                Cuando está activo, ninguna conversación o dato se guarda en PostgreSQL ni en el grafo RAG.
              </p>
            </div>
            <button
              onClick={() => handleToggleSettings('ephemeralMode')}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                settings.ephemeralMode ? 'bg-[#FF3B30]' : 'bg-[#E5E5EA]'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  settings.ephemeralMode ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Voice Readout Toggle */}
          <div className="flex items-center justify-between p-4 bg-[#F2F2F7] rounded-xl border border-transparent">
            <div className="space-y-0.5">
              <div className="font-bold text-sm text-[var(--maru-text)] flex items-center gap-2">
                <Volume2 size={18} className="text-[#007AFF]" />
                Lectura Automática de Voz (TTS)
              </div>
              <p className="text-xs text-[var(--maru-text-muted)]">
                MARU OS leerá cada respuesta generada con la voz del agente activo.
              </p>
            </div>
            <button
              onClick={() => handleToggleSettings('voiceReadoutEnabled')}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                settings.voiceReadoutEnabled ? 'bg-[#34C759]' : 'bg-[#E5E5EA]'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  settings.voiceReadoutEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Gmail Integración Real */}
      <div className="bg-white border border-[var(--maru-border-soft)] p-6 rounded-2xl shadow-sm space-y-4">
        <h3 className="font-display font-semibold text-lg text-[var(--maru-text)] border-b border-[var(--maru-border-soft)] pb-2 flex items-center gap-2">
          <Mail className="text-[#FF3B30]" size={20} />
          Conexión con Gmail (Lectura & Borradores)
        </h3>
        <p className="text-xs text-[var(--maru-text-muted)]">
          Ingresa tus credenciales o contraseña de aplicación (App Password de 16 dígitos de Google) para autorizar la lectura de notificaciones en segundo plano y la creación de borradores directos.
        </p>

        <div className="space-y-3 max-w-md text-xs">
          <div>
            <label className="block font-bold text-[var(--maru-text)] mb-1">Correo Gmail:</label>
            <input 
              type="email" 
              value={gmailEmail} 
              onChange={(e) => setGmailEmail(e.target.value)} 
              placeholder="tuusuario@gmail.com"
              className="w-full px-3 py-2 border border-transparent rounded-xl bg-[#F2F2F7] focus:border-[#007AFF] outline-none"
            />
          </div>
          <div>
            <label className="block font-bold text-[var(--maru-text)] mb-1">Contraseña de Aplicación / App Token:</label>
            <input 
              type="password" 
              value={gmailAppPass} 
              onChange={(e) => setGmailAppPass(e.target.value)} 
              placeholder="•••• •••• •••• ••••"
              className="w-full px-3 py-2 border border-transparent rounded-xl bg-[#F2F2F7] font-mono focus:border-[#007AFF] outline-none"
            />
          </div>
          <button 
            onClick={() => {
              localStorage.setItem('maru_gmail_email', gmailEmail);
              localStorage.setItem('maru_gmail_app_pass', gmailAppPass);
              setGmailSaved(true);
              setTimeout(() => setGmailSaved(false), 3000);
            }}
            className="px-4 py-2 bg-[#007AFF] hover:bg-[#0056B3] text-white rounded-xl font-bold transition-all shadow-sm"
          >
            {gmailSaved ? '✓ Credenciales Guardadas Localmente' : 'Guardar Credenciales Gmail'}
          </button>
        </div>
      </div>

      {/* Account & Recovery Phrase */}
      <div className="bg-white border border-[var(--maru-border-soft)] p-6 rounded-2xl shadow-sm space-y-4">
        <h3 className="font-display font-semibold text-lg text-[var(--maru-text)] border-b border-[var(--maru-border-soft)] pb-2 flex items-center gap-2">
          <KeyRound className="text-[#FF9500]" size={20} />
          Seguridad & Frase de Recuperación
        </h3>

        <div className="space-y-3 text-xs">
          <div>
            <span className="font-bold text-[var(--maru-text)]">Usuario:</span> {account?.username || 'oliver_revilo'}
          </div>
          {account?.passwordHint && (
            <div>
              <span className="font-bold text-[var(--maru-text)]">Pista de Contraseña:</span> {account.passwordHint}
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={() => setShowSeed(!showSeed)}
              className="px-4 py-2 border border-[var(--maru-border-soft)] rounded-xl text-xs font-mono text-[var(--maru-text)] hover:bg-[#F2F2F7]"
            >
              {showSeed ? 'Ocultar Frase de 12 Palabras' : '👁️ Ver Frase de 12 Palabras'}
            </button>

            {showSeed && account?.recoveryPhrase && (
              <div className="mt-3 p-4 bg-[#F2F2F7] text-[var(--maru-text)] rounded-xl font-mono grid grid-cols-3 sm:grid-cols-4 gap-2">
                {account.recoveryPhrase.map((word, idx) => (
                  <div key={idx} className="bg-white p-1.5 rounded shadow-sm">
                    <span className="text-[#007AFF]">{idx + 1}.</span> {word}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Export & Destructive Actions */}
      <div className="bg-white border border-[var(--maru-border-soft)] p-6 rounded-2xl shadow-sm space-y-4">
        <h3 className="font-display font-semibold text-lg text-[var(--maru-text)] border-b border-[var(--maru-border-soft)] pb-2 flex items-center gap-2">
          <Download className="text-[var(--maru-text)]" size={20} />
          Exportar o Eliminar Datos
        </h3>

        <div className="flex flex-wrap gap-4">
          <button
            onClick={handleExportJSON}
            className="px-5 py-2.5 bg-[#F2F2F7] hover:bg-gray-200 text-[var(--maru-text)] text-xs font-medium rounded-xl flex items-center gap-2 shadow-sm"
          >
            <Download size={16} />
            <span>Exportar Todos mis Datos (JSON)</span>
          </button>

          <button
            onClick={() => setShowWipeModal(true)}
            className="px-5 py-2.5 bg-[#FF3B30] hover:bg-[#D32F2F] text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm"
          >
            <Trash2 size={16} />
            <span>Borrar Todo Mi Historial y Cuenta</span>
          </button>
        </div>
      </div>

      {/* BORRAR TODO Modal */}
      {showWipeModal && (
        <div className="fixed inset-0 z-50 bg-[#1C1C1E]/50 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-md shadow-2xl space-y-5 text-[var(--maru-text)]">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-[#FF3B30]/10 text-[#FF3B30] flex items-center justify-center mx-auto">
                <AlertTriangle size={32} />
              </div>
              <h2 className="text-xl font-display font-bold text-[#FF3B30]">
                ⚠️ ELIMINAR CUENTA Y DATOS PERMANENTEMENTE
              </h2>
              <p className="text-xs text-[var(--maru-text-muted)]">
                Esta acción eliminará para siempre tu usuario, historial, hábitos, perfil médico y nodos de memoria RAG en este dispositivo.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-mono uppercase text-[var(--maru-text)]">
                Escribe <strong className="text-[#FF3B30]">BORRAR TODO</strong> para confirmar:
              </label>
              <input
                type="text"
                value={wipeConfirmText}
                onChange={(e) => setWipeConfirmText(e.target.value)}
                placeholder="BORRAR TODO"
                className="w-full px-4 py-2.5 border border-[#FF3B30] bg-[#FF3B30]/5 rounded-xl text-sm font-bold text-[#FF3B30] focus:outline-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowWipeModal(false)}
                className="flex-1 py-2.5 bg-[#F2F2F7] hover:bg-gray-200 text-[var(--maru-text)] rounded-xl text-xs font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmWipe}
                disabled={wipeConfirmText !== 'BORRAR TODO'}
                className="flex-1 py-2.5 bg-[#FF3B30] hover:bg-[#D32F2F] disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
              >
                BORRAR TODO PARA SIEMPRE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
