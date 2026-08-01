import React, { useMemo, useState } from 'react';
import {
  Inbox, FileEdit, Send, Star, Trash2, Search, Bot, PenSquare, RefreshCw, Save, ClipboardPaste
} from 'lucide-react';
import { ApiService } from '../../services/apiService';
import { StorageService } from '../../services/storageService';
import { syncMailDraft } from '../../services/knowledgeSync';

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
  const [aiBusy, setAiBusy] = useState(false);
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
  const [pasteRaw, setPasteRaw] = useState('');
  const [showPaste, setShowPaste] = useState(false);
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
    const mail = mails.find((m) => m.id === id);
    if (mail?.folder === 'drafts') {
      openDraftForEdit(mail);
      return;
    }
    setSelectedId(id);
    setComposing(false);
    setEditingDraftId(null);
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

  const saveAsDraft = () => {
    if (!draftTo.trim() && !draftSubject.trim() && !draftBody.trim()) {
      setAiHint('Escribe al menos un destinatario, asunto o mensaje para guardar el borrador.');
      return;
    }
    const id = editingDraftId || `draft-${Date.now()}`;
    const draft: MailMessage = {
      id,
      folder: 'drafts',
      from: gmailEmail || 'tu@maru.local',
      to: draftTo.trim() || '(sin destinatario)',
      subject: draftSubject.trim() || '(sin asunto)',
      preview: draftBody.slice(0, 80) || '(vacío)',
      body: draftBody,
      date: 'Borrador',
      read: true,
      starred: false
    };
    const without = mails.filter((m) => m.id !== id);
    persist([draft, ...without]);
    syncMailDraft(`Borrador de correo: «${draft.subject}» → ${draft.to}`, draft.subject);
    setEditingDraftId(id);
    setComposing(false);
    setFolder('drafts');
    setSelectedId(id);
    setAiHint('Borrador guardado. Puedes continuar después desde Borradores.');
  };

  const openDraftForEdit = (mail: MailMessage) => {
    setComposing(true);
    setEditingDraftId(mail.id);
    setDraftTo(mail.to === '(sin destinatario)' ? '' : mail.to);
    setDraftSubject(mail.subject === '(sin asunto)' ? '' : mail.subject);
    setDraftBody(mail.body);
    setSelectedId(mail.id);
    setAiHint('');
  };

  const sendDraft = async () => {
    if (!draftTo.trim() || !draftSubject.trim()) {
      setAiHint('Para enviar necesitas destinatario y asunto. Puedes guardar borrador sin ellos.');
      return;
    }
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
    // Quitar borrador en edición si existía
    const rest = editingDraftId ? mails.filter((m) => m.id !== editingDraftId) : mails;
    persist([msg, ...rest]);
    setComposing(false);
    setEditingDraftId(null);
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

  const askAiAssist = async () => {
    setAiBusy(true);
    setAiHint('MARU está ordenando y redactando la respuesta…');
    setComposing(true);
    if (selected && !draftTo) setDraftTo(selected.from);
    if (selected && !draftSubject) setDraftSubject(`Re: ${selected.subject}`);

    const name = StorageService.getProfile()?.name || 'Oliver';
    const sourceMail = selected
      ? `De: ${selected.from}\nPara: ${selected.to}\nAsunto: ${selected.subject}\n\n${selected.body}`
      : pasteRaw || draftBody;

    const prompt =
      `Eres el asistente de correo de MARU OS. El usuario se llama ${name}.\n` +
      `A partir del correo (o texto pegado) siguiente:\n` +
      `1) Identifica quién envió, a quién y de dónde/asunto.\n` +
      `2) Resume en 1-2 líneas qué pide.\n` +
      `3) Redacta UNA respuesta lista para enviar en español peruano, cordial y concreta.\n` +
      `Devuelve SOLO el cuerpo del correo de respuesta (sin markdown, sin explicación).\n\n` +
      `--- CORREO ---\n${sourceMail}`;

    try {
      const res = await ApiService.sendChatMessage({
        prompt,
        agentId: 'inti',
        manualAgent: true,
        engineMode: 'manual',
        manualModel: 'gemma4:e2b-q4',
        userProfile: StorageService.getProfile(),
        healthProfile: StorageService.getHealth(),
        locationProfile: StorageService.getLocation()
      });
      const text = (res?.content || '').trim();
      if (text) {
        setDraftBody(text);
        setAiHint('Respuesta ordenada por MARU. Revísala y envía o guarda como borrador.');
      } else {
        const subject = draftSubject || selected?.subject || 'tu mensaje';
        setDraftBody(
          `Hola,\n\nGracias por tu mensaje sobre «${subject}».\n` +
          `Lo revisé y quedo atento a cualquier detalle adicional.\n\nSaludos,\n${name}`
        );
        setAiHint('Plantilla local (IA no respondió). Puedes editarla.');
      }
    } catch {
      setAiHint('No se pudo contactar a la IA. Usa la plantilla o escribe tu respuesta.');
    } finally {
      setAiBusy(false);
    }
  };

  const processPastedMail = async () => {
    if (!pasteRaw.trim()) {
      setAiHint('Pega el texto del correo (quién envió, asunto, mensaje).');
      return;
    }
    // Extraer campos básicos del texto pegado
    const fromMatch = pasteRaw.match(/(?:de|from)\s*[:：]\s*(.+)/i);
    const subjectMatch = pasteRaw.match(/(?:asunto|subject)\s*[:：]\s*(.+)/i);
    if (fromMatch) setDraftTo(fromMatch[1].trim());
    if (subjectMatch) setDraftSubject(`Re: ${subjectMatch[1].trim()}`);
    setShowPaste(false);
    await askAiAssist();
  };

  return (
    <div className="flex flex-col lg:flex-row h-full w-full bg-[var(--maru-bg)] overflow-hidden">
      <aside className="w-full lg:w-52 border-b lg:border-b-0 lg:border-r border-[var(--maru-border-soft)] bg-[var(--maru-surface)] p-3 space-y-2 shrink-0">
        <button
          onClick={() => {
            setComposing(true);
            setSelectedId(null);
            setEditingDraftId(null);
            setDraftTo('');
            setDraftSubject('');
            setDraftBody('');
            setAiHint('');
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
            <h2 className="font-display font-bold text-xl">
              {editingDraftId ? 'Editar borrador' : 'Redactar'}
            </h2>
            <input className="maru-field" placeholder="Para" value={draftTo} onChange={(e) => setDraftTo(e.target.value)} />
            <input className="maru-field" placeholder="Asunto" value={draftSubject} onChange={(e) => setDraftSubject(e.target.value)} />
            <textarea
              className="maru-field flex-1 min-h-[220px] resize-none"
              placeholder="Escribe tu mensaje… o pega un correo y usa «Ordenar con IA»"
              value={draftBody}
              onChange={(e) => setDraftBody(e.target.value)}
            />
            {showPaste && (
              <div className="space-y-2 p-3 rounded-xl bg-[var(--maru-surface-muted)] border border-[var(--maru-border-soft)]">
                <p className="text-[11px] text-[var(--maru-text-muted)]">
                  Pega el correo completo (De / Para / Asunto / mensaje). MARU lo ordenará y redactará la respuesta.
                </p>
                <textarea
                  className="maru-field min-h-[120px] resize-none text-xs"
                  placeholder={"De: persona@empresa.pe\nAsunto: Reunión\n\nHola, te escribo porque..."}
                  value={pasteRaw}
                  onChange={(e) => setPasteRaw(e.target.value)}
                />
                <button onClick={processPastedMail} className="maru-btn-primary text-xs" disabled={aiBusy}>
                  <Bot size={14} /> {aiBusy ? 'Procesando…' : 'Ordenar y responder'}
                </button>
              </div>
            )}
            {aiHint && <p className="text-xs text-[#4A9B9D]">{aiHint}</p>}
            <div className="flex flex-wrap gap-2">
              <button onClick={sendDraft} className="maru-btn-primary" disabled={sending}>
                <Send size={16} /> {sending ? 'Enviando…' : mailConfigured ? 'Enviar por Gmail' : 'Guardar enviado'}
              </button>
              <button onClick={saveAsDraft} className="maru-btn-secondary">
                <Save size={16} /> Guardar borrador
              </button>
              <button onClick={askAiAssist} className="maru-btn-secondary" disabled={aiBusy}>
                <Bot size={16} /> {aiBusy ? 'Redactando…' : 'Ayuda de MARU'}
              </button>
              <button
                onClick={() => setShowPaste((v) => !v)}
                className="maru-btn-secondary"
              >
                <ClipboardPaste size={16} /> Pegar correo
              </button>
              <button
                onClick={() => {
                  setComposing(false);
                  setEditingDraftId(null);
                }}
                className="maru-btn-secondary"
              >
                Cancelar
              </button>
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
