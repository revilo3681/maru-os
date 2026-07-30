import React, { useState } from 'react';
import { HeartPulse, Pill, Thermometer, Brain, CheckCircle2 } from 'lucide-react';
import { ChatView } from '../chat/ChatView';
import { UserProfile, HealthProfile, LocationProfile } from '../../types';
import { ApiService } from '../../services/apiService';

interface HealthViewProps {
  userProfile: UserProfile;
  healthProfile: HealthProfile;
  locationProfile: LocationProfile;
}

export const HealthView: React.FC<HealthViewProps> = ({ userProfile, healthProfile, locationProfile }) => {
  const [activeTab, setActiveTab] = useState<'aya' | 'sumaq'>('aya');

  return (
    <div className="flex h-full w-full bg-[#F5F1E8]">
      {/* Left side: Chat with Aya or Sumaq */}
      <div className="w-1/2 border-r border-[#2C3E50]/20 flex flex-col">
        {/* Simple Tab Switcher */}
        <div className="flex items-center gap-2 p-2 border-b border-[#E3DCCB] bg-white">
          <button
            onClick={() => setActiveTab('aya')}
            className={`flex-1 p-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'aya' ? 'bg-[#1E3A5F] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
          >
            Aya (Salud Física)
          </button>
          <button
            onClick={() => setActiveTab('sumaq')}
            className={`flex-1 p-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'sumaq' ? 'bg-[#3A2E39] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
          >
            Sumaq (Bienestar Mental)
          </button>
        </div>
        <div className="flex-1 relative">
          {activeTab === 'aya' ? (
            <ChatView 
              activeAgentId="aya" 
              onSelectAgent={() => {}} 
              userProfile={userProfile}
              healthProfile={healthProfile}
              locationProfile={locationProfile}
            />
          ) : (
            <ChatView 
              activeAgentId="sumaq" 
              onSelectAgent={() => {}} 
              userProfile={userProfile}
              healthProfile={healthProfile}
              locationProfile={locationProfile}
            />
          )}
        </div>
      </div>

      {/* Right side: Medical Profile Dashboard */}
      <div className="w-1/2 flex flex-col overflow-y-auto bg-white p-6">
        <div className="flex items-center gap-3 text-[#1E3A5F] mb-6">
          <HeartPulse size={28} className="text-red-500" />
          <h1 className="text-2xl font-serif font-bold">Perfil de Salud & Bienestar</h1>
        </div>

        <div className="space-y-6">
          <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 shadow-sm">
            <h3 className="font-bold text-[#1E3A5F] mb-3 flex items-center gap-2">
              <Thermometer size={18} className="text-orange-500" /> Alergias Conocidas
            </h3>
            <div className="flex flex-wrap gap-2">
              {(healthProfile?.allergies || []).map(allergy => (
                <span key={allergy} className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold border border-red-200">
                  {allergy}
                </span>
              ))}
            </div>
            <p className="text-[10px] text-gray-400 mt-3 font-mono">Actualizado en Grafo Neo4j Local</p>
          </div>

          <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 shadow-sm">
            <h3 className="font-bold text-[#1E3A5F] mb-3 flex items-center gap-2">
              <Pill size={18} className="text-blue-500" /> Medicación Actual
            </h3>
            <div className="space-y-2">
              {(healthProfile?.currentMedications || []).map(med => (
                <div key={med.name} className="flex justify-between items-center bg-[#F5F1E8] p-3 rounded-lg border border-gray-100">
                  <div className="font-bold text-[#2C3E50] text-sm">{med.name}</div>
                  <div className="text-xs text-gray-500 bg-[#E3DCCB]/40 px-2 py-1 rounded-md">{med.dose}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl border border-gray-200 bg-[#3A2E39]/5 shadow-sm">
            <h3 className="font-bold text-[#3A2E39] mb-3 flex items-center gap-2">
              <Brain size={18} className="text-[#3A2E39]" /> Estado de Bienestar (Sumaq)
            </h3>
            <div className="space-y-3 text-sm text-[#2C3E50]">
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <span>Horas de sueño promedio:</span>
                <span className="font-bold">6.5 hrs</span>
              </div>
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <span>Nivel de estrés reportado:</span>
                <span className="font-bold text-orange-500">Moderado</span>
              </div>
              <div className="flex justify-between">
                <span>Última meditación:</span>
                <span className="font-bold text-gray-500">Ayer, 10 min</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
