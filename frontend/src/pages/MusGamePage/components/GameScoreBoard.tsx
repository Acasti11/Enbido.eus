import React from 'react';
import type { GameScore } from '../../../types/MusGame';

interface GameScoreBoardProps {
  score: GameScore;
  maxRounds?: number;
}

const GameScoreBoard: React.FC<GameScoreBoardProps> = ({ score, maxRounds = 3 }) => {
  return (
    <div className="scoreboard-widget" style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
      
      {/* PUNTOS PARCIALES DEL CHICO ACTUAL */}
      <div style={{ display: 'flex', width: '100%', justifyContent: 'space-around', alignItems: 'center' }}>
        <div className="scoreboard-team" style={{ flex: 1 }}>
          <div className="team-meta" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span className="team-name" style={{ fontSize: '0.8rem', color: '#888', fontWeight: 700 }}>GRUPO 1</span>
            <span className="team-points" style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#fff' }}>{score.us} pts</span>
          </div>
        </div>
        <div className="scoreboard-divider" style={{ width: '1px', height: '35px', backgroundColor: '#333' }}></div>
        <div className="scoreboard-team" style={{ flex: 1 }}>
          <div className="team-meta" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span className="team-name" style={{ fontSize: '0.8rem', color: '#888', fontWeight: 700 }}>GRUPO 2</span>
            <span className="team-points" style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#fff' }}>{score.them} pts</span>
          </div>
        </div>
      </div>

      {/* MARCADOR GLOBAL DE CHICOS (0 - 0) */}
      <div style={{ 
        width: '100%', 
        borderTop: '1px solid rgba(255, 255, 255, 0.08)', 
        paddingTop: '10px', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2px'
      }}>
        <span style={{ fontSize: '0.65rem', color: '#666', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>
          Chicos (Global)
        </span>
        <span style={{ fontSize: '1.5rem', color: '#d4af37', fontWeight: 900, fontFamily: 'monospace', letterSpacing: '3px' }}>
          {score.roundsUs || 0} - {score.roundsThem || 0}
        </span>
        <span style={{ fontSize: '0.6rem', color: '#555', fontWeight: 700, letterSpacing: '0.5px' }}>
          AL MEJOR DE {maxRounds === 1 ? 1 : maxRounds === 2 ? 3 : 5} CHICOS
        </span>
      </div>

    </div>
  );
};

export default GameScoreBoard;