import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Plus, Search, FileText, Bot, Save, Bold, Italic, List,
  Heading2, History, Upload, Trash2, Table2, Type
} from 'lucide-react';
import { Note } from '../../types';
import { ApiService } from '../../services/apiService';
import { syncNotesChange } from '../../services/knowledgeSync';

function emptySheet(rows = 8, cols = 6): string[][] {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => ''));
}

interface NoteVersion {
  at: string;
  title: string;
  content: string;
}

const VERSIONS_KEY = 'maru_notes_versions';

function loadVersions(): Record<string, NoteVersion[]> {
  try {
    return JSON.parse(localStorage.getItem(VERSIONS_KEY) || '{}');
  } catch {
    return {};
  }
}

function pushVersion(noteId: string, note: Note) {
  const all = loadVersions();
  const list = all[noteId] || [];
  list.unshift({
    at: new Date().toISOString(),
    title: note.title,
    content: note.content
  });
  all[noteId] = list.slice(0, 20);
  localStorage.setItem(VERSIONS_KEY, JSON.stringify(all));
}

export const NotesView: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [askMaruQuery, setAskMaruQuery] = useState('');
  const [aiReply, setAiReply] = useState('');
  const [search, setSearch] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const res = await ApiService.getNotes();
      setNotes(res);
      if (res.length > 0) setSelectedNote((prev) => prev || res[0]);
    } catch {
      setNotes([]);
    }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return notes;
    const q = search.toLowerCase();
    return notes.filter(
      (n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
    );
  }, [notes, search]);

  const versions = selectedNote ? loadVersions()[selectedNote.id] || [] : [];

  const handleCreateNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: 'Nueva Nota',
      content: '',
      kind: 'text',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setNotes([newNote, ...notes]);
    setSelectedNote(newNote);
    setShowHistory(false);
  };

  const toggleNoteKind = () => {
    if (!selectedNote) return;
    if (selectedNote.kind === 'sheet') {
      setSelectedNote({
        ...selectedNote,
        kind: 'text',
        content: selectedNote.content || selectedNote.sheet?.map((r) => r.join('\t')).join('\n') || ''
      });
    } else {
      const fromText = selectedNote.content
        ? selectedNote.content.split('\n').map((line) => line.split('\t'))
        : emptySheet();
      const cols = Math.max(6, ...fromText.map((r) => r.length));
      const sheet = fromText.map((r) => {
        const row = [...r];
        while (row.length < cols) row.push('');
        return row;
      });
      while (sheet.length < 8) sheet.push(Array.from({ length: cols }, () => ''));
      setSelectedNote({
        ...selectedNote,
        kind: 'sheet',
        sheet,
        content: JSON.stringify(sheet)
      });
    }
  };

  const updateSheetCell = (ri: number, ci: number, value: string) => {
    if (!selectedNote?.sheet) return;
    const sheet = selectedNote.sheet.map((row, i) =>
      i === ri ? row.map((cell, j) => (j === ci ? value : cell)) : row
    );
    setSelectedNote({
      ...selectedNote,
      sheet,
      content: JSON.stringify(sheet)
    });
  };

  const handleSaveNote = async () => {
    if (!selectedNote) return;
    setIsSaving(true);
    const updated = {
      ...selectedNote,
      updatedAt: new Date().toISOString()
    };
    pushVersion(updated.id, updated);
    try {
      await ApiService.saveNote(updated);
      setSelectedNote(updated);
      await fetchNotes();
      const all = await ApiService.getNotes().catch(() => notes);
      syncNotesChange(all.length ? all : [updated, ...notes.filter((n) => n.id !== updated.id)], `Nota guardada: ${updated.title}`);
    } catch (e) {
      console.error(e);
      // local fallback already in apiService
      setNotes((prev) => {
        const exists = prev.some((n) => n.id === updated.id);
        const next = exists ? prev.map((n) => (n.id === updated.id ? updated : n)) : [updated, ...prev];
        localStorage.setItem('maru_notes', JSON.stringify(next));
        syncNotesChange(next, `Nota guardada (local): ${updated.title}`);
        return next;
      });
    } finally {
      setIsSaving(false);
    }
  };

  const wrapSelection = (before: string, after = before) => {
    const el = textareaRef.current;
    if (!selectedNote || !el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const value = selectedNote.content;
    const selected = value.slice(start, end) || 'texto';
    const next =
      value.slice(0, start) + before + selected + after + value.slice(end);
    setSelectedNote({ ...selectedNote, content: next });
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + before.length, start + before.length + selected.length);
    });
  };

  const askMaru = async () => {
    if (!selectedNote) return;
    const q = askMaruQuery.trim() || 'resume esta nota';
    const body = selectedNote.content.slice(0, 2500) || '(nota vacía)';
    setAiReply('Consultando a MARU…');

    const prompt =
      `Eres un asistente de notas. El usuario tiene esta nota titulada «${selectedNote.title}»:\n\n${body}\n\n` +
      `Petición: ${q}\nResponde en español, conciso y útil (máx. 12 líneas).`;

    try {
      const data = await ApiService.sendChatMessage({
        prompt,
        agentId: 'aya',
        manualAgent: true,
        engineMode: 'manual',
        manualModel: 'gemma4:e2b-q4'
      });
      const reply = data?.content?.trim()
        || (() => {
          if (/resum/i.test(q)) {
            return `Resumen MARU:\n• ${selectedNote.title}\n• ${body.split('\n').filter(Boolean).slice(0, 3).map((l) => l.slice(0, 80)).join('\n• ') || 'sin contenido'}`;
          }
          return `Sugerencia local: revisa la nota y añade 2 acciones concretas con fecha.`;
        })();
      setAiReply(reply);
      setSelectedNote({
        ...selectedNote,
        content: `${selectedNote.content}\n\n---\n### MARU\n${reply}\n`
      });
    } catch {
      setAiReply('No se pudo contactar al motor. Intenta de nuevo con Ollama activo.');
    }
    setAskMaruQuery('');
  };

  const importDoc = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || '');
      const note: Note = {
        id: Date.now().toString(),
        title: file.name.replace(/\.[^.]+$/, ''),
        content: text,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setNotes([note, ...notes]);
      setSelectedNote(note);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const restoreVersion = (v: NoteVersion) => {
    if (!selectedNote) return;
    setSelectedNote({
      ...selectedNote,
      title: v.title,
      content: v.content,
      updatedAt: new Date().toISOString()
    });
    setShowHistory(false);
  };

  const deleteNote = () => {
    if (!selectedNote) return;
    const next = notes.filter((n) => n.id !== selectedNote.id);
    setNotes(next);
    localStorage.setItem('maru_notes', JSON.stringify(next));
    setSelectedNote(next[0] || null);
  };

  return (
    <div className="flex flex-col lg:flex-row h-full w-full bg-[var(--maru-bg)] overflow-y-auto lg:overflow-hidden">
      <div className="w-full lg:w-72 max-h-64 lg:max-h-none border-b lg:border-b-0 lg:border-r border-[var(--maru-border-soft)] bg-[var(--maru-surface)] p-4 flex flex-col shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-display font-bold text-[var(--maru-text)]">Notas</h2>
          <div className="flex gap-1">
            <button onClick={() => fileRef.current?.click()} className="maru-btn-secondary px-3" title="Importar texto">
              <Upload size={16} />
            </button>
            <button onClick={handleCreateNote} className="maru-btn-secondary px-3" title="Nueva nota">
              <Plus size={20} />
            </button>
          </div>
          <input ref={fileRef} type="file" accept=".txt,.md,.csv" className="hidden" onChange={importDoc} />
        </div>
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar nota..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="maru-field pl-9"
          />
        </div>
        <div className="flex-1 overflow-y-auto space-y-2">
          {filtered.map((note) => (
            <button
              key={note.id}
              onClick={() => { setSelectedNote(note); setShowHistory(false); setAiReply(''); }}
              className={`w-full text-left p-3 rounded-lg transition-colors flex items-start gap-3 ${
                selectedNote?.id === note.id
                  ? 'bg-[#4A9B9D]/10 border border-[#4A9B9D]/30'
                  : 'hover:bg-white border border-transparent'
              }`}
            >
              <FileText size={16} className={`mt-0.5 ${selectedNote?.id === note.id ? 'text-[#4A9B9D]' : 'text-gray-400'}`} />
              <div className="overflow-hidden">
                <div className="font-medium text-[#2C3E50] text-sm truncate flex items-center gap-1">
                  {note.kind === 'sheet' ? <Table2 size={12} /> : null}
                  {note.title}
                </div>
                <div className="text-xs text-gray-500 truncate mt-0.5">
                  {note.kind === 'sheet' ? 'Hoja de cálculo · ' : ''}
                  {new Date(note.updatedAt).toLocaleDateString('es-PE')}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {selectedNote ? (
        <div className="flex-1 flex flex-col relative h-full min-h-[520px]">
          <div className="min-h-16 border-b border-[var(--maru-border-soft)] flex items-center justify-between px-4 sm:px-6 bg-white shrink-0 gap-3">
            <input
              type="text"
              value={selectedNote.title}
              onChange={(e) => setSelectedNote({ ...selectedNote, title: e.target.value })}
              className="text-xl font-display font-bold bg-transparent border-none focus:outline-none focus:ring-0 text-[var(--maru-text)] w-full"
            />
            <div className="flex gap-2 shrink-0">
              <button onClick={() => setShowHistory((v) => !v)} className="maru-btn-secondary px-3" title="Historial">
                <History size={16} />
              </button>
              <button onClick={deleteNote} className="maru-btn-secondary px-3 text-[#FF3B30]" title="Eliminar">
                <Trash2 size={16} />
              </button>
              <button onClick={handleSaveNote} className="maru-btn-primary" disabled={isSaving}>
                <Save size={16} /> {isSaving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1 px-3 py-2 border-b border-[var(--maru-border-soft)] bg-[var(--maru-surface-muted)]">
            <button
              onClick={toggleNoteKind}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 ${
                selectedNote.kind === 'sheet'
                  ? 'bg-[#1E3A5F] text-white'
                  : 'hover:bg-white text-[var(--maru-text)]'
              }`}
              title="Cambiar entre nota y hoja de cálculo"
            >
              {selectedNote.kind === 'sheet' ? <><Type size={14} /> Texto</> : <><Table2 size={14} /> Hoja de cálculo</>}
            </button>
            {selectedNote.kind !== 'sheet' && (
              <>
                <button onClick={() => wrapSelection('**')} className="p-2 rounded-lg hover:bg-white" title="Negrita"><Bold size={15} /></button>
                <button onClick={() => wrapSelection('_')} className="p-2 rounded-lg hover:bg-white" title="Cursiva"><Italic size={15} /></button>
                <button onClick={() => wrapSelection('\n## ', '')} className="p-2 rounded-lg hover:bg-white" title="Título"><Heading2 size={15} /></button>
                <button onClick={() => wrapSelection('\n- ', '')} className="p-2 rounded-lg hover:bg-white" title="Lista"><List size={15} /></button>
              </>
            )}
            <span className="text-[10px] text-[var(--maru-text-muted)] ml-2">
              {selectedNote.kind === 'sheet' ? 'Hoja numérica · celdas editables' : 'Markdown · historial local al guardar'}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-8 pb-36 bg-[var(--maru-surface)] flex gap-4">
            {selectedNote.kind === 'sheet' ? (
              <div className="flex-1 overflow-auto">
                <table className="border-collapse text-sm min-w-full bg-white rounded-xl overflow-hidden border border-[var(--maru-border-soft)]">
                  <thead>
                    <tr>
                      <th className="w-8 bg-[var(--maru-surface-muted)] border border-[var(--maru-border-soft)]" />
                      {(selectedNote.sheet?.[0] || []).map((_, ci) => (
                        <th key={ci} className="px-2 py-1 bg-[var(--maru-surface-muted)] border border-[var(--maru-border-soft)] font-mono text-[10px] text-[var(--maru-text-muted)]">
                          {String.fromCharCode(65 + ci)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedNote.sheet || emptySheet()).map((row, ri) => (
                      <tr key={ri}>
                        <td className="px-1 py-0.5 text-center font-mono text-[10px] text-[var(--maru-text-muted)] bg-[var(--maru-surface-muted)] border border-[var(--maru-border-soft)]">
                          {ri + 1}
                        </td>
                        {row.map((cell, ci) => (
                          <td key={ci} className="border border-[var(--maru-border-soft)] p-0">
                            <input
                              value={cell}
                              onChange={(e) => updateSheetCell(ri, ci, e.target.value)}
                              className="w-full min-w-[72px] px-2 py-1.5 outline-none focus:bg-[#4A9B9D]/10 font-mono text-xs"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
            <textarea
              ref={textareaRef}
              className="w-full h-full min-h-[420px] resize-none bg-transparent border-none focus:outline-none focus:ring-0 text-[var(--maru-text)] text-[16px] leading-7 flex-1"
              placeholder="Escribe en Markdown… Usa la barra para negrita, listas y títulos."
              value={selectedNote.content}
              onChange={(e) => setSelectedNote({ ...selectedNote, content: e.target.value })}
            />
            )}
            {showHistory && (
              <div className="w-56 shrink-0 space-y-2">
                <div className="text-xs font-bold uppercase text-[var(--maru-text-muted)]">Versiones</div>
                {versions.length === 0 && (
                  <p className="text-xs text-[var(--maru-text-muted)]">Guarda para crear historial.</p>
                )}
                {versions.map((v, i) => (
                  <button
                    key={i}
                    onClick={() => restoreVersion(v)}
                    className="w-full text-left p-2 rounded-xl border border-[var(--maru-border-soft)] bg-white text-xs hover:border-[#4A9B9D]"
                  >
                    <div className="font-bold truncate">{v.title}</div>
                    <div className="text-[10px] text-[var(--maru-text-muted)]">
                      {new Date(v.at).toLocaleString('es-PE')}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:bottom-6 sm:right-6 flex flex-col gap-2 bg-white shadow-[var(--maru-shadow-md)] rounded-[var(--maru-radius)] p-2 border border-[var(--maru-border)] max-w-xl">
            {aiReply && (
              <div className="text-[11px] text-[var(--maru-text-muted)] px-2 line-clamp-2">{aiReply}</div>
            )}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Preguntar a MARU (resumir, mejorar…)"
                value={askMaruQuery}
                onChange={(e) => setAskMaruQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && askMaru()}
                className="bg-transparent border-none text-sm focus:outline-none px-3 min-w-0 flex-1 sm:w-56"
              />
              <button onClick={askMaru} className="maru-btn-primary px-3" title="Preguntar a MARU">
                <Bot size={18} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400 flex-col gap-4">
          <FileText size={48} className="opacity-50" />
          <p>Selecciona o crea una nota para empezar.</p>
        </div>
      )}
    </div>
  );
};
