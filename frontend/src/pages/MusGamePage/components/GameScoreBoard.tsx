import React from 'react';
import type { GameScore } from '../../../types/MusGame';

interface GameScoreBoardProps {
  score: GameScore;
  reyesMode?: number;
}

const GameScoreBoard: React.FC<GameScoreBoardProps> = ({ score, reyesMode = 8 }) => {
  return (
    <div className="scoreboard-widget">
      <div className="scoreboard-teams">
        <div className="scoreboard-team">
          <div className="team-meta">
            <span className="team-name">EQUIPO 1</span>
            <span className="team-points">{score.us} pts</span>
          </div>
        </div>
        <div className="scoreboard-divider"></div>
        <div className="scoreboard-team">
          <div className="team-meta">
            <span className="team-name">EQUIPO 2</span>
            <span className="team-points">{score.them} pts</span>
          </div>
        </div>
      </div>
      <div className="reyes-mode-badge-wrapper">
        <span className="reyes-mode-badge">
          {reyesMode === 8 ? '👑 8 Reyes' : '🃏 4 Reyes'}
        </span>
      </div>
    </div>
  );
};

export default GameScoreBoard;