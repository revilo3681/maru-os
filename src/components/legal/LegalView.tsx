import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Scale, UploadCloud, FileText, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { ChatView } from '../chat/ChatView';
import { UserProfile, HealthProfile, LocationProfile } from '../../types';
import { ApiService } from '../../services/apiService';

interface LegalViewProps {
  userProfile: UserProfile;
  healthProfile: HealthProfile;
  locationProfile: LocationProfile;
}

interface VaultDoc {
  id: string;
  name: string;
  charCount?: number;
  chunkCount?: number;
  indexedAt?: string;
  preview?: string;
  sizeLabel?: string;
}

export const LegalView: React.FC<LegalViewProps> = ({ userProfile, healthProfile, locationProfile }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<VaultDoc[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshDocs = useCallback(async () => {
    setLoadingList(true);
    const res = await ApiService.listLegalDocuments('inti');
    if (res?.documents) {
      setUploadedFiles(
        res.documents.map((d) => ({
          ...d,
          sizeLabel: d.charCount
            ? `${Math.max(1, Math.round(d.charCount / 1024))} KB texto · ${d.chunkCount || 1} chunks`
            : undefined
        }))
      );
    }
    setLoadingList(false);
  }, []);

  useEffect(() => {
    refreshDocs();
  }, [refreshDocs]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 12 * 1024 * 1024) {
      setUploadError('El archivo supera 12 MB.');
      e.target.value = '';
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataBase64 = event.target?.result as string;
      let type = 'pdf';
      if (file.type.startsWith('image/')) type = 'image';
      else if (file.type.startsWith('text/') || /\.(txt|md|csv)$/i.test(file.name)) type = 'text';

      const res = await ApiService.uploadLegalDocument({
        name: file.name,
        mimeType: file.type || 'application/pdf',
        type,
        dataBase64,
        agentId: 'inti',
        sizeFormatted: `${(file.size / (1024 * 1024)).toFixed(2)} MB`
      });

      setIsUploading(false);
      if (!res || res.status === 'error') {
        setUploadError(res?.message || 'Backend offline. No se pudo indexar el documento.');
      } else {
        await refreshDocs();
      }
    };
    reader.onerror = () => {
      setIsUploading(false);
      setUploadError('No se pudo leer el archivo.');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="flex flex-col xl:flex-row h-full w-full overflow-y-auto xl:overflow-hidden bg-[var(--maru-bg)]">
      <div className="w-full xl:w-1/2 min-h-[620px] xl:min-h-0 border-b xl:border-b-0 xl:border-r border-[var(--maru-border-soft)] flex flex-col">
        <ChatView
          activeAgentId="inti"
          onSelectAgent={() => {}}
          userProfile={userProfile}
          healthProfile={healthProfile}
          locationProfile={locationProfile}
        />
      </div>

      <div className="w-full xl:w-1/2 flex flex-col overflow-y-auto bg-[var(--maru-surface)] p-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 text-[#B8924A]">
            <Scale size={28} />
            <h1 className="text-2xl font-display font-bold text-[var(--maru-text)]">Bóveda legal y documental</h1>
          </div>
          <button
            onClick={() => refreshDocs()}
            className="p-2 rounded-xl border border-[var(--maru-border-soft)] text-[var(--maru-text-muted)] hover:text-[var(--maru-text)]"
            title="Actualizar lista"
          >
            <RefreshCw size={16} className={loadingList ? 'animate-spin' : ''} />
          </button>
        </div>
        <p className="text-sm text-[var(--maru-text-muted)] mb-6">
          Sube contratos, normativas o PDFs. Inti los indexa en la bóveda local (RAG) y puede citarlos en el chat.
        </p>

        <div
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className="border border-dashed border-[var(--maru-gold)] rounded-[var(--maru-radius)] p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-[var(--maru-surface-muted)] transition-colors mb-4"
        >
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".pdf,.doc,.docx,.txt,.md,image/*"
            onChange={handleFileUpload}
          />
          {isUploading ? (
            <div className="flex flex-col items-center gap-3 text-[#B8924A] animate-pulse">
              <UploadCloud size={32} />
              <p className="font-bold">Extrayendo texto e indexando en bóveda local…</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 text-gray-400">
              <UploadCloud size={32} className="text-[#B8924A]" />
              <p className="font-bold text-[#2C3E50]">Haz clic para subir un documento</p>
              <p className="text-xs">PDF, imagen (OCR) o texto · máx. 12 MB</p>
            </div>
          )}
        </div>

        {uploadError && (
          <div className="mb-4 flex items-start gap-2 p-3 rounded-xl bg-[#C0392B]/10 border border-[#C0392B]/30 text-xs text-[#C0392B]">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{uploadError}</span>
          </div>
        )}

        <div>
          <h3 className="font-bold text-[#1E3A5F] mb-4 text-sm uppercase tracking-wider">
            Documentos indexados {uploadedFiles.length > 0 ? `(${uploadedFiles.length})` : ''}
          </h3>
          {loadingList && uploadedFiles.length === 0 ? (
            <p className="text-xs text-[var(--maru-text-muted)]">Cargando bóveda…</p>
          ) : uploadedFiles.length === 0 ? (
            <p className="text-xs text-[var(--maru-text-muted)]">
              Aún no hay documentos. Sube un PDF o adjunta uno en el chat con Inti.
            </p>
          ) : (
            <div className="space-y-3">
              {uploadedFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-4 bg-[var(--maru-surface-muted)] border border-[var(--maru-border-soft)] rounded-xl"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 bg-[#B8924A]/10 rounded-lg text-[#B8924A] shrink-0">
                      <FileText size={20} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-[#2C3E50] text-sm truncate">{file.name}</h4>
                      <p className="text-xs text-gray-500">
                        {file.sizeLabel || 'Indexado'} · RAG local
                      </p>
                      {file.preview && (
                        <p className="text-[11px] text-[var(--maru-text-muted)] mt-1 line-clamp-2">{file.preview}</p>
                      )}
                    </div>
                  </div>
                  <CheckCircle2 size={18} className="text-green-500 shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
