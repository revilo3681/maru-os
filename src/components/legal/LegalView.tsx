import React, { useState, useRef } from 'react';
import { Scale, UploadCloud, FileText, CheckCircle2 } from 'lucide-react';
import { ChatView } from '../chat/ChatView';
import { UserProfile, HealthProfile, LocationProfile } from '../../types';

interface LegalViewProps {
  userProfile: UserProfile;
  healthProfile: HealthProfile;
  locationProfile: LocationProfile;
}

export const LegalView: React.FC<LegalViewProps> = ({ userProfile, healthProfile, locationProfile }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{name: string, size: string}[]>([
    { name: "Contrato_Arrendamiento.pdf", size: "1.2 MB" },
    { name: "Ley_29571_Consumidor.pdf", size: "4.5 MB" }
  ]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      // Simulate upload and vectorization
      setTimeout(() => {
        setUploadedFiles(prev => [{
          name: file.name,
          size: `${(file.size / 1024 / 1024).toFixed(2)} MB`
        }, ...prev]);
        setIsUploading(false);
      }, 1500);
    }
  };

  return (
    <div className="flex h-full w-full bg-[#F5F1E8]">
      {/* Left side: Inti Chat */}
      <div className="w-1/2 border-r border-[#2C3E50]/20 flex flex-col">
        <ChatView 
          activeAgentId="inti" 
          onSelectAgent={() => {}} 
          userProfile={userProfile}
          healthProfile={healthProfile}
          locationProfile={locationProfile}
        />
      </div>

      {/* Right side: Vault & Document Upload */}
      <div className="w-1/2 flex flex-col overflow-y-auto bg-white p-6">
        <div className="flex items-center gap-3 text-[#B8924A] mb-6">
          <Scale size={28} />
          <h1 className="text-2xl font-serif font-bold text-[#1E3A5F]">Bóveda Legal & Documental</h1>
        </div>
        <p className="text-sm text-gray-500 mb-6">Sube tus documentos legales, contratos o normativas en PDF. Inti los procesará y podrás hacerle consultas precisas (Búsqueda Semántica RAG).</p>

        {/* Upload Area */}
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-[#B8924A]/50 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-[#B8924A]/5 transition-colors mb-8"
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".pdf,.doc,.docx"
            onChange={handleFileUpload}
          />
          {isUploading ? (
            <div className="flex flex-col items-center gap-3 text-[#B8924A] animate-pulse">
              <UploadCloud size={32} />
              <p className="font-bold">Vectorizando documento en Qdrant...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 text-gray-400">
              <UploadCloud size={32} className="text-[#B8924A]" />
              <p className="font-bold text-[#2C3E50]">Haz clic para subir un documento PDF</p>
              <p className="text-xs">Límite de tamaño: 10MB (Local RAG)</p>
            </div>
          )}
        </div>

        {/* Uploaded Documents */}
        <div>
          <h3 className="font-bold text-[#1E3A5F] mb-4 text-sm uppercase tracking-wider">Documentos Indexados</h3>
          <div className="space-y-3">
            {uploadedFiles.map((file, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-xl hover:shadow-sm transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#B8924A]/10 rounded-lg text-[#B8924A]">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#2C3E50] text-sm">{file.name}</h4>
                    <p className="text-xs text-gray-500">{file.size} · Vectorizado en Qdrant</p>
                  </div>
                </div>
                <CheckCircle2 size={18} className="text-green-500" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
