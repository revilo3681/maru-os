import React, { useState } from 'react';
import { ShieldAlert, PhoneCall, Navigation, Activity } from 'lucide-react';
import { ChatView } from '../chat/ChatView';
import { UserProfile, HealthProfile, LocationProfile } from '../../types';

interface EmergencyViewProps {
  userProfile: UserProfile;
  healthProfile: HealthProfile;
  locationProfile: LocationProfile;
}

export const EmergencyView: React.FC<EmergencyViewProps> = ({ userProfile, healthProfile, locationProfile }) => {
  const [isAlertActive, setIsAlertActive] = useState(false);

  return (
    <div className="flex h-full w-full bg-[#F5F1E8]">
      {/* Left side: Tupac Chat */}
      <div className="w-1/2 border-r border-[#2C3E50]/20 flex flex-col">
        <ChatView 
          activeAgentId="tupac" 
          onSelectAgent={() => {}} 
          userProfile={userProfile}
          healthProfile={healthProfile}
          locationProfile={locationProfile}
        />
      </div>

      {/* Right side: Emergency Dashboard */}
      <div className="w-1/2 flex flex-col overflow-y-auto bg-black text-white p-8">
        <div className="flex flex-col items-center justify-center mb-10">
          <button 
            onClick={() => setIsAlertActive(!isAlertActive)}
            className={`w-48 h-48 rounded-full flex flex-col items-center justify-center gap-3 transition-all ${isAlertActive ? 'bg-red-600 animate-pulse scale-105 shadow-[0_0_50px_rgba(220,38,38,0.6)]' : 'bg-[#4A1512] hover:bg-red-800 border-4 border-red-900/50'}`}
          >
            <ShieldAlert size={48} className={isAlertActive ? 'text-white' : 'text-red-500'} />
            <span className="font-bold text-xl tracking-widest">{isAlertActive ? 'ALERTA ACTIVA' : 'S.O.S'}</span>
            <span className="text-[10px] opacity-70">Mantén presionado</span>
          </button>
        </div>

        {isAlertActive && (
          <div className="space-y-6 animate-fade-in">
            <div className="p-5 border border-red-500/50 bg-red-950/30 rounded-xl">
              <h3 className="font-bold text-red-500 flex items-center gap-2 mb-2 text-lg">
                <Navigation size={20} /> Protocolo de Evacuación: {locationProfile.city}
              </h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                Tupac ha detectado un riesgo crítico. Dirígete inmediatamente a la **Zona Segura 1 (Plaza de Armas)** o **Zona Segura 2 (Parque Central)**. Evita las zonas cercanas a quebradas o ríos.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button className="flex flex-col items-center justify-center p-4 rounded-xl bg-[#2C3E50] hover:bg-[#34495E] transition-colors border border-gray-700 gap-2">
                <PhoneCall size={24} className="text-blue-400" />
                <span className="font-bold">Llamar 105</span>
                <span className="text-xs text-gray-400">Policía Nacional</span>
              </button>
              <button className="flex flex-col items-center justify-center p-4 rounded-xl bg-[#2C3E50] hover:bg-[#34495E] transition-colors border border-gray-700 gap-2">
                <Activity size={24} className="text-red-400" />
                <span className="font-bold">Llamar 116</span>
                <span className="text-xs text-gray-400">Bomberos / SAMU</span>
              </button>
            </div>
            
            <div className="p-4 rounded-xl bg-yellow-900/20 border border-yellow-700/50 text-yellow-500 text-xs">
              <span className="font-bold">Aviso de Salud:</span> Tu perfil indica alergia severa al Maní. Los rescatistas serán notificados de esta condición si compartes tu ubicación.
            </div>
          </div>
        )}
        
        {!isAlertActive && (
          <div className="text-center text-gray-500 text-sm mt-8">
            <p>Este panel es exclusivo para situaciones de riesgo inminente.</p>
            <p className="mt-2 text-xs">Tupac (gemma4:e2b) procesará tu emergencia de manera local incluso sin internet.</p>
          </div>
        )}
      </div>
    </div>
  );
};
