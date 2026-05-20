import React from 'react';
import type { GameScore } from '../../../types/MusGame';

interface GameScoreBoardProps {
  score: GameScore;
}

const GameScoreBoard: React.FC<GameScoreBoardProps> = ({ score }) => {
  return (
    <div className="scoreboard-widget">
      <div className="scoreboard-team">
        <div className="team-meta">
          <span className="team-name">NOSOTROS</span>
          <span className="team-points">{score.us} pts</span>
        </div>
      </div>
      <div className="scoreboard-divider"></div>
      <div className="scoreboard-team">
        <div className="team-meta">
          <span className="team-name">ELLOS</span>
          <span className="team-points">{score.them} pts</span>
        </div>
      </div>
    </div>
  );
};

export default GameScoreBoard;