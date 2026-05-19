import React from 'react';
import type { GamePhase, BettingStage } from '../../../types/MusGame';

interface ActionPanelProps {
  phase: GamePhase;
  stage: BettingStage;
  selectedCount: number;
  onStart: () => void;
  onDecision: (wantsMus: boolean) => void;
  onDiscard: () => void;
  onBet: (type: 'ENVIDO' | 'ORDAGO' | 'PASO') => void; // Nueva función para apuestas
}

const ActionPanel: React.FC<ActionPanelProps> = ({
  phase, stage, selectedCount, onStart, onDecision, onDiscard, onBet
}) => {
  
  if (phase === 'init') return <button className="btn-primary-action" onClick={onStart}>Comenzar Partida</button>;

  if (phase === 'mus-check') return (
    <div className="action-panel-bar">
      <button className="btn-primary-action" onClick={() => onDecision(true)}>Pedir Mus</button>
      <button className="btn-primary-action" style={{backgroundColor: '#c62828'}} onClick={() => onDecision(false)}>Cortar Mus</button>
    </div>
  );

  if (phase === 'discarding') return (
    <button className="btn-primary-action" disabled={selectedCount === 0} onClick={onDiscard}>
      Descartar ({selectedCount})
    </button>
  );

  if (phase === 'betting') return (
    <div className="action-panel-bar">
      <p>Apuesta actual: <strong>{stage.toUpperCase()}</strong></p>
      <button className="btn-primary-action" onClick={() => onBet('ENVIDO')}>Envido</button>
      <button className="btn-primary-action" onClick={() => onBet('ORDAGO')}>ORDAGO</button>
      <button className="btn-primary-action" style={{backgroundColor: '#555'}} onClick={() => onBet('PASO')}>Paso</button>
    </div>
  );

  return null;
};

export default ActionPanel;