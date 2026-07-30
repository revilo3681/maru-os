import React, { useState, useEffect } from 'react';
import { Plus, Search, FileText, Bot, Save, Trash2 } from 'lucide-react';
import { Note } from '../../types';
import { ApiService } from '../../services/apiService';

export const NotesView: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [askMaruQuery, setAskMaruQuery] = useState("");

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const res = await ApiService.getNotes();
      setNotes(res);
      if (res.length > 0) setSelectedNote(res[0]);
    } catch (e) {
      console.error(e);
      setNotes([]);
    }
  };

  const handleCreateNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: "Nueva Nota",
      content: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setNotes([newNote, ...notes]);
    setSelectedNote(newNote);
  };

  const handleSaveNote = async () => {
    if (!selectedNote) return;
    setIsSaving(true);
    try {
      await ApiService.saveNote(selectedNote);
      await fetchNotes();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-full w-full bg-[#F5F1E8]">
      {/* Sidebar de Notas */}
      <div className="w-64 border-r border-[#2C3E50]/20 bg-white/50 p-4 flex flex-col shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-serif font-bold text-[#2C3E50]">Notas</h2>
          <button onClick={handleCreateNote} className="p-1.5 hover:bg-[#4A9B9D]/20 rounded-md text-[#4A9B9D] transition-colors">
            <Plus size={20} />
          </button>
        </div>
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar nota..." 
            className="w-full bg-white border border-gray-200 rounded-lg py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-[#4A9B9D] focus:ring-1 focus:ring-[#4A9B9D]"
          />
        </div>
        <div className="flex-1 overflow-y-auto space-y-2">
          {notes.map(note => (
            <button 
              key={note.id}
              onClick={() => setSelectedNote(note)}
              className={`w-full text-left p-3 rounded-lg transition-colors flex items-start gap-3 ${selectedNote?.id === note.id ? 'bg-[#4A9B9D]/10 border border-[#4A9B9D]/30' : 'hover:bg-white border border-transparent'}`}
            >
              <FileText size={16} className={`mt-0.5 ${selectedNote?.id === note.id ? 'text-[#4A9B9D]' : 'text-gray-400'}`} />
              <div className="overflow-hidden">
                <div className="font-medium text-[#2C3E50] text-sm truncate">{note.title}</div>
                <div className="text-xs text-gray-500 truncate mt-0.5">{new Date(note.updatedAt).toLocaleDateString()}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Editor Principal */}
      {selectedNote ? (
        <div className="flex-1 flex flex-col relative h-full">
          <div className="h-14 border-b border-[#2C3E50]/10 flex items-center justify-between px-6 bg-white/30 shrink-0">
            <input 
              type="text"
              value={selectedNote.title}
              onChange={e => setSelectedNote({...selectedNote, title: e.target.value})}
              className="text-xl font-serif font-bold bg-transparent border-none focus:outline-none focus:ring-0 text-[#2C3E50] w-full"
            />
            <div className="flex gap-2 shrink-0 ml-4">
              <button 
                onClick={handleSaveNote}
                className="flex items-center gap-2 px-3 py-1.5 bg-[#4A9B9D] text-white rounded-md text-sm hover:bg-[#387F81] transition-colors"
                disabled={isSaving}
              >
                <Save size={16} /> {isSaving ? 'Guardando...' : 'Guardar y Vectorizar'}
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-8 pb-32">
            <textarea
              className="w-full h-full min-h-[500px] resize-none bg-transparent border-none focus:outline-none focus:ring-0 text-[#2C3E50] text-lg leading-relaxed"
              placeholder="Empieza a escribir o presiona 'Space' para la IA..."
              value={selectedNote.content}
              onChange={e => setSelectedNote({...selectedNote, content: e.target.value})}
            />
          </div>

          {/* Floating AI Action (simulated for now) */}
          <div className="absolute bottom-6 right-6 flex items-center gap-2 bg-white shadow-xl rounded-full p-2 border border-[#4A9B9D]/20">
            <input 
              type="text"
              placeholder="Preguntar a MARU..."
              value={askMaruQuery}
              onChange={e => setAskMaruQuery(e.target.value)}
              className="bg-transparent border-none text-sm focus:outline-none px-3 w-48"
            />
            <button className="bg-[#1E3A5F] text-white p-2 rounded-full hover:bg-[#2C3E50] transition-colors">
              <Bot size={18} />
            </button>
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
