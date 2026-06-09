import React from 'react';
import { useTranslation } from 'react-i18next';
import type { UserLeaderboardDto } from '@/features/game/domain/lobby.types';

interface LeaderboardModalProps {
  show: boolean;
  loading: boolean;
  sortedLeaderboard: UserLeaderboardDto[];
  sortField: 'elo' | 'winRate' | 'totalGamesPlayed' | 'totalGamesWon';
  sortDirection: 'asc' | 'desc';
  currentUserId: number;
  onClose: () => void;
  onSort: (field: 'elo' | 'winRate' | 'totalGamesPlayed' | 'totalGamesWon') => void;
  getSortedValueString: (player: UserLeaderboardDto) => string;
}

const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  show,
  loading,
  sortedLeaderboard,
  sortField,
  sortDirection,
  currentUserId,
  onClose,
  onSort,
  getSortedValueString,
}) => {
  const { t } = useTranslation();

  if (!show) return null;

  return (
    <div className="leaderboard-modal-overlay" onClick={onClose}>
      <div className="leaderboard-modal" onClick={(e) => e.stopPropagation()}>

        {/* MODAL HEADER */}
        <header className="leaderboard-modal-header">
          <div className="leaderboard-title-group">
            <span className="leaderboard-header-icon">🏆</span>
            <div>
              <h2 className="leaderboard-modal-title">{t('premiumLobby.leaderboardTitle')}</h2>
              <span className="leaderboard-modal-subtitle">{t('premiumLobby.leaderboardSubtitle')}</span>
            </div>
          </div>
          <button className="leaderboard-close-x" onClick={onClose}>
            &times;
          </button>
        </header>

        {/* PODIUM OF CHAMPIONS */}
        {!loading && sortedLeaderboard.length > 0 && (
          <div className="leaderboard-podium">
            {/* 2ND PLACE */}
            {sortedLeaderboard.length >= 2 && (
              <div className="podium-pillar pillar-second">
                <div className="podium-medal">🥈</div>
                <div className="podium-avatar">
                  {sortedLeaderboard[1].username.substring(0, 2).toUpperCase()}
                </div>
                <div className="podium-name">{sortedLeaderboard[1].username}</div>
                {sortedLeaderboard[1].equippedTitle && sortedLeaderboard[1].equippedTitle !== 'Sin Título' && (
                  <span className="podium-title-badge">{sortedLeaderboard[1].equippedTitle}</span>
                )}
                <div className="podium-elo">{getSortedValueString(sortedLeaderboard[1])}</div>
                <div className="podium-bar">2</div>
              </div>
            )}

            {/* 1ST PLACE */}
            {sortedLeaderboard.length >= 1 && (
              <div className="podium-pillar pillar-first">
                <div className="podium-crown">👑</div>
                <div className="podium-medal">🥇</div>
                <div className="podium-avatar">
                  {sortedLeaderboard[0].username.substring(0, 2).toUpperCase()}
                </div>
                <div className="podium-name">{sortedLeaderboard[0].username}</div>
                {sortedLeaderboard[0].equippedTitle && sortedLeaderboard[0].equippedTitle !== 'Sin Título' && (
                  <span className="podium-title-badge">{sortedLeaderboard[0].equippedTitle}</span>
                )}
                <div className="podium-elo">{getSortedValueString(sortedLeaderboard[0])}</div>
                <div className="podium-bar">1</div>
              </div>
            )}

            {/* 3RD PLACE */}
            {sortedLeaderboard.length >= 3 && (
              <div className="podium-pillar pillar-third">
                <div className="podium-medal">🥉</div>
                <div className="podium-avatar">
                  {sortedLeaderboard[2].username.substring(0, 2).toUpperCase()}
                </div>
                <div className="podium-name">{sortedLeaderboard[2].username}</div>
                {sortedLeaderboard[2].equippedTitle && sortedLeaderboard[2].equippedTitle !== 'Sin Título' && (
                  <span className="podium-title-badge">{sortedLeaderboard[2].equippedTitle}</span>
                )}
                <div className="podium-elo">{getSortedValueString(sortedLeaderboard[2])}</div>
                <div className="podium-bar">3</div>
              </div>
            )}
          </div>
        )}

        {/* FULL RANKING TABLE */}
        <div className="leaderboard-table-container">
          {loading ? (
            <div className="leaderboard-loading">
              <div className="lobby-loader"></div>
              <p>{t('premiumLobby.loadingLeaderboard')}</p>
            </div>
          ) : sortedLeaderboard.length === 0 ? (
            <div className="leaderboard-empty">{t('premiumLobby.noLeaderboardData')}</div>
          ) : (
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>{t('premiumLobby.position')}</th>
                  <th>{t('premiumLobby.player')}</th>
                  <th>{t('premiumLobby.title')}</th>
                  <th onClick={() => onSort('elo')} className="sortable-header">
                    ELO {sortField === 'elo' ? (sortDirection === 'desc' ? '▼' : '▲') : '↕'}
                  </th>
                  <th onClick={() => onSort('winRate')} className="sortable-header">
                    {t('premiumLobby.winRateShort')} {sortField === 'winRate' ? (sortDirection === 'desc' ? '▼' : '▲') : '↕'}
                  </th>
                  <th onClick={() => onSort('totalGamesPlayed')} className="sortable-header">
                    {t('premiumLobby.playedShort')} {sortField === 'totalGamesPlayed' ? (sortDirection === 'desc' ? '▼' : '▲') : '↕'}
                  </th>
                  <th onClick={() => onSort('totalGamesWon')} className="sortable-header">
                    {t('premiumLobby.wonShort')} {sortField === 'totalGamesWon' ? (sortDirection === 'desc' ? '▼' : '▲') : '↕'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedLeaderboard.map((player, idx) => {
                  const isMe = player.userId === currentUserId;
                  let rankBadge = '';
                  if (idx === 0) rankBadge = '🥇';
                  else if (idx === 1) rankBadge = '🥈';
                  else if (idx === 2) rankBadge = '🥉';

                  return (
                    <tr key={player.userId} className={`${isMe ? 'row-highlight-me' : ''}`}>
                      <td className="col-rank">
                        <span className="rank-number">{idx + 1}</span>
                        {rankBadge && <span className="rank-emoji">{rankBadge}</span>}
                      </td>
                      <td className="col-player">
                        <div className="player-cell">
                          <div className="player-avatar-small">
                            {player.username.substring(0, 2).toUpperCase()}
                          </div>
                          <span className="player-username">{player.username}</span>
                          {isMe && <span className="me-badge">{t('premiumLobby.you')}</span>}
                        </div>
                      </td>
                      <td className="col-title">
                        {player.equippedTitle && player.equippedTitle !== t('premiumLobby.noTitle') ? (
                          <span className="title-item-badge">{player.equippedTitle}</span>
                        ) : (
                          <span className="no-title-badge">{t('premiumLobby.noTitle')}</span>
                        )}
                      </td>
                      <td className="col-elo">
                        <span className="elo-value">{player.elo} ELO</span>
                      </td>
                      <td className="col-winrate">
                        <div className="winrate-bar-container">
                          <span className="winrate-value">{player.winRate}%</span>
                          <div className="winrate-track">
                            {/* Justificado: El ancho de la barra de progreso de victorias se calcula dinámicamente en tiempo de ejecución. */}
                            <div className="winrate-fill" style={{ width: `${player.winRate}%` }}></div>
                          </div>
                        </div>
                      </td>
                      <td className="col-stats">{player.totalGamesPlayed}</td>
                      <td className="col-stats">{player.totalGamesWon}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  );
};

export default LeaderboardModal;
