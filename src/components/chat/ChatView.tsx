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
import { useEngineConfig } from '../../context/EngineConfigContext';
import { AGENT_VOICE_PROFILES } from '../../data/agentVoices';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { GmailDraftCard } from './GmailDraftCard';
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
  const [audioLevel, setAudioLevel] = useState(0);
  const [autoAgent, setAutoAgent] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  // Pulso de nivel de audio (micrófono o TTS) para animación al hablar
  useEffect(() => {
    AudioService.registerAudioLevelCallback((level) => setAudioLevel(level));
    return () => AudioService.registerAudioLevelCallback(() => undefined);
  }, []);

  // Motor configurable (Fase 2): manual = un solo modelo para todos; router = enrutado automático
  const { engineMode, manualModel, enabledAgents } = useEngineConfig();

  // Current agent data (solo agentes activos)
  const currentAgent =
    AGENTS_CATALOG.find((a) => a.id === activeAgentId && enabledAgents.includes(a.id)) ||
    AGENTS_CATALOG.find((a) => enabledAgents.includes(a.id)) ||
    AGENTS_CATALOG[0];

  // Messages for the currently active agent
  const messages = useMemo(() => messagesMap[activeAgentId] || [], [messagesMap, activeAgentId]);

  // When switching agents, clear input but DO NOT stop background generation
  useEffect(() => {
    setInputText('');
    setAttachedFile(null);
  }, [activeAgentId]);

  // Auto-scroll to bottom (removed smooth behavior to prevent jumping during rapid stream)
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView();
  }, [messages, generatingAgents]);

  // Poll for background notifications (Gmail drafts)
  useEffect(() => {
    let isMounted = true;
    const pollInterval = setInterval(async () => {
      const notifs = await ApiService.checkNotifications();
      if (isMounted && notifs && notifs.length > 0) {
        notifs.forEach(notif => {
          const notificationMsg: ChatMessage = {
            id: `msg-maru-${Date.now()}-${Math.random()}`,
            timestamp: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
            sender: 'maru',
            agentId: 'aya', // Default background agent
            agentName: 'Aya (Fondo)',
            content: 'Se ha detectado un correo de alta prioridad y he redactado un borrador sugerido. Por favor, revisa el contenido.',
            isLocal: true,
            gmailDraftNotification: notif
          };
          
          setMessagesMap(prev => {
            const agentMsgs = [...(prev['aya'] || []), notificationMsg];
            StorageService.saveAgentMessages('aya', agentMsgs);
            return { ...prev, ['aya']: agentMsgs };
          });
        });
      }
    }, 5000); // Check every 5 seconds
    
    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, []);

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

  // Micrófono: Whisper local (/stt) si hay backend; si no, Web Speech es-PE
  const handleToggleMic = async () => {
    if (isListening) {
      AudioService.stopListening();
      setIsListening(false);
    } else {
      setIsListening(true);
      const mode = await AudioService.startWhisperOrSpeech(
        (transcript) => setInputText(transcript),
        () => setIsListening(false),
        () => setIsListening(false)
      );
      if (!mode) setIsListening(false);
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
      if (file.type.includes('pdf') || file.name.toLowerCase().endsWith('.pdf')) fileType = 'pdf';
      else if (file.type.includes('sheet') || file.name.endsWith('.xlsx')) fileType = 'excel';
      else if (file.type.includes('csv') || file.name.endsWith('.csv') || file.type.startsWith('text/') || /\.(txt|md|json|log)$/i.test(file.name)) fileType = 'text';
      else if (file.type.includes('audio')) fileType = 'audio';
      else if (!file.type.startsWith('image/')) fileType = 'text';
      setAttachedFile({
        name: file.name, type: fileType,
        mimeType: file.type || (fileType === 'pdf' ? 'application/pdf' : 'text/plain'),
        dataBase64: base64,
        sizeFormatted: file.size > 1024 * 1024
          ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
          : `${(file.size / 1024).toFixed(1)} KB`
      });
    };
    reader.readAsDataURL(file);
    // Permitir re-seleccionar el mismo archivo
    e.target.value = '';
  };

  // Send message
  const handleSendMessageWithUpgrade = async (overridePrompt?: string, confirmUpgrade?: boolean) => {
    const userMsgText = overridePrompt || inputText.trim();
    if (!userMsgText && !attachedFile) return;

    const currentAttachment = attachedFile;
    const targetAgentId = activeAgentId; // capture the agent at send time

    if (!overridePrompt) {
      setInputText('');
      setAttachedFile(null);
    }
    setGeneratingAgents(prev => new Set(prev).add(targetAgentId));

    if (!overridePrompt) {
      // Mantener dataBase64 en imágenes (preview); omitirlo en PDFs/docs grandes
      const storedAttachment = currentAttachment
        ? {
            ...currentAttachment,
            dataBase64:
              currentAttachment.type === 'image' && (currentAttachment.dataBase64?.length || 0) < 2_500_000
                ? currentAttachment.dataBase64
                : undefined
          }
        : undefined;
      const userMsg: ChatMessage = {
        id: `msg-usr-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
        sender: 'user',
        content: userMsgText || (currentAttachment ? `[Archivo: ${currentAttachment.name}]` : ''),
        fileAttachment: storedAttachment
      };
      addMessage(targetAgentId, userMsg);
    }

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
      
      addMessage(targetAgentId, placeholderMsg);
      await new Promise(r => setTimeout(r, 400));

      const data = await ApiService.sendChatMessage({
        prompt: userMsgText,
        agentId: targetAgentId,
        manualAgent: !autoAgent,
        confirmUpgrade: confirmUpgrade || false,
        userContext: userProfile.customContext || "",
        userProfile,
        healthProfile,
        locationProfile,
        engineMode,
        manualModel: engineMode === 'manual' ? manualModel : undefined,
        fileAttachment: currentAttachment as unknown as { name: string; type: string; mimeType: string; dataBase64?: string; sizeFormatted: string },
        onUpdate: (content: string) => {
          setMessagesMap(prev => {
            const agentMsgs = [...(prev[targetAgentId] || [])];
            const msgIdx = agentMsgs.findIndex(m => m.id === botMsgId);
            if (msgIdx !== -1) {
              agentMsgs[msgIdx] = { ...agentMsgs[msgIdx], content, isFinal: false };
            }
            return { ...prev, [targetAgentId]: agentMsgs };
          });
        },
        onThinkingStep: (step: string) => {
          setMessagesMap(prev => {
            const agentMsgs = [...(prev[targetAgentId] || [])];
            const msgIdx = agentMsgs.findIndex(m => m.id === botMsgId);
            if (msgIdx !== -1) {
              const currentSteps = agentMsgs[msgIdx].thinkingSteps || [];
              agentMsgs[msgIdx] = { 
                ...agentMsgs[msgIdx], 
                thinkingSteps: [...currentSteps, step]
              };
            }
            return { ...prev, [targetAgentId]: agentMsgs };
          });
        }
      });

      if (data) {
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
              upgradeRequest: data.upgradeRequest,
              isFinal: true,
              sourceInfo: `Respuesta Cognitiva (${data.modelUsed})`
            };
            StorageService.saveAgentMessages(targetAgentId, agentMsgs);
          }
          return { ...prev, [targetAgentId]: agentMsgs };
        });
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

  const handleSendMessage = () => handleSendMessageWithUpgrade();

  const handleConfirmUpgrade = (lastUserPrompt: string, msgId: string) => {
    removeMessage(activeAgentId, msgId);
    handleSendMessageWithUpgrade(lastUserPrompt, true);
  };

  const handleToggleSpeak = async (msg: ChatMessage) => {
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current = null;
    }
    AudioService.stopSpeech();

    if (speakingMsgId === msg.id) {
      setSpeakingMsgId(null);
      setAudioLevel(0);
    } else {
      setSpeakingMsgId(msg.id);
      // Kipu: no leer código crudo — monólogo breve sobre la acción
      const speakContent =
        msg.agentId === 'kipu' && /```/.test(msg.content)
          ? msg.content
              .replace(/```[\s\S]*?```/g, '')
              .trim() || 'Listo. Revisé el código y dejé los cambios listos en el editor.'
          : msg.content;
      const agentForVoice = (msg.agentId || activeAgentId) as AgentId;
      const ttsVoice = AGENT_VOICE_PROFILES[agentForVoice]?.edgeVoice || 'es-PE-CamilaNeural';
      const audio = await ApiService.playTTS(speakContent, ttsVoice);
      if (!audio) {
        AudioService.speakText(speakContent, msg.agentId || activeAgentId, () => {
          setSpeakingMsgId(null);
          setAudioLevel(0);
        });
      } else {
        activeAudioRef.current = audio;
        audio.onended = () => {
          setSpeakingMsgId(null);
          activeAudioRef.current = null;
          setAudioLevel(0);
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
    <div className="flex flex-col h-full bg-[var(--maru-read-bg)] text-[var(--maru-text)] relative overflow-hidden">
      <div className="bg-white/95 backdrop-blur-xl border-b border-[var(--maru-border-soft)] px-4 sm:px-6 py-3 flex items-center justify-between gap-3 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-[10px] flex items-center justify-center text-white font-display font-bold text-lg shadow-sm transition-transform duration-75"
            style={{
              backgroundColor: currentAgent.colorPrimary || 'var(--maru-primary)',
              transform: speakingMsgId || isListening ? `scale(${1 + audioLevel * 0.22})` : undefined,
              boxShadow:
                speakingMsgId || isListening
                  ? `0 0 ${8 + audioLevel * 22}px ${currentAgent.colorAccent}66`
                  : undefined
            }}
          >
            {currentAgent.name[0]}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-display font-bold text-lg text-[var(--maru-text)]">{currentAgent.name}</h2>
              <span className="maru-chip hidden sm:inline-flex">
                {currentAgent.specialty}
              </span>
            </div>
            <p className="hidden sm:block text-xs text-[var(--maru-text-muted)] font-sans">&ldquo;{currentAgent.catchphrase}&rdquo;</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoAgent(!autoAgent)}
            className={`min-h-10 px-3 py-1.5 rounded-[10px] text-[11px] font-mono transition-colors border ${
              autoAgent
                ? 'bg-[var(--maru-primary-soft)] text-[var(--maru-primary)] border-[var(--maru-primary)]/30'
                : 'bg-transparent text-[var(--maru-text-muted)] border-[var(--maru-border-soft)]'
            }`}
          >
            {autoAgent ? 'Enrutado automático' : 'Agente fijo'}
          </button>
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="p-1.5 text-[var(--maru-text-muted)] hover:text-rose-400 hover:bg-white/5 rounded-lg transition-colors"
              title="Borrar historial de este agente"
            >
              <RefreshCw size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Messages — warm reading surface for long-form clarity */}
      <div className="flex-1 overflow-y-auto maru-read-scroll p-4 sm:p-6">
        <div className="mx-auto max-w-3xl space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 max-w-md mx-auto py-12">
            <div
              className="w-16 h-16 rounded-2xl text-white font-display font-bold text-3xl flex items-center justify-center shadow-lg bg-[var(--maru-primary)]"
            >
              {currentAgent.name[0]}
            </div>
            <h3 className="text-2xl font-display font-bold text-[var(--maru-navy)]">
              Hola {userProfile.name}, soy {currentAgent.name}
            </h3>
            <p className="text-sm text-[var(--maru-read-muted)] italic font-serif">&ldquo;{currentAgent.catchphrase}&rdquo;</p>
            <p className="text-xs text-[var(--maru-read-muted)]">
              {currentAgent.specialty} · Este es tu chat privado con {currentAgent.name}.
              Tus mensajes solo aparecen aquí.
            </p>
            <div className="grid grid-cols-1 gap-2 w-full pt-2">
              {suggestedPrompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => setInputText(prompt)}
                  className="min-h-10 p-3 bg-white border border-[var(--maru-border)] rounded-[10px] text-sm text-left hover:bg-[var(--maru-primary-soft)] hover:border-[var(--maru-primary)] transition-all"
                >
                  &ldquo;{prompt}&rdquo;
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
                  <div className="flex items-center gap-2 text-xs font-sans text-[var(--maru-text-muted)] pl-1">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: currentAgent.colorAccent }} />
                    <span className="font-semibold text-[var(--maru-text)]">{currentAgent.name}</span>
                    <span>· {msg.timestamp}</span>
                  </div>
                )}

                <div
                  className={`max-w-[min(100%,46rem)] rounded-[var(--maru-radius)] p-3 sm:p-4 space-y-2 ${
                    isUser
                      ? 'bg-[var(--maru-primary)] text-white rounded-br-sm'
                      : 'bg-white border border-[var(--maru-border-soft)] text-[var(--maru-text)] rounded-bl-sm shadow-[var(--maru-shadow-sm)]'
                  }`}
                >
                  {/* File attachment */}
                  {msg.fileAttachment && (
                    <div className={`rounded-xl overflow-hidden text-xs ${isUser ? 'bg-black/15 border border-white/20' : 'bg-[var(--maru-surface-muted)] border border-[var(--maru-border-soft)]'}`}>
                      {msg.fileAttachment.type === 'image' && msg.fileAttachment.dataBase64 ? (
                        <img
                          src={msg.fileAttachment.dataBase64}
                          alt={msg.fileAttachment.name}
                          className="max-h-52 w-full object-cover"
                        />
                      ) : null}
                      <div className="p-2.5 flex items-center gap-3">
                        {msg.fileAttachment.type === 'image'
                          ? <ImageIcon size={18} className={isUser ? 'text-white/80' : 'text-[#4A9B9D]'} />
                          : <FileText size={18} className={isUser ? 'text-white/80' : 'text-[#B8924A]'} />}
                        <div className="min-w-0">
                          <div className="font-bold truncate">{msg.fileAttachment.name}</div>
                          <div className="opacity-70 text-[10px]">
                            {msg.fileAttachment.sizeFormatted}
                            {msg.fileAttachment.type === 'image' ? ' · Vista previa' : ' · Documento para RAG'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Thinking steps */}
                  {!isUser && msg.thinkingSteps && msg.thinkingSteps.length > 0 && (
                    <details className="maru-disclosure bg-[var(--maru-surface-muted)] border border-[var(--maru-border-soft)] rounded-[10px] px-3 text-xs font-mono text-[var(--maru-text-muted)]">
                      <summary>
                        <span className="flex items-center gap-1.5 font-bold text-[var(--maru-text)]">
                        <Brain size={14} className="text-[#4A9B9D] animate-pulse" />
                        Proceso cognitivo
                        </span>
                      </summary>
                      <div className="pb-3 space-y-1">
                      {msg.thinkingSteps.map((step: string, idx: number) => (
                        <div key={idx} className="text-[11px] text-[#2C3E50]">{step}</div>
                      ))}
                      </div>
                    </details>
                  )}

                  {/* Upgrade Request Card (Point 10) */}
                  {!isUser && msg.upgradeRequest && (
                    <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl space-y-2 text-xs text-amber-900">
                      <div className="font-bold flex items-center gap-2 text-amber-800">
                        <span>⚠️ Confirmación de Recursos de IA Local</span>
                      </div>
                      <p className="leading-relaxed">
                        {msg.upgradeRequest.reason}
                      </p>
                      <div className="text-[11px] opacity-80 font-mono">
                        Modelo sugerido: <strong>{msg.upgradeRequest.recommendedModel}</strong> (~{msg.upgradeRequest.ramRequired} RAM)
                      </div>
                      <div className="pt-2 flex items-center gap-2">
                        <button
                          onClick={() => {
                            const lastUserMsg = [...messages].reverse().find(m => m.sender === 'user')?.content || '';
                            handleConfirmUpgrade(lastUserMsg, msg.id);
                          }}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-sm transition-colors text-xs"
                        >
                          Sí, elevar a {msg.upgradeRequest.recommendedModel}
                        </button>
                        <button
                          onClick={() => {
                            const lastUserMsg = [...messages].reverse().find(m => m.sender === 'user')?.content || '';
                            removeMessage(activeAgentId, msg.id);
                            handleSendMessageWithUpgrade(lastUserMsg, false);
                          }}
                          className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors text-xs"
                        >
                          No, continuar con e2b-q4 (3.3 GB)
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Gmail Draft Notification */}
                  {!isUser && msg.gmailDraftNotification && (
                    <GmailDraftCard
                      notification={msg.gmailDraftNotification}
                      onSend={() => removeMessage(activeAgentId, msg.id)}
                      onEdit={() => removeMessage(activeAgentId, msg.id)}
                      onDiscard={() => removeMessage(activeAgentId, msg.id)}
                    />
                  )}

                  {/* Content */}
                  <div className={`text-[15px] leading-7 ${isUser ? 'text-white' : 'text-[var(--maru-text)]'}`}>
                    {isUser ? (
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    ) : (
                      <div className="markdown-body space-y-4">
                        {/* If no content yet but generating, show a thinking cursor */}
                        {msg.content === '' && !msg.upgradeRequest && msg.agentId && generatingAgents.has(msg.agentId) && (
                          <div className="flex items-center gap-2 text-[#4A9B9D] font-mono text-xs animate-pulse">
                            <span className="inline-block w-2 h-4 bg-[#4A9B9D]"></span> Pensando...
                          </div>
                        )}
                        {!msg.isFinal && msg.content !== '' ? (
                          <div className="text-gray-500 font-mono text-xs whitespace-pre-wrap opacity-70 animate-pulse">
                            {msg.content}
                            <span className="inline-block w-1.5 h-3.5 bg-gray-400 ml-1"></span>
                          </div>
                        ) : (
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
                        )}
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
                      className={`p-1 hover:text-[#1E3A5F] rounded flex items-center gap-1 ${speakingMsgId === msg.id ? 'text-[#C0392B]' : ''}`}
                      title="Escuchar respuesta"
                    >
                      {speakingMsgId === msg.id
                        ? <VolumeX size={14} />
                        : <Volume2 size={14} />}
                      {speakingMsgId === msg.id && (
                        <span className="flex items-end gap-px h-3" aria-hidden>
                          {[0.4, 0.9, 0.55].map((w, i) => (
                            <span
                              key={i}
                              className="w-0.5 rounded-full bg-current"
                              style={{ height: `${Math.max(25, audioLevel * 100 * w)}%` }}
                            />
                          ))}
                        </span>
                      )}
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
      </div>

      {/* Input bar */}
      <div className="p-3 sm:p-4 bg-white/95 border-t border-[var(--maru-read-line)] shrink-0 z-10 space-y-2 backdrop-blur-sm">
        <div className="mx-auto max-w-3xl space-y-2">
        {attachedFile && (
          <div className="flex items-stretch gap-3 p-2 bg-[var(--maru-read-bg)] rounded-xl text-xs border border-[var(--maru-read-line)]">
            {attachedFile.type === 'image' && attachedFile.dataBase64 ? (
              <img
                src={attachedFile.dataBase64}
                alt={attachedFile.name}
                className="w-14 h-14 rounded-lg object-cover shrink-0 border border-[var(--maru-border-soft)]"
              />
            ) : (
              <div className="w-14 h-14 rounded-lg bg-white border border-[var(--maru-border-soft)] flex items-center justify-center shrink-0">
                <FileText size={22} className="text-[var(--maru-gold-deep)]" />
              </div>
            )}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <span className="font-bold truncate">{attachedFile.name}</span>
              <span className="text-[var(--maru-read-muted)]">
                {attachedFile.sizeFormatted}
                {attachedFile.type === 'image'
                  ? ' · Se procesará con OCR local'
                  : ' · Se indexará en la bóveda RAG'}
              </span>
            </div>
            <button onClick={() => setAttachedFile(null)} className="text-[#C0392B] font-bold p-1 self-start" aria-label="Quitar adjunto">✕</button>
          </div>
        )}

        {isListening && (
          <div className="flex items-center justify-between gap-3 p-2.5 bg-[#C0392B]/10 rounded-xl text-xs border border-[#C0392B]/30">
            <div className="flex items-center gap-2 text-[#C0392B] font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C0392B] animate-ping" />
              Escuchando… (Whisper local o Web Speech)
            </div>
            <div className="flex items-end gap-0.5 h-5" aria-hidden>
              {[0.35, 0.7, 1, 0.55, 0.85].map((w, i) => (
                <span
                  key={i}
                  className="w-1 rounded-full bg-[#C0392B] transition-all duration-75"
                  style={{ height: `${Math.max(20, audioLevel * 100 * w)}%` }}
                />
              ))}
            </div>
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
            className="p-2.5 text-[var(--maru-read-muted)] hover:text-[var(--maru-navy)] hover:bg-[var(--maru-read-bg)] rounded-xl transition-colors"
            title="Adjuntar archivo"
          >
            <Paperclip size={20} />
          </button>

          <button
            onClick={handleToggleMic}
            className={`p-2.5 rounded-xl transition-colors ${
              isListening ? 'bg-[#C0392B] text-white animate-pulse' : 'text-[var(--maru-read-muted)] hover:text-[var(--maru-navy)] hover:bg-[var(--maru-read-bg)]'
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
            className="maru-field flex-1"
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
              className="maru-btn-primary !bg-[var(--maru-danger)] !border-[var(--maru-danger)] px-3"
              title="Detener"
            >
              <Square size={16} />
              <span>STOP</span>
            </button>
          ) : (
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim() && !attachedFile}
              className="maru-btn-primary px-3 disabled:opacity-40"
            >
              <Send size={18} />
            </button>
          )}
        </div>
        </div>
      </div>
    </div>
  );
};
