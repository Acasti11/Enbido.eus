import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import api from '@/shared/lib/api';
import type { UserLeaderboardDto } from '@/features/game/domain/lobby.types';

export function useLeaderboard() {
  const { t } = useTranslation();

  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<UserLeaderboardDto[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [sortField, setSortField] = useState<'elo' | 'winRate' | 'totalGamesPlayed' | 'totalGamesWon'>('elo');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleOpenLeaderboard = useCallback(async () => {
    setShowLeaderboard(true);
    setLoadingLeaderboard(true);
    try {
      const res = await api.get('/usuarios/leaderboard');
      setLeaderboardData(res.data);
    } catch (err) {
      console.error('Error fetching ELO leaderboard:', err);
    } finally {
      setLoadingLeaderboard(false);
    }
  }, []);

  const handleSort = useCallback((field: 'elo' | 'winRate' | 'totalGamesPlayed' | 'totalGamesWon') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  }, [sortField]);

  const sortedLeaderboard = [...leaderboardData].sort((a, b) => {
    const valA = a[sortField] || 0;
    const valB = b[sortField] || 0;
    if (valA === valB) {
      return (b.elo || 0) - (a.elo || 0); // Tie breaker by ELO
    }
    return sortDirection === 'asc' ? valA - valB : valB - valA;
  });

  const getSortedValueString = useCallback((player: UserLeaderboardDto) => {
    switch (sortField) {
      case 'winRate':
        return t('premiumLobby.winRateValue', { value: player.winRate });
      case 'totalGamesPlayed':
        return t('premiumLobby.gamesPlayedValue', { value: player.totalGamesPlayed });
      case 'totalGamesWon':
        return t('premiumLobby.gamesWonValue', { value: player.totalGamesWon });
      case 'elo':
      default:
        return t('premiumLobby.eloValue', { value: player.elo });
    }
  }, [sortField, t]);

  return {
    showLeaderboard,
    loadingLeaderboard,
    sortField,
    sortDirection,
    sortedLeaderboard,
    setShowLeaderboard,
    handleOpenLeaderboard,
    handleSort,
    getSortedValueString,
  };
}
