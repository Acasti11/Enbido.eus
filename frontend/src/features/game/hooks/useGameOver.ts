import { useState, useEffect, useRef } from 'react';
import api from '@/shared/lib/api';

interface UseGameOverProps {
  isPlaying: boolean;
  roomId: string;
  score: { us: number; them: number; roundsUs?: number; roundsThem?: number };
  maxRounds: number;
  seats: any[];
  onLeaveRoom: () => void;
}

export const useGameOver = ({ isPlaying, roomId, score, maxRounds, seats, onLeaveRoom }: UseGameOverProps) => {
  const [isGameOverOpen, setIsGameOverOpen] = useState(false);
  const [eloChange, setEloChange] = useState<number | null>(null);
  const [coinsChange, setCoinsChange] = useState<number | null>(null);
  const [winningProfiles, setWinningProfiles] = useState<{ [userId: number]: any }>({});
  const [initialProfile, setInitialProfile] = useState<any>(null);
  const [finalMatchData, setFinalMatchData] = useState<any>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  const prevIsPlaying = useRef(isPlaying);

  useEffect(() => {
    if (isPlaying && initialProfile === null) {
      api.get('/usuarios/me/profile').then(res => setInitialProfile(res.data)).catch(() => {});
    }
  }, [isPlaying, initialProfile]);

  useEffect(() => {
    if (prevIsPlaying.current === true && isPlaying === false && roomId !== '') {
      const handleGameFinished = async () => {
        const currentSeats = [...seats];
        const currentRoundsUs = score.roundsUs || 0;
        const currentRoundsThem = score.roundsThem || 0;

        setFinalMatchData({
          roundsWonUs: currentRoundsUs,
          roundsWonThem: currentRoundsThem,
          maxRounds,
          scoreUs: score.us,
          scoreThem: score.them,
          seats: currentSeats
        });

        setIsGameOverOpen(true);
        setIsProfileLoading(true);

        try {
          const isUsWinner = currentRoundsUs > currentRoundsThem;
          const winningChairs = isUsWinner ? [0, 2] : [1, 3];
          const winners = currentSeats.filter(s => winningChairs.includes(s.chair));

          const profilePromises: Promise<any>[] = [];
          const profilesMap: { [userId: number]: any } = {};

          const mePromise = api.get('/usuarios/me/profile').then(res => {
            const finalProfile = res.data;
            const beforeElo = initialProfile ? initialProfile.elo : profile?.elo;
            if (beforeElo !== undefined && finalProfile.elo !== undefined) {
              setEloChange(finalProfile.elo - beforeElo);
            }
            const beforeCoins = initialProfile ? initialProfile.coins : profile?.coins;
            if (beforeCoins !== undefined && finalProfile.coins !== undefined) {
              setCoinsChange(finalProfile.coins - beforeCoins);
            }
            setProfile(finalProfile);
          }).catch(() => {});
          profilePromises.push(mePromise);

          winners.forEach(w => {
            if (w.userId && !w.isBot) {
              profilePromises.push(
                api.get(`/usuarios/${w.userId}/profile`).then(res => {
                  profilesMap[w.userId!] = res.data;
                }).catch(() => {})
              );
            }
          });

          await Promise.all(profilePromises);
          setWinningProfiles(profilesMap);
        } catch (err) {
          console.error('Error handling post-game profile loading:', err);
        } finally {
          setIsProfileLoading(false);
        }
      };

      handleGameFinished();
    }
    prevIsPlaying.current = isPlaying;
  }, [isPlaying, roomId, score, maxRounds, seats, initialProfile, profile]);

  const handleCloseGameOver = () => {
    setIsGameOverOpen(false);
    setFinalMatchData(null);
    setEloChange(null);
    setCoinsChange(null);
    setInitialProfile(null);
    setIsProfileLoading(false);
  };

  const handleLeaveGameOver = () => {
    onLeaveRoom();
    handleCloseGameOver();
  };

  return {
    isGameOverOpen, finalMatchData, eloChange, coinsChange,
    winningProfiles, isProfileLoading, handleCloseGameOver, handleLeaveGameOver
  };
};
