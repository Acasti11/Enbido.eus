import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import api from '@/shared/lib/api';
import type { TournamentBackendDto, TournamentDetails } from '@/features/game/domain/lobby.types';

export function useTournamentLobby(
  currentUserId: number,
  onJoinRoom: (roomId: string) => void,
  fetchProfileData: () => Promise<void>
) {
  const { t } = useTranslation();

  const [onlineTournaments, setOnlineTournaments] = useState<TournamentBackendDto[]>([]);
  const [loadingTournaments, setLoadingTournaments] = useState(false);
  const [selectedTourneyId, setSelectedTourneyId] = useState<number | null>(null);
  const [tourneyDetails, setTourneyDetails] = useState<TournamentDetails | null>(null);
  const [loadingTourneyDetails, setLoadingTourneyDetails] = useState(false);

  // Reporting states
  const [reportingMatchId, setReportingMatchId] = useState<number | null>(null);
  const [reportWinnerId, setReportWinnerId] = useState<number | null>(null);
  const [reportScore, setReportScore] = useState<string>('3-0');
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  // Tournament creation states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTourneyName, setNewTourneyName] = useState('');
  const [newTourneyCoinsFee, setNewTourneyCoinsFee] = useState('0');
  const [newTourneyCoinsReward, setNewTourneyCoinsReward] = useState('0');
  const [newTourneyMaxTeams, setNewTourneyMaxTeams] = useState('8');
  const [newTourneyDate, setNewTourneyDate] = useState('');
  const [newTourneyTime, setNewTourneyTime] = useState('');
  const [newTourneyLocation, setNewTourneyLocation] = useState('Enbido.eus Online');
  const [creatingTourney, setCreatingTourney] = useState(false);

  const fetchOnlineTournaments = useCallback(async () => {
    try {
      setLoadingTournaments(true);
      const res = await api.get('/tournaments');
      setOnlineTournaments(res.data);
    } catch (err) {
      console.error('Error fetching online tournaments:', err);
    } finally {
      setLoadingTournaments(false);
    }
  }, []);

  const handleOpenTourneyDetail = useCallback(async (id: number) => {
    setSelectedTourneyId(id);
    setLoadingTourneyDetails(true);
    try {
      const res = await api.get(`/tournaments/${id}/details`);
      setTourneyDetails(res.data);
    } catch (err) {
      console.error('Error fetching tourney details:', err);
    } finally {
      setLoadingTourneyDetails(false);
    }
  }, []);

  const handleJoinOnlineTournament = useCallback(async () => {
    if (!selectedTourneyId) return;
    try {
      await api.post(`/tournaments/${selectedTourneyId}/join`);
      alert(t('premiumLobby.tournamentJoinSuccess'));
      handleOpenTourneyDetail(selectedTourneyId);
      fetchOnlineTournaments();
      fetchProfileData();
    } catch (err: unknown) {
      console.error('Error joining online tournament:', err);
      const axiosError = err as { response?: { data?: string } };
      alert(axiosError.response?.data || t('premiumLobby.tournamentJoinError'));
    }
  }, [selectedTourneyId, t, handleOpenTourneyDetail, fetchOnlineTournaments, fetchProfileData]);

  const handleStartOnlineTournament = useCallback(async () => {
    if (!selectedTourneyId) return;
    try {
      await api.post(`/tournaments/${selectedTourneyId}/start`);
      alert(t('premiumLobby.tournamentStartSuccess'));
      handleOpenTourneyDetail(selectedTourneyId);
      fetchOnlineTournaments();
    } catch (err: unknown) {
      console.error('Error starting online tournament:', err);
      const axiosError = err as { response?: { data?: string } };
      alert(axiosError.response?.data || t('premiumLobby.tournamentStartError'));
    }
  }, [selectedTourneyId, t, handleOpenTourneyDetail, fetchOnlineTournaments]);

  const setTimeToMinutesFromNow = useCallback((minutes: number) => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + minutes);
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    setNewTourneyDate(`${year}-${month}-${day}`);
    setNewTourneyTime(`${hours}:${mins}`);
  }, []);

  const handleCreateTournamentSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTourneyName.trim()) {
      alert(t('premiumLobby.errorTourneyNameRequired') || 'El nombre del torneo es obligatorio');
      return;
    }
    if (!newTourneyDate || !newTourneyTime) {
      alert(t('premiumLobby.errorTourneyDateTimeRequired') || 'La fecha y hora son obligatorias');
      return;
    }

    try {
      setCreatingTourney(true);
      const localDateTimeStr = `${newTourneyDate}T${newTourneyTime}:00`;
      const dateObj = new Date(localDateTimeStr);
      let utcStartDatetime = localDateTimeStr;
      if (!isNaN(dateObj.getTime())) {
        utcStartDatetime = dateObj.toISOString().substring(0, 19);
      }

      const payload = {
        title: newTourneyName,
        city: 'Online',
        specificLocation: newTourneyLocation || 'Enbido.eus Online',
        startDatetime: utcStartDatetime,
        entryFee: 0,
        coinsFee: Number(newTourneyCoinsFee || 0),
        coinsReward: Number(newTourneyCoinsReward || 0),
        maxTeams: Number(newTourneyMaxTeams || 8),
        status: 'open'
      };

      await api.post('/tournaments', payload);
      alert(t('premiumLobby.createTourneySuccess') || 'Torneo creado con éxito');
      setShowCreateModal(false);
      setNewTourneyName('');
      setNewTourneyCoinsFee('0');
      setNewTourneyCoinsReward('0');
      setNewTourneyMaxTeams('8');
      setNewTourneyDate('');
      setNewTourneyTime('');
      fetchOnlineTournaments();
    } catch (err: unknown) {
      console.error('Error creating virtual tournament:', err);
      const axiosError = err as { response?: { data?: any } };
      let errorDetail = '';
      if (axiosError.response?.data) {
        if (typeof axiosError.response.data === 'object') {
          errorDetail = axiosError.response.data.message || axiosError.response.data.error || JSON.stringify(axiosError.response.data);
        } else {
          errorDetail = String(axiosError.response.data);
        }
      }
      alert(`${t('premiumLobby.createTourneyError') || 'Error al crear el torneo'}${errorDetail ? ': ' + errorDetail : ''}`);
    } finally {
      setCreatingTourney(false);
    }
  }, [newTourneyName, newTourneyDate, newTourneyTime, newTourneyLocation, newTourneyCoinsFee, newTourneyCoinsReward, newTourneyMaxTeams, t, fetchOnlineTournaments]);

  const handleReportOnlineWinnerSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTourneyId || !reportingMatchId || !reportWinnerId) return;
    try {
      await api.post(`/tournaments/${selectedTourneyId}/matches/${reportingMatchId}/report`, null, {
        params: {
          winnerId: reportWinnerId,
          score: reportScore
        }
      });
      alert(t('premiumLobby.reportSuccess'));
      setReportingMatchId(null);
      setReportWinnerId(null);
      handleOpenTourneyDetail(selectedTourneyId);
      fetchOnlineTournaments();
    } catch (err: unknown) {
      console.error('Error reporting match score:', err);
      const axiosError = err as { response?: { data?: string } };
      alert(axiosError.response?.data || t('premiumLobby.reportError'));
    }
  }, [selectedTourneyId, reportingMatchId, reportWinnerId, reportScore, t, handleOpenTourneyDetail, fetchOnlineTournaments]);

  const handleReadyUp = useCallback(async (matchId: number) => {
    if (!selectedTourneyId) return;
    try {
      await api.post(`/tournaments/${selectedTourneyId}/matches/${matchId}/ready`);
      handleOpenTourneyDetail(selectedTourneyId);
    } catch (err: unknown) {
      console.error('Error marking match as ready:', err);
      const axiosError = err as { response?: { data?: string } };
      alert(axiosError.response?.data || 'Error al confirmar listo');
    }
  }, [selectedTourneyId, handleOpenTourneyDetail]);

  const handleCancelReady = useCallback(async (matchId: number) => {
    if (!selectedTourneyId) return;
    try {
      await api.post(`/tournaments/${selectedTourneyId}/matches/${matchId}/cancel-ready`);
      handleOpenTourneyDetail(selectedTourneyId);
    } catch (err: unknown) {
      console.error('Error cancelling match ready:', err);
      const axiosError = err as { response?: { data?: string } };
      alert(axiosError.response?.data || 'Error al cancelar listo');
    }
  }, [selectedTourneyId, handleOpenTourneyDetail]);

  const getTourneyUsernameById = useCallback((id: number | null): string => {
    if (!id || !tourneyDetails) return t('premiumLobby.waitingEllipsis');
    if (id < 0) {
      const botNames = ['MusLar-99', 'AnderMus', 'AmaiaTxapeldun', 'PatxiBot', 'MusAdikto', 'KoldoBot', 'MirenBot', 'NereaBot'];
      const index = Math.abs(id) - 1;
      return botNames[index % botNames.length];
    }
    const match = tourneyDetails.participants.find((p: any) => p.userId === id);
    return match ? match.username : t('premiumLobby.playerId', { id });
  }, [tourneyDetails, t]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }, []);

  // Find active match for the current player (including partner IDs)
  const activeMatch = tourneyDetails?.matches.find((m: any) =>
    !m.isCompleted &&
    (m.player1Id === currentUserId ||
     m.player2Id === currentUserId ||
     m.player1PartnerId === currentUserId ||
     m.player2PartnerId === currentUserId)
  );

  // Poll tournament details every 3 seconds if modal is open
  useEffect(() => {
    if (!selectedTourneyId) return;

    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/tournaments/${selectedTourneyId}/details`);
        setTourneyDetails(res.data);
      } catch (err) {
        console.error('Error polling tournament details:', err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [selectedTourneyId]);

  // Live timer countdown for the active match
  useEffect(() => {
    if (!activeMatch || !activeMatch.roundStartTime) {
      setSecondsLeft(null);
      return;
    }

    const updateTimer = () => {
      const startTime = new Date(activeMatch.roundStartTime!).getTime();
      const now = new Date().getTime();
      const elapsed = Math.floor((now - startTime) / 1000);
      const remaining = 300 - elapsed;
      setSecondsLeft(remaining > 0 ? remaining : 0);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeMatch?.roundStartTime]);

  // Auto-redirect when both players are ready (gameRoomId is set)
  useEffect(() => {
    if (activeMatch && activeMatch.gameRoomId) {
      onJoinRoom(activeMatch.gameRoomId);
    }
  }, [activeMatch?.gameRoomId, onJoinRoom]);

  return {
    onlineTournaments,
    loadingTournaments,
    selectedTourneyId,
    tourneyDetails,
    loadingTourneyDetails,
    reportingMatchId,
    reportWinnerId,
    reportScore,
    secondsLeft,
    showCreateModal,
    newTourneyName,
    newTourneyCoinsFee,
    newTourneyCoinsReward,
    newTourneyMaxTeams,
    newTourneyDate,
    newTourneyTime,
    newTourneyLocation,
    creatingTourney,
    activeMatch,
    setSelectedTourneyId,
    setTourneyDetails,
    setReportingMatchId,
    setReportWinnerId,
    setReportScore,
    setShowCreateModal,
    setNewTourneyName,
    setNewTourneyCoinsFee,
    setNewTourneyCoinsReward,
    setNewTourneyMaxTeams,
    setNewTourneyDate,
    setNewTourneyTime,
    setNewTourneyLocation,
    fetchOnlineTournaments,
    handleOpenTourneyDetail,
    handleJoinOnlineTournament,
    handleStartOnlineTournament,
    setTimeToMinutesFromNow,
    handleCreateTournamentSubmit,
    handleReportOnlineWinnerSubmit,
    handleReadyUp,
    handleCancelReady,
    getTourneyUsernameById,
    formatTime,
  };
}
