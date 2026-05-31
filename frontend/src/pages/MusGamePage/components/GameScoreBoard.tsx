import React from 'react';
import type { GameScore } from '../../../types/MusGame';

interface GameScoreBoardProps {
  score: GameScore;
  maxRounds?: number;
}

const GameScoreBoard: React.FC<GameScoreBoardProps> = ({ score, maxRounds = 3 }) => {
  return (
    <div className="scoreboard-widget">

      {/* PUNTOS PARCIALES DEL CHICO ACTUAL */}
      <div className="scoreboard-header">
        <div className="scoreboard-team">
          <div className="team-meta">
            <span className="team-name">GRUPO 1</span>
            <span className="team-points">{score.us} pts</span>
          </div>
        </div>
        <div className="scoreboard-divider" ></div>
        <div className="scoreboard-team">
          <div className="team-meta">
            <span className="team-name" >GRUPO 2</span>
            <span className="team-points" >{score.them} pts</span>
          </div>
        </div>
      </div>

      {/* MARCADOR GLOBAL DE CHICOS (0 - 0) */}
  <div className="scoreboard-global">
    <span className="scoreboard-global-label">
          Chicos (Global)
        </span>
    <span className="scoreboard-global-score">
          {score.roundsUs || 0} - {score.roundsThem || 0}
        </span>
    <span className="scoreboard-global-format">
          AL MEJOR DE {maxRounds === 1 ? 1 : maxRounds === 2 ? 3 : 5} CHICOS
        </span>
      </div>

    </div>
  );
};

export default GameScoreBoard;