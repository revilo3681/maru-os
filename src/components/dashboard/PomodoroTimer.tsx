import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Timer, CheckCircle } from 'lucide-react';
import { AudioService } from '../../services/audioService';
import { StorageService } from '../../services/storageService';

export const PomodoroTimer: React.FC = () => {
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<'focus' | 'shortBreak' | 'longBreak'>('focus');
  const [completedCycles, setCompletedCycles] = useState(StorageService.getPomodoroCycles());

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isRunning) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            AudioService.playPomodoroBell();

            if (mode === 'focus') {
              const updatedCycles = StorageService.incrementPomodoroCycle();
              setCompletedCycles(updatedCycles);
              setMode('shortBreak');
              return 5 * 60;
            } else {
              setMode('focus');
              return 25 * 60;
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (interval) clearInterval(interval);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isRunning, mode]);

  const toggleTimer = () => setIsRunning(!isRunning);

  const resetTimer = () => {
    setIsRunning(false);
    if (mode === 'focus') setSecondsLeft(25 * 60);
    else if (mode === 'shortBreak') setSecondsLeft(5 * 60);
    else setSecondsLeft(15 * 60);
  };

  const switchMode = (newMode: 'focus' | 'shortBreak' | 'longBreak') => {
    setIsRunning(false);
    setMode(newMode);
    if (newMode === 'focus') setSecondsLeft(25 * 60);
    else if (newMode === 'shortBreak') setSecondsLeft(5 * 60);
    else setSecondsLeft(15 * 60);
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div className="bg-white border border-[var(--maru-border-soft)] p-5 rounded-2xl shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-[var(--maru-border-soft)] pb-3">
        <div className="flex items-center gap-2 text-sm font-display font-semibold text-[var(--maru-text)]">
          <Timer className="text-[var(--maru-gold)]" size={18} />
          <span>Cronómetro Pomodoro</span>
        </div>
        <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded flex items-center gap-1">
          <CheckCircle size={12} />
          {completedCycles} ciclos hoy
        </span>
      </div>

      <div className="flex justify-center gap-1 text-xs font-mono">
        <button
          onClick={() => switchMode('focus')}
          className={`px-3 py-1 rounded-xl transition-colors ${
            mode === 'focus'
              ? 'bg-[var(--maru-gold)]/10 text-[var(--maru-gold)] border border-[var(--maru-gold)]/20 font-semibold'
              : 'bg-[#F2F2F7] text-[var(--maru-text-muted)] border border-transparent hover:bg-gray-200'
          }`}
        >
          Enfoque (25m)
        </button>
        <button
          onClick={() => switchMode('shortBreak')}
          className={`px-3 py-1 rounded-xl transition-colors ${
            mode === 'shortBreak'
              ? 'bg-[#34C759]/10 text-[#34C759] border border-[#34C759]/20 font-semibold'
              : 'bg-[#F2F2F7] text-[var(--maru-text-muted)] border border-transparent hover:bg-gray-200'
          }`}
        >
          Descanso (5m)
        </button>
        <button
          onClick={() => switchMode('longBreak')}
          className={`px-3 py-1 rounded-xl transition-colors ${
            mode === 'longBreak'
              ? 'bg-[#FF9500]/10 text-[#FF9500] border border-[#FF9500]/20 font-semibold'
              : 'bg-[#F2F2F7] text-[var(--maru-text-muted)] border border-transparent hover:bg-gray-200'
          }`}
        >
          Largo (15m)
        </button>
      </div>

      <div className="text-center font-mono text-4xl sm:text-5xl font-bold tracking-wider text-[var(--maru-text)] py-2">
        {formattedTime}
      </div>

      <div className="flex justify-center gap-3">
        <button
          onClick={toggleTimer}
          className={`px-6 py-2.5 rounded-xl font-display text-xs flex items-center gap-2 transition-all ${
            isRunning ? 'maru-btn-ghost' : 'maru-btn-gold'
          }`}
        >
          {isRunning ? <Pause size={16} /> : <Play size={16} />}
          <span>{isRunning ? 'Pausar' : 'Iniciar Enfoque'}</span>
        </button>

        <button
          onClick={resetTimer}
          className="p-2.5 border border-[var(--maru-border-soft)] text-[var(--maru-text-muted)] hover:text-[var(--maru-text)] hover:bg-[#F2F2F7] rounded-xl transition-colors"
          title="Reiniciar"
        >
          <RotateCcw size={16} />
        </button>
      </div>
    </div>
  );
};
