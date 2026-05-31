import React from 'react';
import type { GamePhase, BettingStage } from '../../../types/MusGame';
import '../styles/mus-game.css';

interface ActionPanelProps {
  phase: GamePhase;
  stage: BettingStage;
  selectedCount: number;
  isMyTurn: boolean;
  betState: number;
  onStart: () => void;
  onDecision: (wantsMus: boolean) => void;
  onDiscard: () => void;
  onBet: (action: 'Paso' | 'Envido' | 'Ordago' | 'Quiero' | 'No Quiero') => void;
}

const ActionPanel: React.FC<ActionPanelProps> = ({
  phase, stage, selectedCount, isMyTurn, betState, onStart, onDecision, onDiscard, onBet
}) => {

  const renderContent = () => {
    if (phase === 'init') {
      return (
        <button
          className="btn-primary-action animate-pulse action-panel-full"
          onClick={onStart}
        >
          Comenzar Partida
        </button>
      );
    }

    // Block interaction if it is not the current user's turn
    if (phase !== 'round-over' && !isMyTurn) {
      return (
        <div className="waiting-mode">
          <p className="waiting-text">
            <span>⏳</span> Esperando el turno del rival...
          </p>
        </div>
      );
    }

    if (phase === 'mus-check') {
      return (
        <>
          <button className="btn-primary-action btn-action-accept action-panel-flex" onClick={() => onDecision(true)}>Pedir Mus</button>
          <button className="btn-primary-action btn-action-decline action-panel-flex" onClick={() => onDecision(false)}>Cortar Mus</button>
        </>
      );
    }

    if (phase === 'discarding') {
      return (
        <button className="btn-primary-action btn-action-bet" disabled={selectedCount === 0} onClick={onDiscard}>
          Descartar ({selectedCount} carta{selectedCount > 1 ? 's' : ''})
        </button>
      );
    }

    if (phase === 'betting') {
      return (
        <div className="action-panel-betting">
          <p className="action-panel-phase">
            Fase: <strong className="action-panel-stage">{stage.toUpperCase()}</strong> {betState > 0 ? `| ¡Apuesta de ${betState === 2 ? 'ÓRDAGO' : 'ENVIDO'} en mesa!` : ''}
          </p>
          <div className="action-panel-betting-buttons">
            {betState > 0 ? (
              <>
                <button className="btn-primary-action btn-action-accept action-panel-half" onClick={() => onBet('Quiero')}>Quiero</button>
                {betState === 1 && (
                  <>
                    <button className="btn-primary-action btn-action-bet action-panel-half" onClick={() => onBet('Envido')}>Re-envidar (+2)</button>
                    <button className="btn-primary-action btn-action-critical action-panel-wide" onClick={() => onBet('Ordago')}>ÓRDAGO</button>
                  </>
                )}
                <button className="btn-primary-action btn-action-decline action-panel-half" onClick={() => onBet('No Quiero')}>No Quiero</button>
              </>
            ) : (
              <>
                <button className="btn-primary-action btn-action-bet action-panel-third" onClick={() => onBet('Envido')}>Envido</button>
                <button className="btn-primary-action btn-action-critical action-panel-third" onClick={() => onBet('Ordago')}>ÓRDAGO</button>
                <button className="btn-primary-action btn-action-neutral action-panel-full-row" onClick={() => onBet('Paso')}>Paso</button>
              </>
            )}
          </div>
        </div>
      );
    }

    if (phase === 'round-over') {
      return (
        <button
          className="btn-primary-action action-panel-full"
          onClick={onStart}
        >
          Siguiente Mano
        </button>
      );
    }

    return null;
  };

  const content = renderContent();
  if (!content) return null;

  return (
    <div className="action-panel-bar">
      {content}
    </div>
  );
};

export default ActionPanel;