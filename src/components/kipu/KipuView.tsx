import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Save, Code2, Terminal, FolderPlus, FilePlus2, Sparkles, Folder } from 'lucide-react';
import { ChatView } from '../chat/ChatView';
import { UserProfile, HealthProfile, LocationProfile } from '../../types';
import { ApiService } from '../../services/apiService';
import { syncKipuProjects } from '../../services/knowledgeSync';

interface KipuViewProps {
  userProfile: UserProfile;
  healthProfile: HealthProfile;
  locationProfile: LocationProfile;
}

type Lang = 'python' | 'javascript' | 'typescript' | 'html';

interface KipuFile {
  id: string;
  name: string;
  lang: Lang;
  content: string;
}

interface KipuProject {
  id: string;
  name: string;
  files: KipuFile[];
  activeFileId: string;
}

const STORAGE_KEY = 'maru_kipu_projects';

const TEMPLATES: Record<Lang, string> = {
  python: `def hello_maru():\n    print("¡Hola desde MARU OS!")\n\nhello_maru()\n`,
  javascript: `function helloMaru() {\n  console.log("¡Hola desde MARU OS!");\n}\n\nhelloMaru();\n`,
  typescript: `function helloMaru(): void {\n  console.log("¡Hola desde MARU OS!");\n}\n\nhelloMaru();\n`,
  html: `<!doctype html>\n<html lang="es">\n  <body>\n    <h1>MARU OS</h1>\n    <script>console.log("Hola Kipu");</script>\n  </body>\n</html>\n`
};

const EXT: Record<Lang, string> = {
  python: 'py',
  javascript: 'js',
  typescript: 'ts',
  html: 'html'
};

function defaultProject(): KipuProject {
  const file: KipuFile = {
    id: 'f1',
    name: 'main.py',
    lang: 'python',
    content: TEMPLATES.python
  };
  return { id: 'p1', name: 'proyecto-maru', files: [file], activeFileId: file.id };
}

function loadProjects(): KipuProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as KipuProject[];
      if (Array.isArray(parsed) && parsed.length) return parsed;
    }
  } catch {
    /* ignore */
  }
  return [defaultProject()];
}

export const KipuView: React.FC<KipuViewProps> = ({ userProfile, healthProfile, locationProfile }) => {
  const [projects, setProjects] = useState<KipuProject[]>(() => loadProjects());
  const [projectId, setProjectId] = useState(() => loadProjects()[0]?.id || 'p1');
  const [output, setOutput] = useState('> Listo. Elige un archivo y ejecuta.');
  const [chatHint, setChatHint] = useState('');

  const project = projects.find((p) => p.id === projectId) || projects[0];
  const activeFile = project?.files.find((f) => f.id === project.activeFileId) || project?.files[0];

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }, [projects]);

  // Sync graph only when project structure changes (not every keystroke / not on first mount)
  const projectMeta = useMemo(
    () => projects.map((p) => `${p.id}:${p.name}:${p.files.length}`).join('|'),
    [projects]
  );
  const kipuSyncReady = useRef(false);
  useEffect(() => {
    if (!kipuSyncReady.current) {
      kipuSyncReady.current = true;
      return;
    }
    syncKipuProjects(
      projects,
      `Proyectos Kipu: ${projects.map((p) => p.name).join(', ')}`
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: structure fingerprint only
  }, [projectMeta]);

  const updateActiveContent = (content: string) => {
    if (!project || !activeFile) return;
    setProjects((prev) =>
      prev.map((p) =>
        p.id !== project.id
          ? p
          : {
              ...p,
              files: p.files.map((f) => (f.id === activeFile.id ? { ...f, content } : f))
            }
      )
    );
  };

  const selectFile = (fileId: string) => {
    setProjects((prev) => prev.map((p) => (p.id === project.id ? { ...p, activeFileId: fileId } : p)));
  };

  const createProject = () => {
    const name = `proyecto-${projects.length + 1}`;
    const file: KipuFile = {
      id: `f-${Date.now()}`,
      name: 'main.py',
      lang: 'python',
      content: TEMPLATES.python
    };
    const next: KipuProject = {
      id: `p-${Date.now()}`,
      name,
      files: [file],
      activeFileId: file.id
    };
    setProjects((prev) => [...prev, next]);
    setProjectId(next.id);
    setOutput(`> Proyecto «${name}» creado.`);
  };

  const addFile = (lang: Lang) => {
    if (!project) return;
    const file: KipuFile = {
      id: `f-${Date.now()}`,
      name: `nuevo.${EXT[lang]}`,
      lang,
      content: TEMPLATES[lang]
    };
    setProjects((prev) =>
      prev.map((p) =>
        p.id === project.id
          ? { ...p, files: [...p.files, file], activeFileId: file.id }
          : p
      )
    );
  };

  const handleRunCode = async () => {
    if (!activeFile) return;
    if (activeFile.lang === 'python') {
      setOutput(`> Ejecutando ${activeFile.name} en sandbox local…\n`);
      const res = await ApiService.execPython(activeFile.content, 8);
      if (res?.output) {
        setOutput(`> Ejecutando ${activeFile.name} (sandbox Python)\n${res.output}`);
      } else {
        // Fallback offline: extraer prints literales
        const prints = [...activeFile.content.matchAll(/print\((['"`])(.*?)\1\)/g)].map((m) => m[2]);
        setOutput(
          `> Backend offline — simulación local\n` +
            (prints.length ? prints.join('\n') + '\n' : '(sin print detectado)\n') +
            '\n[Simulación terminada]'
        );
      }
    } else if (activeFile.lang === 'javascript' || activeFile.lang === 'typescript') {
      try {
        // Sandbox JS mínimo (sin DOM / fetch)
        const logs: string[] = [];
        const sandboxConsole = { log: (...args: unknown[]) => logs.push(args.map(String).join(' ')) };
        const fn = new Function('console', activeFile.content.replace(/^export\s+/gm, ''));
        fn(sandboxConsole);
        setOutput(
          `> Ejecutando ${activeFile.name} (JS local)\n` +
            (logs.length ? logs.join('\n') + '\n' : '(sin console.log)\n') +
            '\n[Proceso terminado]'
        );
      } catch (err) {
        setOutput(`> Error JS:\n${err instanceof Error ? err.message : String(err)}`);
      }
    } else {
      setOutput(`> ${activeFile.name} listo para vista previa HTML.\n[Sin ejecución de servidor]`);
    }
  };

  const askImprove = () => {
    if (!activeFile) return;
    setChatHint(
      `Kipu, mejora este código ${activeFile.lang} del archivo ${activeFile.name}. Explica brevemente qué cambiaste (sin leer el código en voz alta):\n\n\`\`\`${activeFile.lang}\n${activeFile.content}\n\`\`\``
    );
    setOutput('> Pide a Kipu en el chat que mejore el código (hint cargado en el portapapeles local del panel).');
    void navigator.clipboard?.writeText(
      `Mejora este código ${activeFile.lang} y explica los cambios en un monólogo corto:\n\n${activeFile.content}`
    );
  };

  const langLabel = useMemo(() => activeFile?.lang || 'python', [activeFile]);

  return (
    <div className="flex flex-col xl:flex-row h-full w-full overflow-y-auto xl:overflow-hidden bg-[var(--maru-bg)]">
      <div className="w-full xl:w-1/2 min-h-[620px] xl:min-h-0 border-b xl:border-b-0 xl:border-r border-[var(--maru-border-soft)] flex flex-col">
        <ChatView
          activeAgentId="kipu"
          onSelectAgent={() => {}}
          userProfile={userProfile}
          healthProfile={healthProfile}
          locationProfile={locationProfile}
        />
        {chatHint && (
          <div className="px-3 py-2 text-[11px] bg-[#132c34] text-[#9CDCFE] border-t border-[#333] line-clamp-2">
            Hint IA copiado: pega en el chat para mejorar el archivo activo.
          </div>
        )}
      </div>

      <div className="w-full xl:w-1/2 min-h-[620px] flex bg-[#132c34] text-[#e6efec]">
        {/* File tree */}
        <div className="w-44 shrink-0 border-r border-[#333] bg-[#1e1e1e] flex flex-col">
          <div className="p-2 border-b border-[#333] flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono uppercase text-gray-400">Proyectos</span>
            <button onClick={createProject} className="p-1 hover:bg-[#333] rounded" title="Nuevo proyecto">
              <FolderPlus size={14} />
            </button>
          </div>
          <div className="p-2 space-y-1 overflow-y-auto">
            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => setProjectId(p.id)}
                className={`w-full text-left px-2 py-1.5 rounded text-xs flex items-center gap-1.5 ${
                  p.id === projectId ? 'bg-[#094771] text-white' : 'text-gray-400 hover:bg-[#2a2a2a]'
                }`}
              >
                <Folder size={12} /> {p.name}
              </button>
            ))}
          </div>
          <div className="mt-auto border-t border-[#333] p-2 space-y-1">
            <div className="text-[10px] font-mono uppercase text-gray-500 mb-1">Nuevo archivo</div>
            {(Object.keys(EXT) as Lang[]).map((lang) => (
              <button
                key={lang}
                onClick={() => addFile(lang)}
                className="w-full text-left px-2 py-1 rounded text-[11px] text-gray-400 hover:bg-[#2a2a2a] flex items-center gap-1"
              >
                <FilePlus2 size={12} /> .{EXT[lang]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <div className="h-12 border-b border-[#333] flex items-center justify-between px-3 bg-[#252526] gap-2">
            <div className="flex items-center gap-2 text-sm font-mono text-[#9CDCFE] min-w-0">
              <Code2 size={16} className="shrink-0" />
              <span className="truncate">{activeFile?.name || 'sin archivo'}</span>
              <span className="text-[10px] text-gray-500 uppercase">{langLabel}</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setOutput(`> Guardado local: ${project?.name}/${activeFile?.name}`)}
                className="p-1.5 hover:bg-[#333] rounded text-gray-400 hover:text-white"
                title="Guardar"
              >
                <Save size={16} />
              </button>
              <button
                onClick={askImprove}
                className="px-2 py-1 text-[11px] rounded bg-[#3A2E39] hover:bg-[#4a3a48] flex items-center gap-1"
                title="Pedir mejora a Kipu"
              >
                <Sparkles size={12} /> Mejorar
              </button>
              <button onClick={handleRunCode} className="maru-btn-primary !min-h-8 px-3 py-1 text-xs">
                <Play size={14} /> Ejecutar
              </button>
            </div>
          </div>

          <div className="flex gap-1 px-2 py-1 border-b border-[#333] bg-[#1e1e1e] overflow-x-auto">
            {project?.files.map((f) => (
              <button
                key={f.id}
                onClick={() => selectFile(f.id)}
                className={`px-2 py-1 rounded text-[11px] font-mono whitespace-nowrap ${
                  f.id === activeFile?.id ? 'bg-[#2d2d2d] text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {f.name}
              </button>
            ))}
          </div>

          <div className="flex-1 p-3 overflow-auto">
            <textarea
              value={activeFile?.content || ''}
              onChange={(e) => updateActiveContent(e.target.value)}
              spellCheck={false}
              className="w-full h-full min-h-[280px] bg-transparent text-[#CE9178] font-mono text-sm leading-relaxed resize-none focus:outline-none"
              style={{ tabSize: 4 }}
            />
          </div>

          <div className="h-36 border-t border-[#333] bg-[#1E1E1E] flex flex-col">
            <div className="flex items-center gap-2 px-4 py-2 border-b border-[#333] bg-[#252526] text-xs font-mono text-gray-400">
              <Terminal size={14} /> SALIDA
            </div>
            <div className="flex-1 p-3 overflow-auto text-xs font-mono whitespace-pre-wrap text-[#4AF626]">
              {output}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
