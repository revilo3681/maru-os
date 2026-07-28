import React from 'react';
import { AlertTriangle, PhoneCall, ShieldCheck, MapPin, X } from 'lucide-react';
import { AudioService } from '../../services/audioService';

interface EmergencyOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  city?: string;
  riskPercent?: number;
  safeZoneName?: string;
  safeZoneDist?: string;
}

export const EmergencyOverlay: React.FC<EmergencyOverlayProps> = ({
  isOpen,
  onClose,
  city = 'Chosica',
  riskPercent = 85,
  safeZoneName = 'I.E. 123 - Av. Lima Sur 450',
  safeZoneDist = '500m'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#C0392B]/85 backdrop-blur-md flex items-center justify-center p-4 text-white animate-fade-in">
      <div className="bg-[#1E3A5F] border-2 border-white/30 rounded-2xl p-6 sm:p-8 w-full max-w-lg shadow-2xl space-y-6 relative overflow-hidden">
        {/* Close / Minimize button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10"
        >
          <X size={20} />
        </button>

        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-[#C0392B] text-white flex items-center justify-center mx-auto shadow-lg animate-pulse">
            <AlertTriangle size={36} />
          </div>

          <div className="inline-block px-3 py-1 bg-[#C0392B] text-white text-xs font-mono rounded-full font-bold uppercase tracking-wider">
            🌋 ALERTA DE RIESGO DE HUAICO EN {city.toUpperCase()}
          </div>

          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white">
            Riesgo Estimado: {riskPercent}%
          </h2>
          <p className="text-sm text-white/90">
            Tupac (Guardián de Emergencias): Aléjate de ríos y quebradas secas. Mantén la calma y dirígete a tu zona segura predeterminada.
          </p>
        </div>

        {/* Safe Zone Box */}
        <div className="bg-white/10 border border-white/20 p-4 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono uppercase text-[#4A9B9D]">
            <MapPin size={16} />
            <span>Zona Segura Identificada</span>
          </div>
          <div className="font-bold text-lg text-white">{safeZoneName}</div>
          <p className="text-xs text-white/80">Distancia aproximada: {safeZoneDist}</p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => {
              AudioService.speakText('Me alegra que estés a salvo en Chosica.', 'tupac');
              onClose();
            }}
            className="w-full py-3 bg-[#5A8F6B] hover:bg-[#4A7F5B] text-white font-bold rounded-xl text-sm transition-colors shadow-lg flex items-center justify-center gap-2"
          >
            <ShieldCheck size={18} />
            [ ESTOY A SALVO ]
          </button>

          <a
            href="tel:116"
            className="w-full py-3 bg-[#C0392B] hover:bg-red-700 text-white font-bold rounded-xl text-sm transition-colors shadow-lg flex items-center justify-center gap-2 block text-center"
          >
            <PhoneCall size={18} />
            LLAMAR A BOMBEROS / SAMU (116)
          </a>
        </div>
      </div>
    </div>
  );
};
