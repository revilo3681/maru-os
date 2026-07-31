import React, { useMemo, useState } from 'react';
import {
  Inbox, FileEdit, Send, Star, Trash2, Search, Bot, PenSquare, RefreshCw
} from 'lucide-react';
import { ApiService } from '../../services/apiService';

type Folder = 'inbox' | 'drafts' | 'sent' | 'starred';

interface MailMessage {
  id: string;
  folder: Folder;
  from: string;
  to: string;
  subject: string;
  preview: string;
  body: string;
  date: string;
  read: boolean;
  starred: boolean;
}

const SEED: MailMessage[] = [
  {
    id: 'm1',
    folder: 'inbox',
    from: 'cita@clinica-andina.pe',
    to: 'tu@maru.local',
    subject: 'Confirmación de cita médica',
    preview: 'Tu cita con el Dr. Vargas quedó agendada para el jueves...',
    body: 'Hola,\n\nTu cita con el Dr. Vargas quedó agendada para el jueves a las 15:00.\nPor favor llega 10 minutos antes.\n\nSaludos,\nClínica Andina',
    date: 'Hoy 09:12',
    read: false,
    starred: true
  },
  {
    id: 'm2',
    folder: 'inbox',
    from: 'alerta@senamhi.gob.pe',
    to: 'tu@maru.local',
    subject: 'Aviso hidrológico — valle del Rímac',
    preview: 'Se mantiene vigilancia ante posibles huaicos en zonas altas...',
    body: 'Se mantiene vigilancia ante posibles huaicos en zonas altas del valle del Rímac. Revisa rutas de evacuación con Tupac.',
    date: 'Ayer',
    read: true,
    starred: false
  },
  {
    id: 'm3',
    folder: 'drafts',
    from: 'tu@maru.local',
    to: 'rrhh@empresa.pe',
    subject: 'Solicitud de permiso médico',
    preview: 'Estimados, solicito permiso para asistencia médica...',
    body: 'Estimados,\n\nSolicito permiso para asistencia médica el jueves por la tarde.\n\nGracias.',
    date: 'Borrador',
    read: true,
    starred: false
  },
  {
    id: 'm4',
    folder: 'sent',
    from: 'tu@maru.local',
    to: 'ana@familia.pe',
    subject: 'Llegué bien a Chosica',
    preview: 'Ya estoy en casa. Todo tranquilo por ahora...',
    body: 'Hola Ana,\n\nYa estoy en casa. Todo tranquilo por ahora.\n\nOliver',
    date: 'Lun',
    read: true,
    starred: false
  }
];

const FOLDERS: { id: Folder; label: string; icon: React.ReactNode }[] = [
  { id: 'inbox', label: 'Bandeja', icon: <Inbox size={16} /> },
  { id: 'starred', label: 'Destacados', icon: <Star size={16} /> },
  { id: 'drafts', label: 'Borradores', icon: <FileEdit size={16} /> },
  { id: 'sent', label: 'Enviados', icon: <Send size={16} /> }
];

export const MailView: React.FC = () => {
  const [mails, setMails] = useState<MailMessage[]>(() => {
    try {
      const raw = localStorage.getItem('maru_mail_box');
      if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return SEED;
  });
  const [folder, setFolder] = useState<Folder>('inbox');
  const [selectedId, setSelectedId] = useState<string | null>('m1');
  const [query, setQuery] = useState('');
  const [composing, setComposing] = useState(false);
  const [draftTo, setDraftTo] = useState('');
  const [draftSubject, setDraftSubject] = useState('');
  const [draftBody, setDraftBody] = useState('');
  const [aiHint, setAiHint] = useState('');
  const [sending, setSending] = useState(false);
  const gmailEmail = localStorage.getItem('maru_gmail_email') || '';
  const gmailAppPass = localStorage.getItem('maru_gmail_app_pass') || '';
  const mailConfigured = Boolean(gmailEmail && gmailAppPass);

  const persist = (next: MailMessage[]) => {
    setMails(next);
    localStorage.setItem('maru_mail_box', JSON.stringify(next));
  };

  const visible = useMemo(() => {
    return mails.filter((m) => {
      const inFolder =
        folder === 'starred' ? m.starred : m.folder === folder;
      if (!inFolder) return false;
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        m.subject.toLowerCase().includes(q) ||
        m.from.toLowerCase().includes(q) ||
        m.preview.toLowerCase().includes(q)
      );
    });
  }, [mails, folder, query]);

  const selected = mails.find((m) => m.id === selectedId) || null;

  const openMail = (id: string) => {
    setSelectedId(id);
    setComposing(false);
    persist(mails.map((m) => (m.id === id ? { ...m, read: true } : m)));
  };

  const toggleStar = (id: string) => {
    persist(mails.map((m) => (m.id === id ? { ...m, starred: !m.starred } : m)));
  };

  const deleteMail = (id: string) => {
    const next = mails.filter((m) => m.id !== id);
    persist(next);
    setSelectedId(next[0]?.id || null);
  };

  const sendDraft = async () => {
    if (!draftTo.trim() || !draftSubject.trim()) return;
    setSending(true);
    setAiHint('');

    let sentVia: 'gmail' | 'local' = 'local';
    if (mailConfigured) {
      const res = await ApiService.sendMail({
        to: draftTo.trim(),
        subject: draftSubject.trim(),
        body: draftBody,
        gmailEmail,
        gmailAppPass
      });
      if (res?.status === 'sent') {
        sentVia = 'gmail';
      } else {
        setSending(false);
        setAiHint(res?.message || 'No se pudo enviar por Gmail. Revisa App Password en Ajustes.');
        return;
      }
    }

    const msg: MailMessage = {
      id: `m-${Date.now()}`,
      folder: 'sent',
      from: gmailEmail || 'tu@maru.local',
      to: draftTo.trim(),
      subject: draftSubject.trim(),
      preview: draftBody.slice(0, 80),
      body: draftBody,
      date: 'Ahora',
      read: true,
      starred: false
    };
    persist([msg, ...mails]);
    setComposing(false);
    setFolder('sent');
    setSelectedId(msg.id);
    setDraftTo('');
    setDraftSubject('');
    setDraftBody('');
    setAiHint(
      sentVia === 'gmail'
        ? `Enviado vía Gmail (${gmailEmail}).`
        : 'Guardado en Enviados (local). Configura Gmail en Ajustes para envío real.'
    );
    setSending(false);
  };

  const askAiAssist = () => {
    const subject = draftSubject || selected?.subject || 'tu mensaje';
    const suggestion =
      `Hola,\n\nGracias por tu mensaje sobre «${subject}».\n` +
      `Te confirmo que lo revisé con MARU y quedo atento a cualquier detalle adicional.\n\n` +
      `Saludos cordiales,\n${StorageServiceSafeName()}`;
    setDraftBody(suggestion);
    setAiHint('Borrador sugerido por MARU (local). Revísalo antes de enviar.');
    setComposing(true);
    if (selected && !draftTo) setDraftTo(selected.from);
    if (selected && !draftSubject) setDraftSubject(`Re: ${selected.subject}`);
  };

  return (
    <div className="flex flex-col lg:flex-row h-full w-full bg-[var(--maru-bg)] overflow-hidden">
      <aside className="w-full lg:w-52 border-b lg:border-b-0 lg:border-r border-[var(--maru-border-soft)] bg-[var(--maru-surface)] p-3 space-y-2 shrink-0">
        <button
          onClick={() => {
            setComposing(true);
            setSelectedId(null);
            setDraftTo('');
            setDraftSubject('');
            setDraftBody('');
          }}
          className="maru-btn-primary w-full justify-center"
        >
          <PenSquare size={16} /> Redactar
        </button>
        {FOLDERS.map((f) => (
          <button
            key={f.id}
            onClick={() => { setFolder(f.id); setComposing(false); }}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm ${
              folder === f.id && !composing
                ? 'bg-[#1E3A5F] text-white'
                : 'text-[var(--maru-text-muted)] hover:bg-[var(--maru-surface-muted)]'
            }`}
          >
            {f.icon} {f.label}
            <span className="ml-auto text-[10px] font-mono opacity-70">
              {f.id === 'starred'
                ? mails.filter((m) => m.starred).length
                : mails.filter((m) => m.folder === f.id).length}
            </span>
          </button>
        ))}
        <p className={`text-[10px] px-1 pt-2 ${mailConfigured ? 'text-emerald-600' : 'text-[var(--maru-text-muted)]'}`}>
          {mailConfigured
            ? `Gmail listo: ${gmailEmail}`
            : 'Sin Gmail. Guarda App Password en Ajustes para envío real.'}
        </p>
      </aside>

      <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-[var(--maru-border-soft)] bg-white flex flex-col min-h-[220px]">
        <div className="p-3 border-b border-[var(--maru-border-soft)]">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--maru-text-muted)]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar correo..."
              className="maru-field pl-9 !text-xs"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {visible.map((m) => (
            <button
              key={m.id}
              onClick={() => openMail(m.id)}
              className={`w-full text-left px-3 py-3 border-b border-[var(--maru-border-soft)] hover:bg-[var(--maru-surface-muted)] ${
                selectedId === m.id ? 'bg-[#4A9B9D]/10' : ''
              } ${!m.read ? 'font-semibold' : ''}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs truncate">{folder === 'sent' || folder === 'drafts' ? m.to : m.from}</span>
                <span className="text-[10px] text-[var(--maru-text-muted)] shrink-0">{m.date}</span>
              </div>
              <div className="text-sm truncate mt-0.5">{m.subject}</div>
              <div className="text-[11px] text-[var(--maru-text-muted)] truncate">{m.preview}</div>
            </button>
          ))}
          {visible.length === 0 && (
            <p className="p-6 text-center text-xs text-[var(--maru-text-muted)]">Sin mensajes en esta carpeta.</p>
          )}
        </div>
      </div>

      <div className="flex-1 bg-[var(--maru-surface)] flex flex-col min-h-0">
        {composing ? (
          <div className="flex flex-col h-full p-4 sm:p-6 space-y-3">
            <h2 className="font-display font-bold text-xl">Redactar</h2>
            <input className="maru-field" placeholder="Para" value={draftTo} onChange={(e) => setDraftTo(e.target.value)} />
            <input className="maru-field" placeholder="Asunto" value={draftSubject} onChange={(e) => setDraftSubject(e.target.value)} />
            <textarea
              className="maru-field flex-1 min-h-[220px] resize-none"
              placeholder="Escribe tu mensaje..."
              value={draftBody}
              onChange={(e) => setDraftBody(e.target.value)}
            />
            {aiHint && <p className="text-xs text-[#4A9B9D]">{aiHint}</p>}
            <div className="flex flex-wrap gap-2">
              <button onClick={sendDraft} className="maru-btn-primary" disabled={sending}>
                <Send size={16} /> {sending ? 'Enviando…' : mailConfigured ? 'Enviar por Gmail' : 'Guardar enviado'}
              </button>
              <button onClick={askAiAssist} className="maru-btn-secondary"><Bot size={16} /> Ayuda de MARU</button>
              <button onClick={() => setComposing(false)} className="maru-btn-secondary">Cancelar</button>
            </div>
          </div>
        ) : selected ? (
          <div className="flex flex-col h-full">
            <div className="px-4 sm:px-6 py-4 border-b border-[var(--maru-border-soft)] bg-white flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-display font-bold text-xl text-[var(--maru-text)]">{selected.subject}</h2>
                <p className="text-xs text-[var(--maru-text-muted)] mt-1">
                  De: {selected.from} · Para: {selected.to} · {selected.date}
                </p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => toggleStar(selected.id)} className="p-2 rounded-lg hover:bg-[var(--maru-surface-muted)]" title="Destacar">
                  <Star size={16} className={selected.starred ? 'text-[#FF9500] fill-[#FF9500]' : ''} />
                </button>
                <button
                  onClick={() => {
                    setComposing(true);
                    setDraftTo(selected.from);
                    setDraftSubject(`Re: ${selected.subject}`);
                    setDraftBody('');
                  }}
                  className="p-2 rounded-lg hover:bg-[var(--maru-surface-muted)]"
                  title="Responder"
                >
                  <RefreshCw size={16} />
                </button>
                <button onClick={askAiAssist} className="p-2 rounded-lg hover:bg-[var(--maru-surface-muted)]" title="Resumir / redactar con IA">
                  <Bot size={16} />
                </button>
                <button onClick={() => deleteMail(selected.id)} className="p-2 rounded-lg hover:bg-red-50 text-[#FF3B30]" title="Eliminar">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 whitespace-pre-wrap text-sm leading-7 text-[var(--maru-text)]">
              {selected.body}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-[var(--maru-text-muted)] text-sm">
            Selecciona un correo o redacta uno nuevo.
          </div>
        )}
      </div>
    </div>
  );
};

function StorageServiceSafeName() {
  try {
    const raw = localStorage.getItem('maru_user_profile');
    if (raw) return JSON.parse(raw).name || 'Oliver';
  } catch { /* ignore */ }
  return 'Oliver';
}
