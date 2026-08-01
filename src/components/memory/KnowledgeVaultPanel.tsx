import React, { useEffect, useState } from 'react';
import { Download, FileText, RefreshCw, BookOpen } from 'lucide-react';
import { ApiService } from '../../services/apiService';
import { notifyPanelChange } from '../../services/knowledgeSync';
import { AgentId } from '../../types';

interface PdfEntry {
  id: string;
  title: string;
  filename: string;
  url: string;
  agents: string[];
  documentCount?: number;
  disclaimer?: string;
}

const AGENT_IDS: AgentId[] = ['aya', 'sumaq', 'inti', 'kipu', 'pacha', 'tupac', 'yaku'];

function asAgentId(value?: string): AgentId {
  const v = (value || '').toLowerCase() as AgentId;
  return AGENT_IDS.includes(v) ? v : 'yaku';
}

export const KnowledgeVaultPanel: React.FC = () => {
  const [pdfs, setPdfs] = useState<PdfEntry[]>([]);
  const [kbTotal, setKbTotal] = useState<number | null>(null);
  const [refreshMsg, setRefreshMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const res = await fetch('/kb/pdfs/manifest.json');
      if (res.ok) {
        const data = await res.json();
        setPdfs(Array.isArray(data.pdfs) ? data.pdfs : []);
      }
    } catch {
      /* offline static */
    }
    const live = await ApiService.getKnowledge();
    if (live?.total != null) setKbTotal(live.total);
  };

  useEffect(() => {
    void load();
  }, []);

  const handleRefresh = async () => {
    setBusy(true);
    setRefreshMsg('');
    try {
      const result = await ApiService.refreshKnowledgeRemote();
      if (!result) {
        setRefreshMsg('Backend no disponible. Se mantiene el corpus offline local.');
      } else if (result.status === 'ok') {
        setRefreshMsg(
          `KB actualizada: ${result.merged ?? 0} docs remotos · total activo ${result.documentCount ?? '—'}`
        );
        notifyPanelChange({
          domain: 'settings',
          summary: `Sync remoto KB OK (${result.merged ?? 0} docs fusionados)`,
          agentId: 'yaku'
        });
      } else if (result.status === 'skipped') {
        setRefreshMsg(
          result.reason ||
            'Sin MARU_KB_REMOTE_URL. Configure la URL remota o use el corpus embebido.'
        );
      } else {
        setRefreshMsg(`${result.status}: ${result.reason || 'error'}`);
      }
      await load();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="maru-panel space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--maru-border-soft)] pb-2">
        <div>
          <h3 className="font-display font-semibold text-lg text-[var(--maru-text)] flex items-center gap-2">
            <BookOpen className="text-[var(--maru-primary)]" size={20} />
            Bóveda de conocimiento
          </h3>
          <p className="text-xs text-[var(--maru-text-muted)] mt-1">
            PDFs por especialidad + sync remoto cuando hay red.
            {kbTotal != null ? ` · ${kbTotal} docs activos en API` : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleRefresh()}
          disabled={busy}
          className="maru-btn-secondary text-xs"
        >
          <RefreshCw size={14} className={busy ? 'animate-spin' : ''} />
          Actualizar KB
        </button>
      </div>

      {refreshMsg && (
        <p className="text-xs p-2.5 rounded-lg bg-[var(--maru-surface-muted)] border border-[var(--maru-border-soft)] text-[var(--maru-text-muted)]">
          {refreshMsg}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {pdfs.map((pdf) => (
          <a
            key={pdf.id}
            href={pdf.url}
            download={pdf.filename}
            className="flex items-start gap-3 p-3 rounded-xl border border-[var(--maru-border-soft)] bg-[var(--maru-surface-muted)] hover:border-[var(--maru-primary)]/50 transition-colors"
            onClick={() =>
              notifyPanelChange({
                domain: 'settings',
                summary: `Descargó PDF de conocimiento: ${pdf.title}`,
                agentId: asAgentId(pdf.agents?.[0])
              })
            }
          >
            <FileText size={18} className="text-[var(--maru-primary)] shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-[var(--maru-text)] leading-snug">{pdf.title}</div>
              <div className="text-[10px] font-mono text-[var(--maru-text-muted)] mt-1">
                {(pdf.agents || []).join(' · ')}
                {pdf.documentCount != null ? ` · ${pdf.documentCount} docs` : ''}
              </div>
              <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--maru-primary)] mt-2">
                <Download size={12} /> Descargar PDF
              </div>
            </div>
          </a>
        ))}
        {pdfs.length === 0 && (
          <p className="text-xs text-[var(--maru-text-muted)] sm:col-span-2">
            Manifiesto PDF no encontrado. Ejecuta <code>python3 scripts/generate_kb_pdfs.py</code>.
          </p>
        )}
      </div>
    </div>
  );
};
