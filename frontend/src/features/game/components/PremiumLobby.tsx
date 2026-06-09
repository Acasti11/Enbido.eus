import React, { useState, useEffect } from 'react';
import './premium-lobby.css';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/hooks/AuthContext';
import { useChat } from '@/features/chat/hooks/ChatContext';

import { useLobbyProfile } from '@/features/game/hooks/useLobbyProfile';
import { useTournamentLobby } from '@/features/game/hooks/useTournamentLobby';
import { useSocialPanel } from '@/features/game/hooks/useSocialPanel';
import { useLeaderboard } from '@/features/game/hooks/useLeaderboard';

import WelcomeHeader from './WelcomeHeader';
import MatchmakingPanel from './MatchmakingPanel';
import PrivateRoomsPanel from './PrivateRoomsPanel';
import SocialPanel from './SocialPanel';
import TournamentSection from './TournamentSection';
import TournamentDetailModal from './TournamentDetailModal';
import TournamentCreateModal from './TournamentCreateModal';
import LeaderboardModal from './LeaderboardModal';
import RulesModal from './RulesModal';
import ProfilePreviewModal from './ProfilePreviewModal';

import type { PremiumLobbyProps, Friend } from '@/features/game/domain/lobby.types';

const PremiumLobby: React.FC<PremiumLobbyProps> = ({
  username: _username,
  isSearching,
  queueSize,
  onJoinRoom,
  onCreateRoom,
  onStartMatchmaking,
  onCancelMatchmaking,
}) => {
  const { user } = useAuth();
  const currentUserId = user?.userId || 1;
  const { t } = useTranslation();
  const activeUsername = user?.username || t('shop.defaultUsername');
  const { openChat } = useChat();

  const [roomCode, setRoomCode] = useState('');
  const [selectedReyes, setSelectedReyes] = useState<'4' | '8'>('8');
  const [showRulesModal, setShowRulesModal] = useState(false);

  const { profile, loading, fetchProfileData } = useLobbyProfile(currentUserId);

  const tournament = useTournamentLobby(currentUserId, onJoinRoom, fetchProfileData);

  const social = useSocialPanel(currentUserId);

  const leaderboard = useLeaderboard();

  useEffect(() => {
    fetchProfileData();
    social.fetchFriends();
    social.fetchRequests();
    tournament.fetchOnlineTournaments();
  }, [currentUserId, fetchProfileData, social.fetchFriends, social.fetchRequests, tournament.fetchOnlineTournaments]);

  const handleOpenChat = (friend: Friend) => {
    openChat({
      id: friend.id,
      username: friend.username,
      status: friend.status,
      isBot: friend.isBot
    });
  };

  const handleCreateRoomLocal = () => {
    const randomCode = 'SALA-' + Math.floor(100 + Math.random() * 900);
    onCreateRoom(randomCode);
  };

  const winRate = profile && profile.totalGamesPlayed > 0
    ? Math.round((profile.totalGamesWon / profile.totalGamesPlayed) * 100)
    : 0;

  return (
    <div className="premium-lobby-overlay">
      <div className="premium-lobby-card">

        <WelcomeHeader
          activeUsername={activeUsername}
          loading={loading}
          profile={profile}
          onOpenLeaderboard={leaderboard.handleOpenLeaderboard}
          onOpenRules={() => setShowRulesModal(true)}
        />

        <div className="lobby-grid">
          <MatchmakingPanel
            isSearching={isSearching}
            queueSize={queueSize}
            selectedReyes={selectedReyes}
            onSelectReyes={setSelectedReyes}
            onStartMatchmaking={onStartMatchmaking}
            onCancelMatchmaking={onCancelMatchmaking}
          />

          <PrivateRoomsPanel
            roomCode={roomCode}
            onRoomCodeChange={setRoomCode}
            onCreateRoom={handleCreateRoomLocal}
            onJoinRoom={onJoinRoom}
          />

          <SocialPanel
            socialTab={social.socialTab}
            onSetSocialTab={social.setSocialTab}
            friends={social.friends}
            requests={social.requests}
            blockedUsers={social.blockedUsers}
            searchQuery={social.searchQuery}
            onSearchQueryChange={social.setSearchQuery}
            searchResults={social.searchResults}
            onSearchUsers={social.handleSearchUsers}
            onOpenChat={handleOpenChat}
            onSelectProfileUser={social.setSelectedProfileUser}
            onDeleteFriend={social.handleDeleteFriend}
            onBlockUser={social.handleBlockUser}
            onUnblockUser={social.handleUnblockUser}
            onSendFriendRequest={social.handleSendFriendRequest}
            onAcceptRequest={social.handleAcceptRequest}
            onDeclineRequest={social.handleDeclineRequest}
          />
        </div>

        <div className="tournaments-separator" />

        <TournamentSection
          onlineTournaments={tournament.onlineTournaments}
          loadingTournaments={tournament.loadingTournaments}
          isAdmin={user?.role === 'admin'}
          onRefresh={tournament.fetchOnlineTournaments}
          onOpenDetail={tournament.handleOpenTourneyDetail}
          onOpenCreateModal={() => {
            tournament.setShowCreateModal(true);
            tournament.setTimeToMinutesFromNow(1);
          }}
        />

        {!loading && profile && (
          <footer className="lobby-footer-stats">
            <div className="footer-stat-item">
              <span className="stat-label">{t('premiumLobby.gamesPlayed')}</span>
              <span className="stat-value">{profile.totalGamesPlayed}</span>
            </div>
            <div className="footer-stat-item">
              <span className="stat-label">{t('premiumLobby.gamesWon')}</span>
              <span className="stat-value">{profile.totalGamesWon}</span>
            </div>
            <div className="footer-stat-item">
              <span className="stat-label">{t('premiumLobby.winRate')}</span>
              <span className="stat-value">{winRate}%</span>
            </div>
          </footer>
        )}

      </div>

      <ProfilePreviewModal
        user={social.selectedProfileUser}
        onClose={() => social.setSelectedProfileUser(null)}
      />

      <LeaderboardModal
        show={leaderboard.showLeaderboard}
        loading={leaderboard.loadingLeaderboard}
        sortedLeaderboard={leaderboard.sortedLeaderboard}
        sortField={leaderboard.sortField}
        sortDirection={leaderboard.sortDirection}
        currentUserId={currentUserId}
        onClose={() => leaderboard.setShowLeaderboard(false)}
        onSort={leaderboard.handleSort}
        getSortedValueString={leaderboard.getSortedValueString}
      />

      <RulesModal
        show={showRulesModal}
        onClose={() => setShowRulesModal(false)}
      />

      <TournamentDetailModal
        selectedTourneyId={tournament.selectedTourneyId}
        tourneyDetails={tournament.tourneyDetails}
        loadingTourneyDetails={tournament.loadingTourneyDetails}
        currentUserId={currentUserId}
        reportingMatchId={tournament.reportingMatchId}
        reportWinnerId={tournament.reportWinnerId}
        reportScore={tournament.reportScore}
        secondsLeft={tournament.secondsLeft}
        activeMatch={tournament.activeMatch}
        onClose={() => { tournament.setSelectedTourneyId(null); tournament.setTourneyDetails(null); }}
        onJoin={tournament.handleJoinOnlineTournament}
        onStart={tournament.handleStartOnlineTournament}
        onReadyUp={tournament.handleReadyUp}
        onCancelReady={tournament.handleCancelReady}
        onReportWinnerChange={tournament.setReportWinnerId}
        onReportScoreChange={tournament.setReportScore}
        onReportingMatchIdChange={tournament.setReportingMatchId}
        onReportSubmit={tournament.handleReportOnlineWinnerSubmit}
        getTourneyUsernameById={tournament.getTourneyUsernameById}
        formatTime={tournament.formatTime}
      />

      <TournamentCreateModal
        show={tournament.showCreateModal}
        newTourneyName={tournament.newTourneyName}
        newTourneyCoinsFee={tournament.newTourneyCoinsFee}
        newTourneyCoinsReward={tournament.newTourneyCoinsReward}
        newTourneyMaxTeams={tournament.newTourneyMaxTeams}
        newTourneyDate={tournament.newTourneyDate}
        newTourneyTime={tournament.newTourneyTime}
        newTourneyLocation={tournament.newTourneyLocation}
        creatingTourney={tournament.creatingTourney}
        onNameChange={tournament.setNewTourneyName}
        onCoinsFeeChange={tournament.setNewTourneyCoinsFee}
        onCoinsRewardChange={tournament.setNewTourneyCoinsReward}
        onMaxTeamsChange={tournament.setNewTourneyMaxTeams}
        onDateChange={tournament.setNewTourneyDate}
        onTimeChange={tournament.setNewTourneyTime}
        onLocationChange={tournament.setNewTourneyLocation}
        onSetTimeToMinutesFromNow={tournament.setTimeToMinutesFromNow}
        onSubmit={tournament.handleCreateTournamentSubmit}
        onClose={() => tournament.setShowCreateModal(false)}
      />

    </div>
  );
};

export default PremiumLobby;
