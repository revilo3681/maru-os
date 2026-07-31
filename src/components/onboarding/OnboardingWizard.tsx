import React, { useState } from 'react';
import {
  User,
  ShieldCheck,
  Download,
  Copy,
  Heart,
  MapPin,
  Repeat,
  Users,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Trash2
} from 'lucide-react';
import {
  StorageService,
  generate12WordSeed,
  mockHashPassword,
  defaultProfile,
  defaultHealth,
  defaultLocation,
  defaultHabits
} from '../../services/storageService';
import { UserProfile, HealthProfile, LocationProfile, Habit, CommunicationTone, Medication } from '../../types';
import { AGENTS_CATALOG } from '../../data/agentsData';

interface OnboardingWizardProps {
  onComplete: () => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);

  // Step 1: Account
  const [username, setUsername] = useState('oliver_revilo');
  const [password, setPassword] = useState('Oliver2026!');
  const [confirmPassword, setConfirmPassword] = useState('Oliver2026!');
  const [termsAccepted, setTermsAccepted] = useState(true);

  // Step 2: Seed Phrase
  const [recoverySeed] = useState<string[]>(generate12WordSeed());
  const [seedSaved, setSeedSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  // Step 3: Profile
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);

  // Step 4: Health
  const [health, setHealth] = useState<HealthProfile>(defaultHealth);
  const [newAllergy, setNewAllergy] = useState('');
  const [medName, setMedName] = useState('');
  const [medDose, setMedDose] = useState('');
  const [medFreq, setMedFreq] = useState('');

  // Step 5: Location
  const [location, setLocation] = useState<LocationProfile>(defaultLocation);

  // Step 6: Habits
  const [habits, setHabits] = useState<Habit[]>(defaultHabits);
  const [customHabitTitle, setCustomHabitTitle] = useState('');

  // Step 7: Agents
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>(['aya', 'sumaq', 'tupac', 'yaku']);
  const [autoRouting, setAutoRouting] = useState(true);

  // Copy Seed
  const handleCopySeed = () => {
    navigator.clipboard.writeText(recoverySeed.join(' '));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download Recovery Seed File
  const handleDownloadSeed = () => {
    const textContent = `====================================================
MARU OS — ARCHIVO DE RECUPERACIÓN DE CUENTA
====================================================
Usuario: ${username}
Fecha: ${new Date().toLocaleString()}

12 PALABRAS DE RECUPERACIÓN (MANTENER EN SECRETO):
----------------------------------------------------
${recoverySeed.map((word, i) => `${i + 1}. ${word}`).join('\n')}

====================================================
ADVERTENCIA: Si pierdes esta frase y tu contraseña,
no se podrá recuperar tu cuenta. Guárdalo bien.
====================================================`;

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `maru-recovery-${username}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    setSeedSaved(true);
  };

  const handleAddAllergy = (allergyStr: string) => {
    if (!allergyStr.trim()) return;
    if (!health.allergies.includes(allergyStr.trim())) {
      setHealth({ ...health, allergies: [...health.allergies, allergyStr.trim()] });
    }
    setNewAllergy('');
  };

  const handleAddMedication = () => {
    if (!medName.trim()) return;
    const newMed: Medication = {
      id: `med-${Date.now()}`,
      name: medName.trim(),
      dose: medDose.trim() || '500mg',
      frequency: medFreq.trim() || 'cada 12 horas'
    };
    setHealth({ ...health, currentMedications: [...health.currentMedications, newMed] });
    setMedName('');
    setMedDose('');
    setMedFreq('');
  };

  const handleFinishOnboarding = () => {
    // 1. Save Account
    StorageService.saveAccount({
      id: `usr-${Date.now()}`,
      username,
      passwordHash: mockHashPassword(password),
      recoveryPhrase: recoverySeed,
      recoveryPhraseConfirmed: true,
      createdAt: new Date().toISOString()
    });

    // 2. Save Profiles & Data
    StorageService.saveProfile(profile);
    StorageService.saveHealth(health);
    StorageService.saveLocation(location);
    StorageService.saveHabits(habits);
    StorageService.setOnboarded(true);

    onComplete();
  };

  return (
    <div className="min-h-screen maru-gradient-void text-[var(--maru-text)] flex flex-col items-center justify-center p-4 py-8">
      {/* Top Header */}
      <div className="w-full max-w-2xl mb-6 text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[var(--maru-surface)] text-[var(--maru-gold)] rounded-lg text-xs font-mono border border-[var(--maru-border)]">
          <Sparkles size={14} className="text-[var(--maru-gold)]" />
          <span>RITUAL DE ONBOARDING · PASO {step} DE 7</span>
        </div>
        <div className="flex justify-center py-2">
          <img
            src="/logo.jpg"
            alt="MARU OS"
            className="w-14 h-14 rounded-full object-cover border border-[var(--maru-gold)]/50 shadow-[0_0_28px_rgba(212,175,55,0.35)] animate-maru-spin-slow"
          />
        </div>
        <h1 className="text-3xl font-display font-bold text-white tracking-tight">
          Bienvenido al Manantial
        </h1>
        <p className="text-sm text-[var(--maru-text-muted)]">
          Configuración inicial. Todo queda cifrado en tu dispositivo.
        </p>

        {/* Step Progress Bar */}
        <div className="w-full bg-[var(--maru-void)] h-2 rounded-full overflow-hidden mt-4 border border-[var(--maru-border-soft)]">
          <div
            className="bg-[var(--maru-gold)] h-full transition-all duration-500"
            style={{ width: `${(step / 7) * 100}%` }}
          />
        </div>
      </div>

      {/* Main Card Container — readable warm surface */}
      <div className="w-full max-w-2xl bg-white text-[var(--maru-text)] border border-[var(--maru-gold)]/25 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.45)] p-6 sm:p-8 space-y-6">
        {/* PASO 1: CREAR CUENTA */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="border-b border-transparent pb-4">
              <h2 className="text-xl font-serif font-bold text-[var(--maru-text)] flex items-center gap-2">
                <User className="text-[#4A9B9D]" size={22} />
                Paso 1: Crear Tu Cuenta
              </h2>
              <p className="text-xs text-[var(--maru-text-muted)] mt-1">
                No requerimos correo electrónico. Tu privacidad es sagrada.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-[var(--maru-text)] mb-1">Nombre de usuario *</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#F2F2F7]/50 border border-transparent rounded-xl text-sm text-[var(--maru-text)] focus:ring-2 focus:ring-[#007AFF]/50 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-[var(--maru-text)] mb-1">Contraseña *</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#F2F2F7]/50 border border-transparent rounded-xl text-sm text-[var(--maru-text)] focus:ring-2 focus:ring-[#007AFF]/50 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-[var(--maru-text)] mb-1">Repetir Contraseña *</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#F2F2F7]/50 border border-transparent rounded-xl text-sm text-[var(--maru-text)] focus:ring-2 focus:ring-[#007AFF]/50 outline-none"
                  required
                />
              </div>

              <label className="flex items-start gap-3 p-3 bg-[#F2F2F7] rounded-xl border border-transparent cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-1 accent-[#4A9B9D]"
                />
                <span className="text-xs text-[var(--maru-text)]">
                  Entiendo que mis datos y conversaciones nunca salen de este dispositivo y que soy dueño absoluto de mi información.
                </span>
              </label>
            </div>
          </div>
        )}

        {/* PASO 2: FRASE DE RECUPERACIÓN */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="border-b border-transparent pb-4">
              <h2 className="text-xl font-serif font-bold text-[var(--maru-text)] flex items-center gap-2">
                <ShieldCheck className="text-[#B8924A]" size={22} />
                Paso 2: Tu Frase de Recuperación (12 Palabras)
              </h2>
              <p className="text-xs text-[var(--maru-text-muted)] mt-1">
                Guarda estas 12 palabras en orden. Sin ellas, no podrás recuperar tu cuenta si olvidas tu contraseña.
              </p>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 bg-[#1E3A5F] p-4 rounded-xl text-white font-mono text-xs">
              {recoverySeed.map((word, idx) => (
                <div key={idx} className="bg-[#2C3E50] p-2 rounded flex gap-2">
                  <span className="text-[#4A9B9D]">{idx + 1}.</span>
                  <span className="font-semibold">{word}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleDownloadSeed}
                className="flex items-center gap-2 px-4 py-2 bg-[#1E3A5F] text-white text-xs font-medium rounded-xl hover:bg-[#2C3E50] transition-colors shadow"
              >
                <Download size={16} />
                Descargar Frase (.txt)
              </button>

              <button
                type="button"
                onClick={handleCopySeed}
                className="flex items-center gap-2 px-4 py-2 border border-transparent text-[var(--maru-text)] text-xs font-medium rounded-xl hover:bg-[#F2F2F7] transition-colors"
              >
                <Copy size={16} />
                {copied ? '¡Copiado!' : 'Copiar al Portapapeles'}
              </button>
            </div>

            <label className="flex items-center gap-3 p-3 bg-[#B8924A]/10 border border-[#B8924A]/30 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={seedSaved}
                onChange={(e) => setSeedSaved(e.target.checked)}
                className="accent-[#B8924A]"
              />
              <span className="text-xs text-[var(--maru-text)] font-medium">
                Ya guardé mi frase de recuperación de 12 palabras en un lugar seguro.
              </span>
            </label>
          </div>
        )}

        {/* PASO 3: PERFIL PERSONAL */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="border-b border-transparent pb-4">
              <h2 className="text-xl font-serif font-bold text-[var(--maru-text)] flex items-center gap-2">
                <User className="text-[#4A9B9D]" size={22} />
                Paso 3: Perfil Personal
              </h2>
              <p className="text-xs text-[var(--maru-text-muted)] mt-1">
                Cuéntame sobre ti para personalizar nuestras conversaciones.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase text-[var(--maru-text)] mb-1">¿Cómo quieres que te llame?</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#F2F2F7]/50 border border-transparent rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-[var(--maru-text)] mb-1">Edad (años)</label>
                <input
                  type="number"
                  value={profile.age}
                  onChange={(e) => setProfile({ ...profile, age: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 bg-[#F2F2F7]/50 border border-transparent rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-[var(--maru-text)] mb-1">Estatura (cm)</label>
                <input
                  type="number"
                  value={profile.heightCm}
                  onChange={(e) => setProfile({ ...profile, heightCm: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 bg-[#F2F2F7]/50 border border-transparent rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-[var(--maru-text)] mb-1">Peso (kg)</label>
                <input
                  type="number"
                  value={profile.weightKg}
                  onChange={(e) => setProfile({ ...profile, weightKg: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 bg-[#F2F2F7]/50 border border-transparent rounded-xl text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-[var(--maru-text)] mb-1">Sector de Trabajo</label>
              <select
                value={profile.occupation}
                onChange={(e) => setProfile({ ...profile, occupation: e.target.value })}
                className="w-full px-4 py-2.5 bg-[#F2F2F7]/50 border border-transparent rounded-xl text-sm"
              >
                <option value="Tecnología">🖥️ Tecnología / Software</option>
                <option value="Salud">🏥 Salud / Medicina</option>
                <option value="Legal">⚖️ Legal / Derecho</option>
                <option value="Educación">📚 Educación / Docencia</option>
                <option value="Arte">🎨 Arte / Diseño</option>
                <option value="Construcción">🏗️ Construcción / Ingeniería</option>
                <option value="Otro">🔧 Otro Sector</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-[var(--maru-text)] mb-1">Tono Preferido de Comunicación</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { id: 'warm', label: 'Cálido y cercano (Recomendado)' },
                  { id: 'formal', label: 'Formal y respetuoso' },
                  { id: 'direct', label: 'Directo y eficiente' },
                  { id: 'friend', label: 'Como un buen amigo' }
                ].map((tone) => (
                  <button
                    key={tone.id}
                    type="button"
                    onClick={() => setProfile({ ...profile, communicationTone: tone.id as CommunicationTone })}
                    className={`p-3 text-left rounded-xl border transition-all ${
                      profile.communicationTone === tone.id
                        ? 'bg-[#1E3A5F] text-white border-[#1E3A5F] font-semibold'
                        : 'bg-[#F2F2F7]/50 border-transparent text-[var(--maru-text)]'
                    }`}
                  >
                    {tone.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-[var(--maru-text)] mb-1">
                 🌱 Semilla de Contexto Inicial (Opcional - Plus para IA Local)
              </label>
              <textarea
                value={profile.customContext || ''}
                onChange={(e) => setProfile({ ...profile, customContext: e.target.value })}
                placeholder="Ej: Soy programador Python en MacBook Pro M4. Me gustan las explicaciones breves con ejemplos prácticos y trabajar en horario nocturno..."
                className="w-full px-4 py-2.5 bg-[#F2F2F7]/50 border border-transparent rounded-xl text-xs h-20 resize-none"
              />
              <p className="text-[10px] text-[var(--maru-text-muted)] mt-0.5">
                Esta información se inyectará en el System Prompt base para acelerar la comprensión de la IA local sin gastar tiempo deduciendo.
              </p>
            </div>
          </div>
        )}

        {/* PASO 4: SALUD */}
        {step === 4 && (
          <div className="space-y-5">
            <div className="border-b border-transparent pb-4">
              <h2 className="text-xl font-serif font-bold text-[var(--maru-text)] flex items-center gap-2">
                <Heart className="text-[#C0392B]" size={22} />
                Paso 4: Tu Salud Integral
              </h2>
              <p className="text-xs text-[var(--maru-text-muted)] mt-1">
                Aya utilizará esta información para alertarte sobre posibles alergias o interacciones de medicamentos.
              </p>
            </div>

            {/* Allergies */}
            <div className="space-y-2">
              <label className="block text-xs font-mono uppercase text-[var(--maru-text)]">Alergias Conocidas</label>
              <div className="flex flex-wrap gap-2">
                {['Maní', 'Gluten', 'Lactosa', 'Penicilina', 'Mariscos', 'Polen'].map((allergy) => {
                  const isSelected = health.allergies.includes(allergy);
                  return (
                    <button
                      key={allergy}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setHealth({ ...health, allergies: health.allergies.filter(a => a !== allergy) });
                        } else {
                          setHealth({ ...health, allergies: [...health.allergies, allergy] });
                        }
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        isSelected
                          ? 'bg-[#C0392B] text-white border-[#C0392B]'
                          : 'bg-[#F2F2F7] border-transparent text-[var(--maru-text)] hover:bg-[#E3DCCB]'
                      }`}
                    >
                      {isSelected ? '✓ ' : '+ '}{allergy}
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={newAllergy}
                  onChange={(e) => setNewAllergy(e.target.value)}
                  placeholder="Agregar otra alergia..."
                  className="flex-1 px-3 py-1.5 bg-[#F2F2F7]/50 border border-transparent rounded-xl text-xs"
                />
                <button
                  type="button"
                  onClick={() => handleAddAllergy(newAllergy)}
                  className="px-3 py-1.5 bg-[#1E3A5F] text-white rounded-xl text-xs"
                >
                  Agregar
                </button>
              </div>
            </div>

            {/* Medications List */}
            <div className="space-y-2 pt-2 border-t border-transparent">
              <label className="block text-xs font-mono uppercase text-[var(--maru-text)]">Medicamentos Actuales</label>
              <div className="space-y-2">
                {health.currentMedications.map((m) => (
                  <div key={m.id} className="flex items-center justify-between p-2.5 bg-[#F2F2F7] rounded-xl text-xs border border-transparent">
                    <div>
                      <span className="font-bold text-[var(--maru-text)]">💊 {m.name}</span>
                      <span className="text-[var(--maru-text-muted)] ml-2">({m.dose} - {m.frequency})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setHealth({ ...health, currentMedications: health.currentMedications.filter(med => med.id !== m.id) })}
                      className="text-[#C0392B] hover:text-red-700 p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1">
                <input
                  type="text"
                  value={medName}
                  onChange={(e) => setMedName(e.target.value)}
                  placeholder="Medicamento (ej: Amoxicilina)"
                  className="px-3 py-1.5 bg-[#F2F2F7]/50 border border-transparent rounded-xl text-xs"
                />
                <input
                  type="text"
                  value={medDose}
                  onChange={(e) => setMedDose(e.target.value)}
                  placeholder="Dosis (ej: 500mg)"
                  className="px-3 py-1.5 bg-[#F2F2F7]/50 border border-transparent rounded-xl text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddMedication}
                  className="px-3 py-1.5 bg-[#5A8F6B] text-white rounded-xl text-xs font-medium"
                >
                  + Añadir Medicamento
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PASO 5: UBICACIÓN */}
        {step === 5 && (
          <div className="space-y-5">
            <div className="border-b border-transparent pb-4">
              <h2 className="text-xl font-serif font-bold text-[var(--maru-text)] flex items-center gap-2">
                <MapPin className="text-[#4A9B9D]" size={22} />
                Paso 5: Tu Ubicación en el Perú
              </h2>
              <p className="text-xs text-[var(--maru-text-muted)] mt-1">
                Para brindarte reportes precisos de SENAMHI, riesgos de huaicos e información del INEI.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-[var(--maru-text)] mb-1">País</label>
                <input
                  type="text"
                  value={location.country}
                  disabled
                  className="w-full px-4 py-2.5 bg-[#E3DCCB]/40 border border-transparent rounded-xl text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-[var(--maru-text)] mb-1">Ciudad</label>
                <select
                  value={location.city}
                  onChange={(e) => setLocation({ ...location, city: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#F2F2F7]/50 border border-transparent rounded-xl text-sm"
                >
                  <option value="Chosica">Chosica (Lurigancho-Chosica)</option>
                  <option value="Lima">Lima Metropolitana</option>
                  <option value="Cusco">Cusco</option>
                  <option value="Huaraz">Huaraz</option>
                  <option value="Piura">Piura</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-[var(--maru-text)] mb-1">Distrito</label>
                <input
                  type="text"
                  value={location.district}
                  onChange={(e) => setLocation({ ...location, district: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#F2F2F7]/50 border border-transparent rounded-xl text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* PASO 6: HÁBITOS */}
        {step === 6 && (
          <div className="space-y-5">
            <div className="border-b border-transparent pb-4">
              <h2 className="text-xl font-serif font-bold text-[var(--maru-text)] flex items-center gap-2">
                <Repeat className="text-[#5A8F6B]" size={22} />
                Paso 6: Hábitos & Rutinas Diarias
              </h2>
              <p className="text-xs text-[var(--maru-text-muted)] mt-1">
                Sumaq te acompañará a mantener tus rutinas de salud y bienestar cada día.
              </p>
            </div>

            <div className="space-y-2">
              {habits.map((h) => (
                <div key={h.id} className="flex items-center justify-between p-3 bg-[#F2F2F7] border border-transparent rounded-xl text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-mono bg-[#1E3A5F] text-white px-2 py-0.5 rounded text-[10px]">{h.time}</span>
                    <span className="font-medium text-[var(--maru-text)]">{h.title}</span>
                  </div>
                  <span className="text-[var(--maru-text-muted)] text-[11px]">{h.frequency}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <input
                type="text"
                value={customHabitTitle}
                onChange={(e) => setCustomHabitTitle(e.target.value)}
                placeholder="Agregar hábito personal (ej: Meditación 10 min)..."
                className="flex-1 px-3 py-2 bg-[#F2F2F7]/50 border border-transparent rounded-xl text-xs"
              />
              <button
                type="button"
                onClick={() => {
                  if (!customHabitTitle.trim()) return;
                  const newH: Habit = {
                    id: `h-custom-${Date.now()}`,
                    title: customHabitTitle.trim(),
                    time: '08:00',
                    frequency: 'Diario',
                    completed: false,
                    streak: 0,
                    category: 'custom'
                  };
                  setHabits([...habits, newH]);
                  setCustomHabitTitle('');
                }}
                className="px-4 py-2 bg-[#5A8F6B] text-white rounded-xl text-xs font-medium"
              >
                + Añadir
              </button>
            </div>
          </div>
        )}

        {/* PASO 7: AGENTES */}
        {step === 7 && (
          <div className="space-y-5">
            <div className="border-b border-transparent pb-4">
              <h2 className="text-xl font-serif font-bold text-[var(--maru-text)] flex items-center gap-2">
                <Users className="text-[#4A9B9D]" size={22} />
                Paso 7: Elegir Tus Compañeros
              </h2>
              <p className="text-xs text-[var(--maru-text-muted)] mt-1">
                Los 7 Agentes de MARU OS están disponibles para ti. Puedes seleccionar tus preferidos.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
              {AGENTS_CATALOG.map((agent) => {
                const isChecked = selectedAgentIds.includes(agent.id);
                return (
                  <div
                    key={agent.id}
                    onClick={() => {
                      if (isChecked) {
                        setSelectedAgentIds(selectedAgentIds.filter(id => id !== agent.id));
                      } else {
                        setSelectedAgentIds([...selectedAgentIds, agent.id]);
                      }
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isChecked
                        ? 'border-[#4A9B9D] bg-[#4A9B9D]/10 text-[var(--maru-text)]'
                        : 'border-transparent bg-[#F2F2F7]/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-sm flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: agent.colorAccent }} />
                        {agent.name} <span className="text-xs font-normal text-[var(--maru-text-muted)]">({agent.specialty.split('&')[0]})</span>
                      </div>
                      <input type="checkbox" checked={isChecked} readOnly className="accent-[#4A9B9D]" />
                    </div>
                    <p className="text-[11px] text-[var(--maru-text-muted)] mt-1 italic font-serif">"{agent.catchphrase}"</p>
                  </div>
                );
              })}
            </div>

            <label className="flex items-center gap-3 p-3 bg-[#F2F2F7] border border-transparent rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={autoRouting}
                onChange={(e) => setAutoRouting(e.target.checked)}
                className="accent-[#4A9B9D]"
              />
              <span className="text-xs text-[var(--maru-text)]">
                <strong>Selección automática inteligente:</strong> MARU activará al agente adecuado según el tema de tu mensaje.
              </span>
            </label>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-transparent">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-2 px-4 py-2.5 border border-transparent rounded-xl text-xs font-medium text-[var(--maru-text)] hover:bg-[#F2F2F7]"
            >
              <ArrowLeft size={16} />
              Anterior
            </button>
          ) : <div />}

          {step < 7 ? (
            <button
              type="button"
              onClick={() => {
                if (step === 2 && !seedSaved) {
                  alert('Por favor confirma haber guardado tu frase de recuperación.');
                  return;
                }
                setStep(step + 1);
              }}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#1E3A5F] hover:bg-[#2C3E50] text-white rounded-xl text-xs font-medium transition-colors shadow"
            >
              Continuar
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinishOnboarding}
              className="flex items-center gap-2 px-6 py-3 bg-[#4A9B9D] hover:bg-[#3A8B8D] text-white rounded-xl text-sm font-bold shadow-lg transition-all transform hover:scale-105"
            >
              <CheckCircle2 size={18} />
              Comenzar a Usar MARU OS
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
