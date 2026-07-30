import React, { useState } from 'react';
import { Play, Save, Code2, Terminal } from 'lucide-react';
import { ChatView } from '../chat/ChatView';
import { UserProfile, HealthProfile, LocationProfile, AgentId } from '../../types';

interface KipuViewProps {
  userProfile: UserProfile;
  healthProfile: HealthProfile;
  locationProfile: LocationProfile;
}

export const KipuView: React.FC<KipuViewProps> = ({ userProfile, healthProfile, locationProfile }) => {
  const [code, setCode] = useState(`def hello_maru():\n    print("¡Hola desde MARU OS!")\n    \nhello_maru()`);
  const [output, setOutput] = useState("");

  const handleRunCode = () => {
    setOutput("> Ejecutando script...\n¡Hola desde MARU OS!\n\n[Proceso terminado con código 0]");
  };

  return (
    <div className="flex h-full w-full bg-[#F5F1E8]">
      {/* Left side: Kipu Chat */}
      <div className="w-1/2 border-r border-[#2C3E50]/20 flex flex-col">
        <ChatView 
          activeAgentId="kipu" 
          onSelectAgent={() => {}} 
          userProfile={userProfile}
          healthProfile={healthProfile}
          locationProfile={locationProfile}
        />
      </div>

      {/* Right side: Code Editor & Terminal */}
      <div className="w-1/2 flex flex-col bg-[#1E1E1E] text-[#D4D4D4]">
        {/* Editor Toolbar */}
        <div className="h-12 border-b border-[#333] flex items-center justify-between px-4 bg-[#252526]">
          <div className="flex items-center gap-2 text-sm font-mono text-[#9CDCFE]">
            <Code2 size={16} /> script.py
          </div>
          <div className="flex items-center gap-2">
            <button className="p-1.5 hover:bg-[#333] rounded text-gray-400 hover:text-white transition-colors" title="Guardar">
              <Save size={16} />
            </button>
            <button 
              onClick={handleRunCode}
              className="flex items-center gap-1.5 px-3 py-1 bg-[#4A9B9D] hover:bg-[#387F81] text-white rounded text-xs font-bold transition-colors"
            >
              <Play size={14} /> Ejecutar
            </button>
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 p-4 overflow-auto">
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            className="w-full h-full bg-transparent text-[#CE9178] font-mono text-sm leading-relaxed resize-none focus:outline-none focus:ring-0"
            style={{ tabSize: 4 }}
          />
        </div>

        {/* Terminal Area */}
        <div className="h-1/3 border-t border-[#333] bg-[#1E1E1E] flex flex-col">
          <div className="flex items-center gap-2 px-4 py-2 border-b border-[#333] bg-[#252526] text-xs font-mono text-gray-400">
            <Terminal size={14} /> SALIDA
          </div>
          <div className="flex-1 p-4 overflow-auto text-xs font-mono whitespace-pre-wrap text-[#4AF626]">
            {output}
          </div>
        </div>
      </div>
    </div>
  );
};
