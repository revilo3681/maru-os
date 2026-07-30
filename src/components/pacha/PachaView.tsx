import React, { useState, useEffect } from 'react';
import { CloudRain, Wind, Thermometer, AlertTriangle, Navigation, Map as MapIcon, Activity } from 'lucide-react';
import { ChatView } from '../chat/ChatView';
import { UserProfile, HealthProfile, LocationProfile } from '../../types';
import { ApiService } from '../../services/apiService';

interface PachaViewProps {
  userProfile: UserProfile;
  healthProfile: HealthProfile;
  locationProfile: LocationProfile;
}

export const PachaView: React.FC<PachaViewProps> = ({ userProfile, healthProfile, locationProfile }) => {
  const [peruData, setPeruData] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      const data = await ApiService.getPeruData(locationProfile.city);
      if (data) {
        setPeruData(data);
      }
    };
    loadData();
  }, [locationProfile.city]);

  return (
    <div className="flex h-full w-full bg-[#F5F1E8]">
      {/* Left side: Pacha Chat */}
      <div className="w-1/2 border-r border-[#2C3E50]/20 flex flex-col">
        <ChatView 
          activeAgentId="pacha" 
          onSelectAgent={() => {}} 
          userProfile={userProfile}
          healthProfile={healthProfile}
          locationProfile={locationProfile}
        />
      </div>

      {/* Right side: Environment Dashboard */}
      <div className="w-1/2 flex flex-col overflow-y-auto bg-white">
        <div className="p-6 border-b border-[#2C3E50]/10 bg-gradient-to-br from-[#4A9B9D]/10 to-transparent">
          <div className="flex items-center gap-3 text-[#1E3A5F]">
            <CloudRain size={28} />
            <h1 className="text-2xl font-serif font-bold">Monitor Ambiental</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
            <Navigation size={14} /> {locationProfile.city}, Perú
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Weather Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-[#4A9B9D]/20 bg-[#F5F1E8]/50 flex flex-col items-center justify-center text-center">
              <Thermometer size={24} className="text-[#4A9B9D] mb-2" />
              <div className="text-2xl font-bold text-[#2C3E50]">{peruData?.weather?.temperatura || '22°C'}</div>
              <div className="text-xs text-gray-500 font-mono">Sensación: {peruData?.weather?.sensacion || '24°C'}</div>
            </div>
            <div className="p-4 rounded-xl border border-[#4A9B9D]/20 bg-[#F5F1E8]/50 flex flex-col items-center justify-center text-center">
              <Wind size={24} className="text-[#4A9B9D] mb-2" />
              <div className="text-2xl font-bold text-[#2C3E50]">{peruData?.weather?.humedad || '85%'}</div>
              <div className="text-xs text-gray-500 font-mono">Humedad (Llovizna)</div>
            </div>
          </div>

          {/* Risk Alerts */}
          <div className="space-y-4">
            <h3 className="font-bold text-[#1E3A5F] flex items-center gap-2">
              <AlertTriangle size={18} className="text-[#B8924A]" />
              Alertas Locales (Simuladas)
            </h3>
            
            <div className="p-4 rounded-xl border border-red-200 bg-red-50 flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} className="text-red-600" />
              </div>
              <div>
                <h4 className="font-bold text-red-900 text-sm">Riesgo de Huaico - {locationProfile.city}</h4>
                <p className="text-xs text-red-700 mt-1">
                  Nivel de riesgo: {peruData?.huaico?.riesgo || 'Alto (85%)'}. Se recomienda identificar rutas de evacuación.
                </p>
                <div className="text-[10px] text-red-600 font-mono mt-2 flex items-center gap-1">
                  <Activity size={12} /> Actualizado: {peruData?.huaico?.actualizado || 'Hace 10 min'}
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <Activity size={20} className="text-amber-600" />
              </div>
              <div>
                <h4 className="font-bold text-amber-900 text-sm">Último Sismo (IGP)</h4>
                <p className="text-xs text-amber-800 mt-1">
                  Magnitud: {peruData?.sismo?.magnitud || '4.2'} - {peruData?.sismo?.referencia || 'Lima, Lima'}
                </p>
                <div className="text-[10px] text-amber-700 font-mono mt-2">
                  Profundidad: {peruData?.sismo?.profundidad || '45 km'}
                </div>
              </div>
            </div>
          </div>

          {/* Map Mock */}
          <div className="mt-6">
            <h3 className="font-bold text-[#1E3A5F] flex items-center gap-2 mb-3">
              <MapIcon size={18} className="text-[#4A9B9D]" />
              Mapa de Tráfico y Clima
            </h3>
            <div className="w-full h-48 bg-gray-200 rounded-xl overflow-hidden relative flex items-center justify-center border border-gray-300">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Relief_Map_of_Peru.png/600px-Relief_Map_of_Peru.png" 
                alt="Mapa de Perú"
                className="w-full h-full object-cover opacity-60"
              />
              <div className="absolute inset-0 bg-[#4A9B9D]/10"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                <div className="w-4 h-4 bg-red-500 rounded-full animate-ping absolute"></div>
                <div className="w-4 h-4 bg-red-600 rounded-full relative shadow-lg"></div>
                <span className="bg-white/90 px-2 py-1 rounded text-xs font-bold shadow-sm mt-2 text-gray-800">
                  {locationProfile.city}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
