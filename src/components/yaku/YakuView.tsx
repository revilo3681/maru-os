import React, { useState } from 'react';
import { Landmark, Languages, BarChart3, MapPinned, Volume2, ArrowLeftRight, Loader2, Sparkles } from 'lucide-react';
import { ChatView } from '../chat/ChatView';
import { UserProfile, HealthProfile, LocationProfile } from '../../types';
import { PERU_SEED_DATA } from '../../data/seedPeru';
import { PERUVIAN_NATIVE_LANGUAGES, NATIVE_QUICK_WORDS } from '../../data/nativeLanguages';
import { ApiService } from '../../services/apiService';

interface YakuViewProps {
  userProfile: UserProfile;
  healthProfile: HealthProfile;
  locationProfile: LocationProfile;
}

const CULTURE_SPOTS = [
  { name: 'Caral', region: 'Lima', era: '3000 a.C.', note: 'Ciudad sagrada más antigua de América' },
  { name: 'Chavín de Huántar', region: 'Áncash', era: '900 a.C.', note: 'Centro ceremonial andino' },
  { name: 'Machu Picchu', region: 'Cusco', era: 's. XV', note: 'Llaqta inka de montaña' },
  { name: 'Chan Chan', region: 'La Libertad', era: 's. IX–XV', note: 'Capital chimú de adobe' }
];

export const YakuView: React.FC<YakuViewProps> = ({ userProfile, healthProfile, locationProfile }) => {
  const city = locationProfile.city || 'Chosica';
  const stats = PERU_SEED_DATA.ineiCities[city] || PERU_SEED_DATA.ineiCities['Lima'];
  
  // Translator states
  const [sourceLang, setSourceLang] = useState<string>('Español');
  const [targetLang, setTargetLang] = useState<string>('Quechua');
  const [inputText, setInputText] = useState<string>('Hola, ¿cómo estás?');
  const [translatedText, setTranslatedText] = useState<string>('');
  const [phoneticText, setPhoneticText] = useState<string>('');
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

  const swapLanguages = () => {
    const temp = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(temp);
    if (translatedText) {
      setInputText(translatedText);
      setTranslatedText('');
      setPhoneticText('');
    }
  };

  const handleTranslate = async (textToTranslate?: string) => {
    const text = textToTranslate ?? inputText;
    if (!text.trim()) return;

    setIsTranslating(true);
    try {
      const activeNativeLang = sourceLang === 'Español' ? targetLang : sourceLang;
      const dictSample = NATIVE_QUICK_WORDS[activeNativeLang] 
        ? NATIVE_QUICK_WORDS[activeNativeLang].map(w => `${w.es} = ${w.nat}`).join(', ')
        : '';

      const res = await ApiService.translateText(text, sourceLang, targetLang, dictSample);
      if (res && res.translation) {
        setTranslatedText(res.translation);
        setPhoneticText(res.phonetic || '');
      } else {
        setTranslatedText('No se pudo completar la traducción.');
        setPhoneticText('');
      }
    } catch (err) {
      console.error('Translation error:', err);
      setTranslatedText('Error al conectar con la IA de traducción.');
    } finally {
      setIsTranslating(false);
    }
  };

  const handlePlayAudio = async () => {
    if (!translatedText) return;
    setIsPlayingAudio(true);
    try {
      const textToSpeak = phoneticText || translatedText;
      const blob = await ApiService.getTtsAudio(textToSpeak, 'es-PE-AlexNeural');
      if (blob) {
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.onended = () => setIsPlayingAudio(false);
        audio.onerror = () => setIsPlayingAudio(false);
        await audio.play();
      } else {
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.lang = 'es-PE';
        utterance.onend = () => setIsPlayingAudio(false);
        utterance.onerror = () => setIsPlayingAudio(false);
        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {
      console.error("Audio playback error:", e);
      setIsPlayingAudio(false);
    }
  };

  const cities = Object.entries(PERU_SEED_DATA.ineiCities);
  const activeNativeLang = sourceLang === 'Español' ? targetLang : sourceLang;
  const currentQuickWords: Array<{ es: string; nat: string }> = NATIVE_QUICK_WORDS[activeNativeLang] || NATIVE_QUICK_WORDS['Quechua'] || [];

  return (
    <div className="flex flex-col xl:flex-row h-full w-full overflow-y-auto xl:overflow-hidden bg-[var(--maru-bg)]">
      <div className="w-full xl:w-1/2 min-h-[620px] xl:min-h-0 border-b xl:border-b-0 xl:border-r border-[var(--maru-border-soft)] flex flex-col">
        <ChatView
          activeAgentId="yaku"
          onSelectAgent={() => {}}
          userProfile={userProfile}
          healthProfile={healthProfile}
          locationProfile={locationProfile}
        />
      </div>

      <div className="w-full xl:w-1/2 flex flex-col overflow-y-auto bg-[var(--maru-surface)] p-5 sm:p-6 space-y-5">
        <div className="flex items-center gap-3">
          <Landmark size={26} className="text-[#B8924A]" />
          <div>
            <h1 className="text-2xl font-display font-bold text-[var(--maru-text)]">Panel Yaku</h1>
            <p className="text-xs text-[var(--maru-text-muted)]">Datos Perú · cultura · quechua</p>
          </div>
        </div>

        <section className="space-y-3">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <BarChart3 size={16} className="text-[#1E3A5F]" /> INEI · {city}
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              ['Población', stats.population],
              ['Pobreza', stats.povertyRate],
              ['IDH', stats.idh],
              ['Agua potable', stats.waterAccess]
            ].map(([k, v]) => (
              <div key={k} className="p-3 rounded-xl border border-[var(--maru-border-soft)] bg-[var(--maru-surface-muted)]">
                <div className="text-[10px] uppercase text-[var(--maru-text-muted)]">{k}</div>
                <div className="text-lg font-bold text-[var(--maru-text)]">{v}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="font-bold text-sm">Comparativa histórica (ciudades)</h3>
          <div className="space-y-2">
            {cities.map(([name, s]) => {
              const poverty = parseFloat(String(s.povertyRate));
              return (
                <div key={name} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold">{name}</span>
                    <span className="text-[var(--maru-text-muted)]">{s.povertyRate} pobreza</span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--maru-surface-muted)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#B8924A]"
                      style={{ width: `${Math.min(100, poverty * 2.8)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <MapPinned size={16} className="text-[#4A9B9D]" /> Mapa cultural
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {CULTURE_SPOTS.map((s) => (
              <div key={s.name} className="p-3 rounded-xl border border-[var(--maru-border-soft)] bg-white">
                <div className="font-bold text-sm">{s.name}</div>
                <div className="text-[11px] text-[var(--maru-text-muted)]">{s.region} · {s.era}</div>
                <div className="text-xs mt-1">{s.note}</div>
              </div>
            ))}
          </div>
        </section>

        {/* TRADUCTOR MULTILINGÜE IA */}
        <section className="p-4 rounded-2xl border border-[var(--maru-border-soft)] bg-white/50 backdrop-blur-sm shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3 border-[var(--maru-border-soft)]">
            <div className="flex items-center gap-2 text-base font-bold text-[var(--maru-text)]">
              <Languages size={20} className="text-[#1E3A5F]" />
              <span>Traductor de Lenguas del Perú</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold flex items-center gap-1">
                <Sparkles size={10} /> IA e2b-q4 → e2b
              </span>
            </div>
          </div>

          {/* Selector de Idiomas */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <select
              value={sourceLang}
              onChange={(e) => setSourceLang(e.target.value)}
              className="maru-field text-xs py-1.5 font-semibold"
            >
              <option value="Español">Español</option>
              {PERUVIAN_NATIVE_LANGUAGES.map((lang) => (
                <option key={`src-${lang}`} value={lang}>{lang}</option>
              ))}
            </select>

            <button
              onClick={swapLanguages}
              title="Intercambiar idiomas"
              className="p-2 rounded-full hover:bg-[var(--maru-surface-muted)] transition-colors text-slate-600"
            >
              <ArrowLeftRight size={16} />
            </button>

            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="maru-field text-xs py-1.5 font-semibold"
            >
              <option value="Español">Español</option>
              {PERUVIAN_NATIVE_LANGUAGES.map((lang) => (
                <option key={`tgt-${lang}`} value={lang}>{lang}</option>
              ))}
            </select>
          </div>

          {/* Caja de entrada */}
          <div>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              rows={3}
              className="w-full p-3 text-sm rounded-xl border border-[var(--maru-border-soft)] focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] bg-white resize-none"
              placeholder={`Escribe aquí el texto en ${sourceLang}...`}
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={() => handleTranslate()}
                disabled={isTranslating || !inputText.trim()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1E3A5F] hover:bg-[#142843] text-white font-medium text-xs shadow-sm disabled:opacity-50 transition-all"
              >
                {isTranslating ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Traduciendo...
                  </>
                ) : (
                  <>
                    <Languages size={14} /> Traducir con IA
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Resultado de Traducción */}
          {translatedText && (
            <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2 relative animate-fade-in">
              <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-700 pb-2">
                <span>Traducción a {targetLang}:</span>
                <button
                  onClick={handlePlayAudio}
                  disabled={isPlayingAudio}
                  className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  <Volume2 size={14} className={isPlayingAudio ? 'animate-pulse' : ''} />
                  <span>{isPlayingAudio ? 'Reproduciendo...' : 'Escuchar (Pronunciación)'}</span>
                </button>
              </div>
              <div className="text-lg font-bold text-emerald-300">{translatedText}</div>
              {phoneticText && (
                <div className="text-xs text-slate-400 italic">
                  🔊 Pronunciación guía: <span className="text-amber-300 font-normal">"{phoneticText}"</span>
                </div>
              )}
            </div>
          )}

          {/* Vocabulario de acceso rápido */}
          <div className="space-y-1.5 pt-2">
            <p className="text-xs font-semibold text-slate-600">Vocabulario frecuente ({targetLang === 'Español' ? sourceLang : targetLang}):</p>
            <div className="flex flex-wrap gap-1.5">
              {currentQuickWords.map((item: { es: string; nat: string }, idx: number) => (
                <button
                  key={idx}
                  onClick={() => {
                    if (sourceLang === 'Español') {
                      setInputText(item.es);
                      handleTranslate(item.es);
                    } else {
                      setInputText(item.nat);
                      handleTranslate(item.nat);
                    }
                  }}
                  className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
                >
                  {item.es} → {item.nat}
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
