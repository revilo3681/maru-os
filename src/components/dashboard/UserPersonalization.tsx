import React, { useRef, useState } from 'react';
import { Camera, Palette, User, X } from 'lucide-react';
import { AppSettings, UserProfile } from '../../types';
import { StorageService } from '../../services/storageService';
import { syncProfileChange, syncSettingsChange } from '../../services/knowledgeSync';

interface Props {
  userProfile: UserProfile;
  settings: AppSettings;
  onProfileChange: (p: UserProfile) => void;
  onSettingsChange: (s: AppSettings) => void;
}

const PRESETS = [
  { label: 'Andino', primary: '#1E3A5F', accent: '#4A9B9D', bg: '#F5F1E8' },
  { label: 'Océano', primary: '#0B3D5C', accent: '#2E8BC0', bg: '#F0F7FB' },
  { label: 'Selva', primary: '#1B4332', accent: '#40916C', bg: '#F1F8F4' },
  { label: 'Atardecer', primary: '#5C2C1D', accent: '#E07A3D', bg: '#FFF6F0' }
];

export const UserPersonalization: React.FC<Props> = ({
  userProfile,
  settings,
  onProfileChange,
  onSettingsChange
}) => {
  const [open, setOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const applyTheme = (next: AppSettings) => {
    StorageService.saveSettings(next);
    onSettingsChange(next);
    syncSettingsChange(
      `Tema UI: primario ${next.uiPrimary || 'default'}, acento ${next.uiAccent || 'default'}`
    );
    const root = document.documentElement;
    if (next.uiPrimary) root.style.setProperty('--maru-primary', next.uiPrimary);
    if (next.uiAccent) root.style.setProperty('--maru-accent', next.uiAccent);
    if (next.uiBg) root.style.setProperty('--maru-bg', next.uiBg);
  };

  const onAvatar = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const next = { ...userProfile, avatarDataUrl: reader.result as string };
      syncProfileChange(next, 'Foto de perfil actualizada');
      onProfileChange(next);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-xl border border-[var(--maru-border-soft)] bg-white/90 hover:bg-white shadow-sm"
        title="Personalización de usuario"
      >
        {userProfile.avatarDataUrl ? (
          <img src={userProfile.avatarDataUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
        ) : (
          <span className="w-8 h-8 rounded-full bg-[var(--maru-primary)] text-white flex items-center justify-center text-xs font-bold">
            {(userProfile.name || 'U')[0]}
          </span>
        )}
        <span className="hidden sm:block text-xs font-bold text-[var(--maru-text)] max-w-[100px] truncate">
          {userProfile.name || 'Usuario'}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-30 w-72 p-3 rounded-2xl bg-white border border-[var(--maru-border-soft)] shadow-[var(--maru-shadow-md)] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wide text-[var(--maru-text-muted)] flex items-center gap-1">
              <User size={12} /> Perfil
            </span>
            <button type="button" onClick={() => setOpen(false)} className="p-1 text-[var(--maru-text-muted)]">
              <X size={14} />
            </button>
          </div>

          <div className="flex items-center gap-3">
            {userProfile.avatarDataUrl ? (
              <img src={userProfile.avatarDataUrl} alt="" className="w-14 h-14 rounded-full object-cover border border-[var(--maru-border-soft)]" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-[var(--maru-surface-muted)] flex items-center justify-center">
                <Camera size={18} className="text-[var(--maru-text-muted)]" />
              </div>
            )}
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="maru-btn-secondary !min-h-8 px-3 text-[11px]"
              >
                <Camera size={12} /> Foto de perfil
              </button>
              {userProfile.avatarDataUrl && (
                <button
                  type="button"
                  className="text-[10px] text-[#C0392B] font-bold"
                  onClick={() => {
                    const next = { ...userProfile, avatarDataUrl: undefined };
                    syncProfileChange(next, 'Foto de perfil eliminada');
                    onProfileChange(next);
                  }}
                >
                  Quitar foto
                </button>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onAvatar(f);
              }}
            />
          </div>

          <div className="space-y-2 pt-1 border-t border-[var(--maru-border-soft)]">
            <div className="text-xs font-bold uppercase tracking-wide text-[var(--maru-text-muted)] flex items-center gap-1">
              <Palette size={12} /> Colores de interfaz
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() =>
                    applyTheme({
                      ...settings,
                      uiPrimary: p.primary,
                      uiAccent: p.accent,
                      uiBg: p.bg
                    })
                  }
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg border border-[var(--maru-border-soft)] hover:border-[var(--maru-primary)] text-left"
                >
                  <span className="flex -space-x-1">
                    <span className="w-3 h-3 rounded-full border border-white" style={{ background: p.primary }} />
                    <span className="w-3 h-3 rounded-full border border-white" style={{ background: p.accent }} />
                  </span>
                  <span className="text-[11px] font-bold text-[var(--maru-text)]">{p.label}</span>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <label className="text-[10px] text-[var(--maru-text-muted)]">
                Primario
                <input
                  type="color"
                  value={settings.uiPrimary || '#1E3A5F'}
                  onChange={(e) => applyTheme({ ...settings, uiPrimary: e.target.value })}
                  className="w-full h-8 rounded cursor-pointer"
                />
              </label>
              <label className="text-[10px] text-[var(--maru-text-muted)]">
                Acento
                <input
                  type="color"
                  value={settings.uiAccent || '#4A9B9D'}
                  onChange={(e) => applyTheme({ ...settings, uiAccent: e.target.value })}
                  className="w-full h-8 rounded cursor-pointer"
                />
              </label>
              <label className="text-[10px] text-[var(--maru-text-muted)]">
                Fondo
                <input
                  type="color"
                  value={settings.uiBg || '#F5F1E8'}
                  onChange={(e) => applyTheme({ ...settings, uiBg: e.target.value })}
                  className="w-full h-8 rounded cursor-pointer"
                />
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
