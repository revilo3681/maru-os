import React, { useState, useEffect } from 'react';
import { StorageService } from './services/storageService';
import { AgentId, UserProfile, HealthProfile, LocationProfile } from './types';
import { LandingPage } from './components/landing/LandingPage';
import { OnboardingWizard } from './components/onboarding/OnboardingWizard';
import { Sidebar } from './components/navigation/Sidebar';
import { DashboardView } from './components/dashboard/DashboardView';
import { ChatView } from './components/chat/ChatView';
import { AgentsView } from './components/agents/AgentsView';
import { MemoryView } from './components/memory/MemoryView';
import { CalendarView } from './components/calendar/CalendarView';
import { HabitsView } from './components/habits/HabitsView';
import { SettingsView } from './components/settings/SettingsView';
import { NotesView } from './components/notes/NotesView';
import { KipuView } from './components/kipu/KipuView';
import { PachaView } from './components/pacha/PachaView';
import { HealthView } from './components/health/HealthView';
import { LegalView } from './components/legal/LegalView';
import { EmergencyView } from './components/emergency/EmergencyView';
import { LoginModal } from './components/auth/LoginModal';
import { RecoveryModal } from './components/auth/RecoveryModal';
import { EmergencyOverlay } from './components/emergency/EmergencyOverlay';
import { ParticleBackground } from './components/canvas/ParticleBackground';

export function App() {
  const [currentTab, setCurrentTab] = useState<string>('landing');
  const [activeAgentId, setActiveAgentId] = useState<AgentId>('aya');
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRecoveryOpen, setIsRecoveryOpen] = useState(false);
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);

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
      {/* Background Particles — subdued on dark shell */}
      {currentTab !== 'landing' && (
        <ParticleBackground activeAgentId={currentTab === 'chat' ? activeAgentId : undefined} />
      )}

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
        <div className="flex w-full h-screen overflow-hidden z-10">
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

            {currentTab === 'habits' && <HabitsView />}

            {currentTab === 'notes' && <NotesView />}

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

export default App;
