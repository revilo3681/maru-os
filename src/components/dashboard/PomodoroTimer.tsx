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
    let interval: any = null;
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
      clearInterval(interval);
    }
    return () => clearInterval(interval);
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
    <div className="bg-white border border-[#E3DCCB] p-5 rounded-2xl shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-[#E3DCCB] pb-3">
        <div className="flex items-center gap-2 text-sm font-serif font-bold text-[#1E3A5F]">
          <Timer className="text-[#4A9B9D]" size={18} />
          <span>Cronómetro Pomodoro</span>
        </div>
        <span className="text-xs font-mono text-[#5A8F6B] bg-[#5A8F6B]/10 px-2 py-0.5 rounded-full flex items-center gap-1">
          <CheckCircle size={12} />
          {completedCycles} ciclos hoy
        </span>
      </div>

      <div className="flex justify-center gap-1 text-xs font-mono">
        <button
          onClick={() => switchMode('focus')}
          className={`px-3 py-1 rounded-lg transition-colors ${
            mode === 'focus' ? 'bg-[#1E3A5F] text-white font-semibold' : 'bg-[#F5F1E8] text-[#2C3E50]'
          }`}
        >
          Enfoque (25m)
        </button>
        <button
          onClick={() => switchMode('shortBreak')}
          className={`px-3 py-1 rounded-lg transition-colors ${
            mode === 'shortBreak' ? 'bg-[#4A9B9D] text-white font-semibold' : 'bg-[#F5F1E8] text-[#2C3E50]'
          }`}
        >
          Descanso (5m)
        </button>
        <button
          onClick={() => switchMode('longBreak')}
          className={`px-3 py-1 rounded-lg transition-colors ${
            mode === 'longBreak' ? 'bg-[#B8924A] text-white font-semibold' : 'bg-[#F5F1E8] text-[#2C3E50]'
          }`}
        >
          Largo (15m)
        </button>
      </div>

      <div className="text-center font-mono text-4xl sm:text-5xl font-bold tracking-wider text-[#1E3A5F] py-2">
        {formattedTime}
      </div>

      <div className="flex justify-center gap-3">
        <button
          onClick={toggleTimer}
          className={`px-6 py-2.5 rounded-xl font-medium text-xs text-white flex items-center gap-2 shadow transition-all ${
            isRunning ? 'bg-[#B8924A] hover:bg-[#A8823A]' : 'bg-[#1E3A5F] hover:bg-[#2C3E50]'
          }`}
        >
          {isRunning ? <Pause size={16} /> : <Play size={16} />}
          <span>{isRunning ? 'Pausar' : 'Iniciar Enfoque'}</span>
        </button>

        <button
          onClick={resetTimer}
          className="p-2.5 border border-[#E3DCCB] text-[#2C3E50] hover:bg-[#F5F1E8] rounded-xl transition-colors"
          title="Reiniciar"
        >
          <RotateCcw size={16} />
        </button>
      </div>
    </div>
  );
};
