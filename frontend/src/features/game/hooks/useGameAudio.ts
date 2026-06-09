import { useState, useEffect, useRef } from 'react';
import { playGameSound } from '../utils/gameAudio';

interface UseGameAudioProps {
  isPlaying: boolean;
  isMyTurn: boolean;
  phase: string;
  turnDeadline: number;
  score: { roundsUs?: number; roundsThem?: number };
}

export const useGameAudio = ({ isPlaying, isMyTurn, phase, turnDeadline, score }: UseGameAudioProps) => {
  const [isMuted, setIsMuted] = useState(() => localStorage.getItem('gameMuted') === 'true');
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isSignsOpen, setIsSignsOpen] = useState(false);

  const prevIsMyTurn = useRef(isMyTurn);
  const prevPhase = useRef(phase);
  const prevRoundsUs = useRef(score.roundsUs);
  const prevRoundsThem = useRef(score.roundsThem);

  const toggleMute = () => {
    setIsMuted(prev => {
      const next = !prev;
      localStorage.setItem('gameMuted', String(next));
      return next;
    });
  };

  useEffect(() => {
    if (!isPlaying) return;
    if (isMyTurn && !prevIsMyTurn.current) playGameSound('click', isMuted);
    if (phase !== prevPhase.current) playGameSound('card', isMuted);
    prevIsMyTurn.current = isMyTurn;
    prevPhase.current = phase;
  }, [isMyTurn, phase, isPlaying, isMuted]);

  useEffect(() => {
    if (!isPlaying) return;
    if (score.roundsUs !== prevRoundsUs.current || score.roundsThem !== prevRoundsThem.current) {
      playGameSound('win', isMuted);
    }
    prevRoundsUs.current = score.roundsUs;
    prevRoundsThem.current = score.roundsThem;
  }, [score.roundsUs, score.roundsThem, isPlaying, isMuted]);

  useEffect(() => {
    if (turnDeadline === 0) {
      // Use timeout to avoid synchronous setState in effect body
      const timeout = setTimeout(() => setTimeLeft(0), 0);
      return () => clearTimeout(timeout);
    }
    const updateTime = () => {
      const now = Date.now();
      const diff = Math.max(0, Math.ceil((turnDeadline - now) / 1000));
      setTimeLeft(diff);
      if (isMyTurn && diff > 0 && diff <= 3) playGameSound('timer', isMuted);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [turnDeadline, isMyTurn, isMuted]);

  return { isMuted, toggleMute, timeLeft, isSignsOpen, setIsSignsOpen };
};
