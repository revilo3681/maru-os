import React from 'react';
import { Mail, Edit2, Send, Trash2 } from 'lucide-react';
import { GmailDraftNotification } from '../../types';

interface GmailDraftCardProps {
  notification: GmailDraftNotification;
  onSend: () => void;
  onEdit: () => void;
  onDiscard: () => void;
}

export const GmailDraftCard: React.FC<GmailDraftCardProps> = ({
  notification,
  onSend,
  onEdit,
  onDiscard
}) => {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-[#4A9B9D]/30 p-4 mb-4 relative overflow-hidden">
      {/* Decorative top border */}
      <div className="absolute top-0 left-0 w-full h-1 bg-[#4A9B9D]" />
      
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-[#1E3A5F]/10 flex items-center justify-center shrink-0">
          <Mail size={20} className="text-[#1E3A5F]" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-[#2C3E50] flex items-center gap-2">
            Borrador de Correo Preparado
            <span className="bg-[#B8924A]/20 text-[#B8924A] text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">
              Prioridad
            </span>
          </h4>
          <p className="text-xs text-gray-500 mt-0.5">
            <strong>De:</strong> {notification.sender} <br />
            <strong>Asunto:</strong> {notification.subject}
          </p>
        </div>
      </div>

      <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-sm text-[#2C3E50] mb-4 font-mono whitespace-pre-wrap">
        {notification.suggestedDraft}
      </div>

      <div className="flex items-center gap-2 justify-end">
        <button 
          onClick={onDiscard}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <Trash2 size={14} /> Descartar
        </button>
        <button 
          onClick={onEdit}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-[#1E3A5F] border border-[#1E3A5F]/20 hover:bg-[#1E3A5F]/5 transition-colors"
        >
          <Edit2 size={14} /> Editar
        </button>
        <button 
          onClick={onSend}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-[#4A9B9D] text-white hover:bg-[#387F81] shadow-sm shadow-[#4A9B9D]/30 transition-colors"
        >
          <Send size={14} /> Enviar (Mock)
        </button>
      </div>
    </div>
  );
};
