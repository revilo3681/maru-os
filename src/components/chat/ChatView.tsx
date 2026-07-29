/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Send, Mic, Paperclip, Square, Volume2, VolumeX,
  Trash2, Brain, FileText, Image as ImageIcon, RefreshCw
} from 'lucide-react';
import { ChatMessage, AgentId, FileAttachment, UserProfile, HealthProfile, LocationProfile } from '../../types';
import { AGENTS_CATALOG } from '../../data/agentsData';
import { AudioService } from '../../services/audioService';
import { StorageService } from '../../services/storageService';
import { ApiService } from '../../services/apiService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
interface ChatViewProps {
  activeAgentId: AgentId;
  onSelectAgent: (id: AgentId) => void;
  userProfile: UserProfile;
  healthProfile: HealthProfile;
  locationProfile: LocationProfile;
}

export const ChatView: React.FC<ChatViewProps> = ({
  activeAgentId,
  onSelectAgent: _onSelectAgent,
  userProfile,
  healthProfile,
  locationProfile
}) => {
  // Each agent has its OWN isolated messages — keyed by agentId
  const [messagesMap, setMessagesMap] = useState<Record<string, ChatMessage[]>>(() => {
    const map: Record<string, ChatMessage[]> = {};
    for (const agent of AGENTS_CATALOG) {
      map[agent.id] = StorageService.getAgentMessages(agent.id);
    }
    return map;
  });

  const [inputText, setInputText] = useState('');
  const [generatingAgents, setGeneratingAgents] = useState<Set<string>>(new Set());
  const [isListening, setIsListening] = useState(false);
  const [attachedFile, setAttachedFile] = useState<FileAttachment | null>(null);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [autoAgent, setAutoAgent] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  // Current agent data
  const currentAgent = AGENTS_CATALOG.find((a) => a.id === activeAgentId) || AGENTS_CATALOG[0];

  // Messages for the currently active agent
  const messages = useMemo(() => messagesMap[activeAgentId] || [], [messagesMap, activeAgentId]);

  // When switching agents, clear input but DO NOT stop background generation
  useEffect(() => {
    setInputText('');
    setAttachedFile(null);
  }, [activeAgentId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, generatingAgents]);

  const addMessage = useCallback((agentId: string, msg: ChatMessage) => {
    setMessagesMap(prev => {
      const updated = [...(prev[agentId] || []), msg];
      return { ...prev, [agentId]: updated };
    });
    StorageService.saveAgentMessage(agentId, msg);
  }, []);

  const removeMessage = useCallback((agentId: string, id: string) => {
    setMessagesMap(prev => {
      const updated = (prev[agentId] || []).filter(m => m.id !== id);
      return { ...prev, [agentId]: updated };
    });
    StorageService.deleteAgentMessage(agentId, id);
  }, []);

  const clearChat = useCallback(() => {
    setMessagesMap(prev => ({ ...prev, [activeAgentId]: [] }));
    StorageService.clearAgentMessages(activeAgentId);
  }, [activeAgentId]);

  // Microphone
  const handleToggleMic = () => {
    if (isListening) {
      AudioService.stopListening();
      setIsListening(false);
    } else {
      setIsListening(true);
      AudioService.initSpeechRecognition(
        (transcript) => setInputText(transcript),
        () => setIsListening(false)
      );
      AudioService.startListening();
    }
  };

  // File upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      let fileType: FileAttachment['type'] = 'image';
      if (file.type.includes('pdf')) fileType = 'pdf';
      else if (file.type.includes('sheet') || file.name.endsWith('.csv') || file.name.endsWith('.xlsx')) fileType = 'excel';
      else if (file.type.includes('audio')) fileType = 'audio';
      setAttachedFile({
        name: file.name, type: fileType,
        mimeType: file.type || 'image/png',
        dataBase64: base64,
        sizeFormatted: `${(file.size / 1024).toFixed(1)} KB`
      });
    };
    reader.readAsDataURL(file);
  };

  // Send message
  const handleSendMessage = async () => {
    if ((!inputText.trim() && !attachedFile) || generatingAgents.has(activeAgentId)) return;

    const userMsgText = inputText.trim();
    const currentAttachment = attachedFile;
    const targetAgentId = activeAgentId; // capture the agent at send time

    setInputText('');
    setAttachedFile(null);
    setGeneratingAgents(prev => new Set(prev).add(targetAgentId));

    const userMsg: ChatMessage = {
      id: `msg-usr-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
      sender: 'user',
      content: userMsgText || (currentAttachment ? `[Archivo: ${currentAttachment.name}]` : ''),
      fileAttachment: currentAttachment ? { ...currentAttachment, dataBase64: undefined } : undefined
    };

    // Add user message immediately to THIS agent's chat
    addMessage(targetAgentId, userMsg);

    try {
      const botMsgId = `msg-maru-${Date.now()}`;
      const placeholderMsg: ChatMessage = {
        id: botMsgId,
        timestamp: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
        sender: 'maru',
        agentId: targetAgentId,
        agentName: currentAgent.name,
        content: '',
        thinkingSteps: ['Analizando consulta...'],
        isLocal: false
      };
      
      // Add empty placeholder message first
      addMessage(targetAgentId, placeholderMsg);

      const data = await ApiService.sendChatMessage({
        prompt: userMsgText,
        agentId: targetAgentId,
        manualAgent: !autoAgent,
        userProfile,
        healthProfile,
        locationProfile,
        fileAttachment: attachedFile as unknown as { name: string; type: string; mimeType: string; dataBase64?: string; sizeFormatted: string },
        onUpdate: (content: string) => {
          setMessagesMap(prev => {
            const agentMsgs = [...(prev[targetAgentId] || [])];
            const msgIdx = agentMsgs.findIndex(m => m.id === botMsgId);
            if (msgIdx !== -1) {
              agentMsgs[msgIdx] = { ...agentMsgs[msgIdx], content };
            }
            return { ...prev, [targetAgentId]: agentMsgs };
          });
        }
      });

      if (data) {
        // Final update with complete data (metadata, model used, etc)
        setMessagesMap(prev => {
          const agentMsgs = [...(prev[targetAgentId] || [])];
          const msgIdx = agentMsgs.findIndex(m => m.id === botMsgId);
          if (msgIdx !== -1) {
            agentMsgs[msgIdx] = {
              ...agentMsgs[msgIdx],
              content: data.content,
              thinkingSteps: data.thinkingSteps,
              modelUsed: data.modelUsed,
              modelRAM: data.modelRAM,
              isLocal: data.isLocal,
              decisionReason: data.decisionReason,
              sourceInfo: `Respuesta Cognitiva (${data.modelUsed})`
            };
            StorageService.saveAgentMessages(targetAgentId, agentMsgs);
          }
          return { ...prev, [targetAgentId]: agentMsgs };
        });

        const settings = StorageService.getSettings();
        if (settings.voiceReadoutEnabled) {
          if (activeAudioRef.current) {
            activeAudioRef.current.pause();
            activeAudioRef.current = null;
          }
          AudioService.stopSpeech();
          
          setSpeakingMsgId(botMsgId);
          const ttsVoice = data.voice || 'es-PE-CamilaNeural';
          const audio = await ApiService.playTTS(data.content, ttsVoice);
          if (!audio) {
            AudioService.speakText(data.content, targetAgentId, () => setSpeakingMsgId(null));
          } else {
            activeAudioRef.current = audio;
            audio.onended = () => {
              setSpeakingMsgId(null);
              activeAudioRef.current = null;
            };
          }
        }
      } else {
        // Show error message inline
        const errMsg: ChatMessage = {
          id: `msg-err-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
          sender: 'maru',
          agentId: targetAgentId,
          agentName: currentAgent.name,
          content: `⚠️ No se pudo conectar con Ollama. Asegúrate de que Ollama esté corriendo con:\n\n\`OLLAMA_HOST=0.0.0.0 ollama serve\`\n\nLuego vuelve a intentarlo.`,
          thinkingSteps: [],
          modelUsed: 'offline',
          modelRAM: '-',
          isLocal: false,
          decisionReason: 'Sin conexión a Ollama'
        };
        addMessage(targetAgentId, errMsg);
      }
    } catch (err) {
      console.error('Chat error:', err);
    } finally {
      setGeneratingAgents(prev => {
        const next = new Set(prev);
        next.delete(targetAgentId);
        return next;
      });
    }
  };

  const handleToggleSpeak = async (msg: ChatMessage) => {
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current = null;
    }
    AudioService.stopSpeech();

    if (speakingMsgId === msg.id) {
      setSpeakingMsgId(null);
    } else {
      setSpeakingMsgId(msg.id);
      // Attempt TTS first
      const ttsVoice = currentAgent.voiceTone || 'es-PE-CamilaNeural';
      const audio = await ApiService.playTTS(msg.content, ttsVoice);
      if (!audio) {
        AudioService.speakText(msg.content, msg.agentId, () => setSpeakingMsgId(null));
      } else {
        activeAudioRef.current = audio;
        audio.onended = () => {
          setSpeakingMsgId(null);
          activeAudioRef.current = null;
        };
      }
    }
  };

  const suggestedPrompts = [
    `¿Puedo comer un plato con salsa de maní?`,
    `¿Cuáles son mis medicamentos de hoy?`,
    `¿Cómo está el clima en ${locationProfile.city}?`
  ];

  return (
    <div className="flex flex-col h-full bg-[#F5F1E8] text-[#2C3E50] relative overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-[#E3DCCB] px-6 py-4 flex items-center justify-between shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shadow"
            style={{ backgroundColor: currentAgent.colorPrimary }}
          >
            {currentAgent.name[0]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif font-bold text-lg text-[#1E3A5F]">{currentAgent.name}</h2>
              <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-[#4A9B9D]/15 text-[#4A9B9D] font-medium">
                {currentAgent.specialty}
              </span>
            </div>
            <p className="text-xs italic text-[#6B7F8C] font-serif">"{currentAgent.catchphrase}"</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoAgent(!autoAgent)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors border ${
              autoAgent
                ? 'bg-[#1E3A5F] text-white border-[#1E3A5F]'
                : 'bg-[#F5F1E8] text-[#2C3E50] border-[#E3DCCB]'
            }`}
          >
            {autoAgent ? '🤖 Auto-Router ON' : '⚙️ Agente Fijo'}
          </button>
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="p-1.5 text-[#6B7F8C] hover:text-[#C0392B] hover:bg-red-50 rounded-lg transition-colors"
              title="Borrar historial de este agente"
            >
              <RefreshCw size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 max-w-md mx-auto py-12">
            <div
              className="w-16 h-16 rounded-full text-white font-serif font-bold text-3xl flex items-center justify-center shadow-lg"
              style={{ backgroundColor: currentAgent.colorPrimary }}
            >
              {currentAgent.name[0]}
            </div>
            <h3 className="text-2xl font-serif font-bold text-[#1E3A5F]">
              Hola {userProfile.name}, soy {currentAgent.name}
            </h3>
            <p className="text-sm text-[#6B7F8C] italic font-serif">"{currentAgent.catchphrase}"</p>
            <p className="text-xs text-[#6B7F8C]">
              {currentAgent.specialty} · Este es tu chat privado con {currentAgent.name}.
              Tus mensajes solo aparecen aquí.
            </p>
            <div className="grid grid-cols-1 gap-2 w-full pt-2">
              {suggestedPrompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => setInputText(prompt)}
                  className="p-3 bg-white border border-[#E3DCCB] rounded-xl text-xs text-left hover:bg-[#1E3A5F] hover:text-white transition-all shadow-sm"
                >
                  "{prompt}"
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}
              >
                {!isUser && (
                  <div className="flex items-center gap-2 text-xs font-mono text-[#6B7F8C] pl-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: currentAgent.colorAccent }} />
                    <span className="font-bold text-[#1E3A5F]">{currentAgent.name}</span>
                    <span>· {msg.timestamp}</span>
                  </div>
                )}

                <div
                  className={`max-w-2xl rounded-2xl p-4 sm:p-5 shadow-sm space-y-3 ${
                    isUser
                      ? 'bg-[#1E3A5F] text-white rounded-br-none'
                      : 'bg-white border border-[#E3DCCB] text-[#2C3E50] rounded-bl-none'
                  }`}
                >
                  {/* File attachment */}
                  {msg.fileAttachment && (
                    <div className="p-2.5 rounded-xl bg-black/10 border border-white/20 flex items-center gap-3 text-xs">
                      {msg.fileAttachment.type === 'image'
                        ? <ImageIcon size={20} className="text-[#4A9B9D]" />
                        : <FileText size={20} className="text-[#B8924A]" />}
                      <div>
                        <div className="font-bold">{msg.fileAttachment.name}</div>
                        <div className="opacity-70 text-[10px]">{msg.fileAttachment.sizeFormatted}</div>
                      </div>
                    </div>
                  )}

                  {/* Thinking steps */}
                  {!isUser && msg.thinkingSteps && msg.thinkingSteps.length > 0 && (
                    <div className="p-3 bg-[#F5F1E8] border border-[#E3DCCB] rounded-xl text-xs space-y-1 font-mono text-[#6B7F8C]">
                      <div className="flex items-center gap-1.5 font-bold text-[#1E3A5F]">
                        <Brain size={14} className="text-[#4A9B9D] animate-pulse" />
                        <span>Proceso Cognitivo</span>
                      </div>
                      {msg.thinkingSteps.map((step: string, idx: number) => (
                        <div key={idx} className="text-[11px] text-[#2C3E50]">{step}</div>
                      ))}
                    </div>
                  )}

                  {/* Content */}
                  <div className={`text-sm leading-relaxed ${isUser ? 'text-white' : 'text-[#2C3E50]'}`}>
                    {isUser ? (
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    ) : (
                      <div className="markdown-body space-y-4">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeRaw]}
                          components={{
                          strong: ({node: _node, ...props}: any) => <span className="font-bold text-[#1E3A5F]" {...props} />,
                          p: ({node: _node, ...props}: any) => <p className="mb-3 last:mb-0 leading-relaxed" {...props} />,
                          ul: ({node: _node, ...props}: any) => <ul className="list-disc pl-5 mb-3 space-y-1" {...props} />,
                          ol: ({node: _node, ...props}: any) => <ol className="list-decimal pl-5 mb-3 space-y-1" {...props} />,
                          li: ({node: _node, ...props}: any) => <li className="pl-1" {...props} />,
                          h1: ({node: _node, ...props}: any) => <h1 className="text-xl font-bold mb-3 mt-4" style={{ color: currentAgent.colorPrimary }} {...props} />,
                          h2: ({node: _node, ...props}: any) => <h2 className="text-lg font-bold mb-2 mt-4" style={{ color: currentAgent.colorPrimary }} {...props} />,
                          h3: ({node: _node, ...props}: any) => <h3 className="text-md font-bold mb-2 mt-3" style={{ color: currentAgent.colorPrimary }} {...props} />,
                          a: ({node: _node, ...props}: any) => <a className="underline transition-colors font-medium hover:opacity-80" style={{ color: currentAgent.colorPrimary }} target="_blank" rel="noopener noreferrer" {...props} />,
                          blockquote: ({node: _node, ...props}: any) => (
                            <blockquote 
                              className="border-l-4 pl-4 py-1 my-3 bg-[#F5F1E8]/50 italic text-[#6B7F8C] rounded-r-lg" 
                              style={{ borderLeftColor: currentAgent.colorPrimary }} 
                              {...props} 
                            />
                          ),
                          table: ({node: _node, ...props}: any) => (
                            <div className="overflow-x-auto my-4 rounded-lg border shadow-sm" style={{ borderColor: `${currentAgent.colorPrimary}30` }}>
                              <table className="w-full text-left text-sm" {...props} />
                            </div>
                          ),
                          thead: ({node: _node, ...props}: any) => <thead className="bg-[#F5F1E8] text-[#1E3A5F]" {...props} />,
                          th: ({node: _node, ...props}: any) => <th className="px-4 py-3 font-bold border-b" style={{ borderColor: `${currentAgent.colorPrimary}30` }} {...props} />,
                          td: ({node: _node, ...props}: any) => <td className="px-4 py-3 border-b border-[#E3DCCB] last:border-0" {...props} />,
                          tr: ({node: _node, ...props}: any) => <tr className="hover:bg-[#F5F1E8]/30 transition-colors" {...props} />,
                          /* eslint-disable @typescript-eslint/no-explicit-any */
                          code({node: _node, inline, className, children, ...props}: any) {
                            const match = /language-(\w+)/.exec(className || '')
                            return !inline && match ? (
                              <div className="rounded-lg overflow-hidden my-3 border border-[#E3DCCB]">
                                <div className="bg-[#E3DCCB]/30 px-3 py-1 text-[10px] font-mono text-[#6B7F8C] uppercase flex justify-between items-center">
                                  {match[1]}
                                </div>
                                <SyntaxHighlighter
                                  {...props}
                                  children={String(children).replace(/\n$/, '')}
                                  style={oneLight}
                                  language={match[1]}
                                  PreTag="div"
                                  customStyle={{ margin: 0, padding: '1rem', background: '#FAFAFA', fontSize: '0.85rem' }}
                                />
                              </div>
                            ) : (
                              <code {...props} className="bg-[#E3DCCB]/40 px-1.5 py-0.5 rounded font-mono text-xs font-semibold" style={{ color: currentAgent.colorPrimary }}>
                                {children}
                              </code>
                            )
                          }
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                      </div>
                    )}
                  </div>
                  {/* Model footer */}
                  {!isUser && msg.modelUsed && (
                    <div className="pt-2 border-t border-[#E3DCCB]/60 flex flex-wrap items-center justify-between text-[10px] font-mono text-[#6B7F8C]">
                      <span>🧠 {msg.modelUsed} ({msg.modelRAM}) · {msg.isLocal ? '📍 Local' : '☁️ Cloud'}</span>
                      <span>💡 {msg.decisionReason}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {!isUser && (
                  <div className="flex items-center gap-2 text-xs text-[#6B7F8C] pl-1 pt-1">
                    <button
                      onClick={() => handleToggleSpeak(msg)}
                      className="p-1 hover:text-[#1E3A5F] rounded"
                      title="Escuchar respuesta"
                    >
                      {speakingMsgId === msg.id
                        ? <VolumeX size={14} className="text-[#C0392B]" />
                        : <Volume2 size={14} />}
                    </button>
                    <button
                      onClick={() => removeMessage(activeAgentId, msg.id)}
                      className="p-1 hover:text-[#C0392B] rounded"
                      title="Borrar mensaje"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Generating indicator */}
        {generatingAgents.has(activeAgentId) && (
          <div className="flex items-center gap-3 p-4 bg-white border border-[#4A9B9D]/40 rounded-2xl max-w-lg shadow-md animate-pulse">
            <div
              className="w-9 h-9 rounded-full text-white flex items-center justify-center font-bold font-serif text-lg shrink-0"
              style={{ backgroundColor: currentAgent.colorPrimary }}
            >
              {currentAgent.name[0]}
            </div>
            <div className="space-y-1 min-w-0">
              <div className="text-xs font-mono font-bold text-[#1E3A5F]">
                {currentAgent.name} está generando...
              </div>
              <p className="text-[11px] text-[#4A9B9D] font-mono">
                🧠 {currentAgent.id === 'tupac' ? 'gemma4:e2b (7.2GB)' : currentAgent.id === 'kipu' || currentAgent.id === 'aya' ? 'gemma4:12b (7.6GB)' : 'gemma4:e4b (9.6GB)'}
              </p>
              <p className="text-[10px] text-[#6B7F8C]">RAG Qdrant · Grafo Neo4j · Datos Perú</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="p-4 bg-white border-t border-[#E3DCCB] shrink-0 z-10 space-y-2">
        {attachedFile && (
          <div className="flex items-center justify-between p-2 bg-[#F5F1E8] rounded-xl text-xs border border-[#E3DCCB]">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-[#4A9B9D]" />
              <span className="font-bold">{attachedFile.name}</span>
              <span className="text-[#6B7F8C]">({attachedFile.sizeFormatted})</span>
            </div>
            <button onClick={() => setAttachedFile(null)} className="text-[#C0392B] font-bold p-1">✕</button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*,.pdf,.csv,.xlsx,.txt,.mp3"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 text-[#6B7F8C] hover:text-[#1E3A5F] hover:bg-[#F5F1E8] rounded-xl transition-colors"
            title="Adjuntar archivo"
          >
            <Paperclip size={20} />
          </button>

          <button
            onClick={handleToggleMic}
            className={`p-2.5 rounded-xl transition-colors ${
              isListening ? 'bg-[#C0392B] text-white animate-pulse' : 'text-[#6B7F8C] hover:text-[#1E3A5F] hover:bg-[#F5F1E8]'
            }`}
            title="Hablar por micrófono"
          >
            <Mic size={20} />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
            placeholder={`Escríbele a ${currentAgent.name}...`}
            disabled={generatingAgents.has(activeAgentId)}
            className="flex-1 px-4 py-2.5 bg-[#F5F1E8]/60 border border-[#E3DCCB] rounded-xl text-sm text-[#2C3E50] focus:outline-none focus:ring-2 focus:ring-[#4A9B9D]"
          />

          {generatingAgents.has(activeAgentId) ? (
            <button
              onClick={() => {
                setGeneratingAgents(prev => {
                  const next = new Set(prev);
                  next.delete(activeAgentId);
                  return next;
                });
              }}
              className="p-2.5 bg-[#C0392B] hover:bg-red-700 text-white rounded-xl transition-colors shadow flex items-center gap-1 text-xs font-mono"
              title="Detener"
            >
              <Square size={16} />
              <span>STOP</span>
            </button>
          ) : (
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim() && !attachedFile}
              className="p-2.5 bg-[#1E3A5F] hover:bg-[#2C3E50] disabled:opacity-40 text-white rounded-xl transition-colors shadow"
            >
              <Send size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
