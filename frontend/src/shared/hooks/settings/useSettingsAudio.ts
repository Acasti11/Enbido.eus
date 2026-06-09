import { useRef, useEffect } from 'react';
import type { Settings } from '../SettingsContext';

export const useSettingsAudio = (settings: Settings) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize background music
  useEffect(() => {
    audioRef.current = new Audio('/Musica_fondo.mp3');
    audioRef.current.loop = true;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Sync background smusic state and volume
  useEffect(() => {
    if (!audioRef.current) return;

    if (settings.musicEnabled) {
      audioRef.current.volume = settings.musicVolume * 0.3;
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          console.log('Autoplay blocked by browpser. Music will start on user interaction.');
        });
      }
    } else {
      audioRef.current.pause();
    }
  }, [settings.musicEnabled, settings.musicVolume]);

  // Autoplay handler on first click
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (settings.musicEnabled && audioRef.current && audioRef.current.paused) {
        audioRef.current.play().catch((e) => console.log('Interactive play blocked:', e));
      }
      document.removeEventListener('click', handleFirstInteraction);
    };

    document.addEventListener('click', handleFirstInteraction);
    return () => document.removeEventListener('click', handleFirstInteraction);
  }, [settings.musicEnabled]);

  // Web Audio API Sound Effects Synthesizer
  const playSfx = (type: 'click' | 'deal' | 'message') => {
    if (!settings.soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      const now = ctx.currentTime;
      gainNode.gain.setValueAtTime(settings.soundVolume * 0.4, now);

      if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.08);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'deal') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.15);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'message') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        gainNode.gain.setValueAtTime(settings.soundVolume * 0.4, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(659.25, now + 0.12);
        gain2.gain.setValueAtTime(settings.soundVolume * 0.4, now + 0.12);
        gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

        osc.start(now);
        osc.stop(now + 0.15);
        osc2.start(now + 0.12);
        osc2.stop(now + 0.3);
      }
    } catch (err) {
      console.warn('Web Audio SFX blocked or unsupported:', err);
    }
  };

  return { playSfx };
};
