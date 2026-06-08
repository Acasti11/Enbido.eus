import React, { useEffect, useState } from 'react';
import '../styles/mus-game.css';

interface LanceResult {
  lance: string;
  winner: string | null;
  points: number;
  betPoints: number;
  deje: number;
  esPunto: boolean;
}

export interface RoundTransitionData {
  pointsUs: number;
  pointsThem: number;
  scoreUs: number;
  scoreThem: number;
  roundsWonUs: number;
  roundsWonThem: number;
  chicoOver: boolean;
  matchOver: boolean;
  isPlaying: boolean;
  lanceResults: LanceResult[];
}

interface RoundTransitionOverlayProps {
  transition: RoundTransitionData;
  deadline: number;
  onComplete: () => void;
  t: (key: string) => string;
}

export const RoundTransitionOverlay: React.FC<RoundTransitionOverlayProps> = ({
  transition,
  deadline,
  onComplete,
  t,
}) => {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const calculateCountdown = () => {
      const remaining = Math.ceil((deadline - Date.now()) / 1000);
      return Math.max(0, Math.min(5, remaining));
    };

    setCountdown(calculateCountdown());

    const interval = setInterval(() => {
      const remaining = calculateCountdown();
      setCountdown(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        onComplete();
      }
    }, 200);

    return () => clearInterval(interval);
  }, [deadline, onComplete]);

  const lanceNames: Record<string, string> = {
    grande: t('musGame.lanceGrande'),
    chica: t('musGame.lanceChica'),
    pares: t('musGame.lancePares'),
    juego: t('musGame.lanceJuego'),
  };

  const lanceIcons: Record<string, string> = {
    grande: '👑',
    chica: '🤏',
    pares: '👥',
    juego: '🎲',
  };

  const totalPointsUs = transition.pointsUs;
  const totalPointsThem = transition.pointsThem;
  const winner = totalPointsUs > totalPointsThem ? 'us' : totalPointsUs < totalPointsThem ? 'them' : 'tie';

  return (
    <div className="round-transition-overlay">
      <div className="round-transition-card">
        {/* Header */}
        <div className="round-transition-header">
          <h2>
            {transition.matchOver
              ? t('musGame.matchOver')
              : transition.chicoOver
              ? t('musGame.chicoOver')
              : t('musGame.handOver')}
          </h2>
        </div>

        {/* Winner announcement */}
        <div className={`round-transition-winner winner-${winner}`}>
          {winner === 'us' && (
            <>
              <span className="winner-trophy">🏆</span>
              <span className="winner-text">{t('musGame.weWonHand')}</span>
              <span className="winner-points">+{totalPointsUs} pts</span>
            </>
          )}
          {winner === 'them' && (
            <>
              <span className="winner-trophy">💔</span>
              <span className="winner-text">{t('musGame.theyWonHand')}</span>
              <span className="winner-points">+{totalPointsThem} pts</span>
            </>
          )}
          {winner === 'tie' && (
            <>
              <span className="winner-trophy">⚖️</span>
              <span className="winner-text">{t('musGame.tieHand')}</span>
            </>
          )}
        </div>

        {/* Lance breakdown */}
        <div className="round-transition-lances">
          {transition.lanceResults.map((lr) => {
            if (!lr.winner && lr.points === 0 && lr.deje === 0) return null;
            const lanceWinner = lr.winner === 'us' ? 'us' : lr.winner === 'them' ? 'them' : null;
            const displayName = lr.esPunto ? t('musGame.lancePunto') : lanceNames[lr.lance] || lr.lance;
            return (
              <div key={lr.lance} className={`lance-row ${lanceWinner || ''}`}>
                <span className="lance-icon">{lanceIcons[lr.lance] || '🎯'}</span>
                <span className="lance-name">{displayName}</span>
                {lanceWinner && (
                  <span className={`lance-winner-badge ${lanceWinner}`}>
                    {lanceWinner === 'us' ? t('musGame.us') : t('musGame.them')} +{lr.points}
                  </span>
                )}
                {!lanceWinner && lr.deje > 0 && (
                  <span className="lance-winner-badge deje">
                    {t('musGame.deje')} +{lr.deje}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Score summary */}
        <div className="round-transition-score">
          <div className="score-block team-us">
            <span className="score-label">{t('musGame.scoreUs')}</span>
            <span className="score-value">{transition.scoreUs}</span>
            {transition.pointsUs > 0 && (
              <span className="score-delta">+{transition.pointsUs}</span>
            )}
          </div>
          <div className="score-divider">—</div>
          <div className="score-block team-them">
            <span className="score-label">{t('musGame.scoreThem')}</span>
            <span className="score-value">{transition.scoreThem}</span>
            {transition.pointsThem > 0 && (
              <span className="score-delta">+{transition.pointsThem}</span>
            )}
          </div>
        </div>

        {/* Chicos count */}
        <div className="round-transition-chicos">
          <span>{t('musGame.chicos')}: </span>
          <span className="chicos-us">{transition.roundsWonUs}</span>
          <span> - </span>
          <span className="chicos-them">{transition.roundsWonThem}</span>
        </div>

        {/* Countdown */}
        <div className="round-transition-countdown">
          <div className="countdown-ring">
            <svg viewBox="0 0 36 36" className="countdown-svg">
              <path
                className="countdown-bg"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="countdown-progress"
                strokeDasharray={`${(countdown / 5) * 100}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="countdown-number">{countdown}</span>
          </div>
          <p className="countdown-label">{t('musGame.nextHandIn')}</p>
        </div>
      </div>
    </div>
  );
};
