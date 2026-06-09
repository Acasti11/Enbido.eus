import React from 'react';
import { useTranslation } from 'react-i18next';
import type { GameScore } from '@/features/game/types/MusGame';

interface GameScoreBoardProps {
  score: GameScore;
  maxRounds?: number;
}

const getBestOfCount = (maxRounds: number): number => {
  if (maxRounds === 1) return 1;
  if (maxRounds === 2) return 3;
  return 5;
};

const GameScoreBoard: React.FC<GameScoreBoardProps> = ({ score, maxRounds = 3 }) => {
  const { t } = useTranslation();
  const bestOf = getBestOfCount(maxRounds);

  return (
    <div className="scoreboard-widget">

      <div className="scoreboard-header">
        <div className="scoreboard-team scoreboard-team--us">
          <div className="team-meta">
            <span className="team-name team-name--us">{t('musGame.teamUs') || 'Nosotros'}</span>
            <span className="team-points">{score.us} pts</span>
          </div>
        </div>
        <div className="scoreboard-divider" ></div>
        <div className="scoreboard-team scoreboard-team--them">
          <div className="team-meta">
            <span className="team-name team-name--them">{t('musGame.teamThem') || 'Rivales'}</span>
            <span className="team-points" >{score.them} pts</span>
          </div>
        </div>
      </div>

      <div className="scoreboard-global">
        <span className="scoreboard-global-label">
          {t('musGame.roundsGlobal')}
        </span>
        <span className="scoreboard-global-score">
          {score.roundsUs || 0} - {score.roundsThem || 0}
        </span>
        <span className="scoreboard-global-format">
          {t('musGame.bestOfRounds', { count: bestOf })}
        </span>
      </div>

    </div>
  );
};

export default GameScoreBoard;
