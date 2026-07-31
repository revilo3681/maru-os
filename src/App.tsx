import React, { useState, useEffect, useRef } from 'react';
import { StorageService } from './services/storageService';
import { AudioService } from './services/audioService';
import { EngineConfigProvider, useEngineConfig } from './context/EngineConfigContext';
import { AGENT_PANEL_TAB } from './data/agentVoices';
import { AgentId, UserProfile, HealthProfile, LocationProfile } from './types';
import { LandingPage } from './components/landing/LandingPage';
import { OnboardingWizard } from './components/onboarding/OnboardingWizard';
import { Sidebar } from './components/navigation/Sidebar';
import { DashboardView } from './components/dashboard/DashboardView';
import { ChatView } from './components/chat/ChatView';
import { AgentsView } from './components/agents/AgentsView';
import { MemoryView } from './components/memory/MemoryView';
import { CalendarView } from './components/calendar/CalendarView';
import { SettingsView } from './components/settings/SettingsView';
import { NotesView } from './components/notes/NotesView';
import { KipuView } from './components/kipu/KipuView';
import { PachaView } from './components/pacha/PachaView';
import { HealthView } from './components/health/HealthView';
import { LegalView } from './components/legal/LegalView';
import { EmergencyView } from './components/emergency/EmergencyView';
import { YakuView } from './components/yaku/YakuView';
import { MailView } from './components/mail/MailView';
import { AmbientMusicDock } from './components/music/AmbientMusicDock';
import { LoginModal } from './components/auth/LoginModal';
import { RecoveryModal } from './components/auth/RecoveryModal';
import { EmergencyOverlay } from './components/emergency/EmergencyOverlay';

/**
 * Saludo hablado de bienvenida (item 17): variantes cortas según la hora del día
 * y, si hay, los hábitos pendientes. Solo voz, sin banner en pantalla.
 */
function buildWelcomeGreeting(name: string, pendingHabits: number): string {
  const hour = new Date().getHours();
  let variants: string[];
  if (hour >= 5 && hour < 12) {
    variants = [
      `Buenos días, ${name}. Que tengas un gran comienzo.`,
      `Buenos días, ${name}. Bienvenido de vuelta.`,
      `Buenos días, ${name}. Aquí estoy para lo que necesites.`
    ];
  } else if (hour >= 12 && hour < 18) {
    variants = [
      `Buenas tardes, ${name}. ¿Cómo va tu día?`,
      `Buenas tardes, ${name}. Bienvenido de vuelta.`,
      `Hola, ${name}. Espero que estés teniendo una buena tarde.`
    ];
  } else {
    variants = [
      `Buenas noches, ${name}. ¿Qué tal tu día?`,
      `Buenas noches, ${name}. Bienvenido de vuelta.`,
      `Hola, ${name}. Que tengas una noche tranquila.`
    ];
  }
  let greeting = variants[Math.floor(Math.random() * variants.length)];
  if (pendingHabits > 0) {
    greeting += pendingHabits === 1
      ? ' Te queda un hábito pendiente hoy.'
      : ` Tienes ${pendingHabits} hábitos pendientes hoy.`;
  }
  return greeting;
}

function AppShell() {
  const [currentTab, setCurrentTab] = useState<string>('landing');
  const [activeAgentId, setActiveAgentId] = useState<AgentId>('aya');
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRecoveryOpen, setIsRecoveryOpen] = useState(false);
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);
  const { enabledAgents } = useEngineConfig();

  // Loaded user profiles
  const [userProfile, setUserProfile] = useState<UserProfile>(() => StorageService.getProfile());
  const [healthProfile, setHealthProfile] = useState<HealthProfile>(() => StorageService.getHealth());
  const [locationProfile, setLocationProfile] = useState<LocationProfile>(() => StorageService.getLocation());
  const [settings, setSettings] = useState(() => StorageService.getSettings());

  useEffect(() => {
    if (StorageService.isOnboarded() && currentTab === 'landing') {
      setCurrentTab('dashboard');
    }
  }, [currentTab]);

  // Si el agente activo o su panel fueron desactivados, redirigir
  useEffect(() => {
    if (!enabledAgents.includes(activeAgentId)) {
      const fallback = enabledAgents[0] || 'aya';
      setActiveAgentId(fallback);
    }
    const panelAgents = Object.entries(AGENT_PANEL_TAB).filter(([, tab]) => tab === currentTab);
    if (panelAgents.length > 0 && !panelAgents.some(([id]) => enabledAgents.includes(id as AgentId))) {
      setCurrentTab('dashboard');
    }
    if (currentTab === 'habits') setCurrentTab('calendar');
  }, [enabledAgents, activeAgentId, currentTab]);

  // ── Saludo hablado al entrar a la app (una sola vez por entrada) ──
  const hasGreetedRef = useRef(false);
  const isInAppShell = currentTab !== 'landing' && currentTab !== 'onboarding';

  useEffect(() => {
    if (!isInAppShell) {
      // Al volver a la landing (logout), se rearma el saludo para la próxima entrada
      hasGreetedRef.current = false;
      return;
    }
    if (hasGreetedRef.current) return; // no repetir en cambios de pestaña
    hasGreetedRef.current = true;

    // Respetar el ajuste de lectura de voz: si está apagado, silencio total
    if (!StorageService.getSettings().voiceReadoutEnabled) return;

    const name = StorageService.getProfile().name || 'Oliver';
    const pendingHabits = StorageService.getHabits().filter((h) => !h.completed).length;
    const greeting = buildWelcomeGreeting(name, pendingHabits);

    // Pequeña espera para que el shell termine de montar antes de hablar
    const timer = setTimeout(() => AudioService.speakGreeting(greeting, 'aya'), 900);
    return () => clearTimeout(timer);
  }, [isInAppShell]);

  const refreshUserData = () => {
    setUserProfile(StorageService.getProfile());
    setHealthProfile(StorageService.getHealth());
    setLocationProfile(StorageService.getLocation());
    setSettings(StorageService.getSettings());
  };

  const handleOnboardingComplete = () => {
    refreshUserData();
    setCurrentTab('dashboard');
  };

  const handleLoginSuccess = () => {
    setIsLoginOpen(false);
    refreshUserData();
    setCurrentTab('dashboard');
  };

  const handleWipeData = () => {
    refreshUserData();
    setCurrentTab('landing');
  };

  const handleLogout = () => {
    setCurrentTab('landing');
  };

  const _navigateToChat = (_prompt?: string) => {
    setCurrentTab('chat');
  };

  return (
    <div className="min-h-screen bg-[var(--maru-bg)] text-[var(--maru-text)] font-sans antialiased flex flex-col md:flex-row overflow-hidden relative">
      {/* Landing Page Route */}
      {currentTab === 'landing' && (
        <div className="w-full h-screen overflow-y-auto">
          <LandingPage
            onStartOnboarding={() => setCurrentTab('onboarding')}
            onOpenLogin={() => setIsLoginOpen(true)}
          />
        </div>
      )}

      {/* Onboarding Ritual Route */}
      {currentTab === 'onboarding' && (
        <div className="w-full h-screen overflow-y-auto z-10">
          <OnboardingWizard onComplete={handleOnboardingComplete} />
        </div>
      )}

      {/* App Main Shell (Sidebar + Main Content View) */}
      {currentTab !== 'landing' && currentTab !== 'onboarding' && (
        <div className="maru-app-view flex w-full h-screen overflow-hidden z-10">
          <Sidebar
            currentTab={currentTab}
            onSelectTab={(tab) => setCurrentTab(tab)}
            activeAgentId={activeAgentId}
            onSelectAgent={(id) => setActiveAgentId(id)}
            isEphemeralMode={settings.ephemeralMode}
            onLogout={handleLogout}
          />

          <main className="flex-1 flex flex-col h-full overflow-hidden relative">
            {currentTab === 'dashboard' && (
              <DashboardView
                userProfile={userProfile}
                healthProfile={healthProfile}
                locationProfile={locationProfile}
                onNavigateToChat={_navigateToChat}
                onTriggerEmergency={() => setIsEmergencyOpen(true)}
              />
            )}

            <div style={{ display: currentTab === 'chat' ? 'flex' : 'none', flex: 1, height: '100%' }}>
              <ChatView
                activeAgentId={activeAgentId}
                onSelectAgent={(id) => setActiveAgentId(id)}
                userProfile={userProfile}
                healthProfile={healthProfile}
                locationProfile={locationProfile}
              />
            </div>

            {currentTab === 'agents' && (
              <AgentsView
                activeAgentId={activeAgentId}
                onSelectAgent={(id) => setActiveAgentId(id)}
                onNavigateToChat={() => setCurrentTab('chat')}
              />
            )}

            {currentTab === 'memory' && <MemoryView />}

            {currentTab === 'calendar' && <CalendarView />}

            {currentTab === 'notes' && <NotesView />}

            {currentTab === 'mail' && <MailView />}

            {currentTab === 'kipu' && (
              <KipuView 
                userProfile={userProfile}
                healthProfile={healthProfile}
                locationProfile={locationProfile}
              />
            )}

            {currentTab === 'pacha' && (
              <PachaView 
                userProfile={userProfile}
                healthProfile={healthProfile}
                locationProfile={locationProfile}
              />
            )}

            {currentTab === 'health' && (
              <HealthView 
                userProfile={userProfile}
                healthProfile={healthProfile}
                locationProfile={locationProfile}
              />
            )}

            {currentTab === 'legal' && (
              <LegalView 
                userProfile={userProfile}
                healthProfile={healthProfile}
                locationProfile={locationProfile}
              />
            )}

            {currentTab === 'emergency' && (
              <EmergencyView 
                userProfile={userProfile}
                healthProfile={healthProfile}
                locationProfile={locationProfile}
              />
            )}

            {currentTab === 'yaku' && (
              <YakuView
                userProfile={userProfile}
                healthProfile={healthProfile}
                locationProfile={locationProfile}
              />
            )}

            {currentTab === 'settings' && (
              <SettingsView onWipeData={handleWipeData} />
            )}
          </main>
        </div>
      )}

      {/* Login & Recovery Modals */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onSuccess={handleLoginSuccess}
        onOpenRecovery={() => setIsRecoveryOpen(true)}
      />

      <RecoveryModal
        isOpen={isRecoveryOpen}
        onClose={() => setIsRecoveryOpen(false)}
        onSuccess={() => {
          setIsRecoveryOpen(false);
          setIsLoginOpen(true);
        }}
      />

      {currentTab !== 'landing' && currentTab !== 'onboarding' && <AmbientMusicDock />}

      {/* Emergency Huaico / Sismo Overlay */}
      <EmergencyOverlay
        isOpen={isEmergencyOpen}
        onClose={() => setIsEmergencyOpen(false)}
        city={locationProfile.city}
        riskPercent={85}
        safeZoneName="I.E. 123 - Av. Lima Sur 450"
        safeZoneDist="500m"
      />
    </div>
  );
}

export function App() {
  return (
    <EngineConfigProvider>
      <AppShell />
    </EngineConfigProvider>
  );
}

export default App;
