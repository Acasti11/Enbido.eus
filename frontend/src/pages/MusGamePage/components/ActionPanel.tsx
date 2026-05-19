import React from 'react';
import type { GamePhase, BettingStage } from '../../../types/MusGame';

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
  
  if (phase === 'init') return <button className="btn-primary-action animate-pulse" onClick={onStart}>Comenzar Partida</button>;

  // Block interaction if it is not the current user's turn
  if (phase !== 'round-over' && !isMyTurn) {
    return (
      <div className="action-panel-bar waiting-mode" style={{ opacity: 0.8, textAlign: 'center', padding: '12px' }}>
        <p className="waiting-text" style={{ fontSize: '0.95rem', color: '#fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <span className="spinner-mini">⏳</span> Esperando el turno del rival...
        </p>
      </div>
    );
  }

  if (phase === 'mus-check') return (
    <div className="action-panel-bar">
      <button className="btn-primary-action btn-mus" onClick={() => onDecision(true)}>Pedir Mus</button>
      <button className="btn-primary-action btn-corto" style={{backgroundColor: '#dc2626'}} onClick={() => onDecision(false)}>Cortar Mus (Corto)</button>
    </div>
  );

  if (phase === 'discarding') return (
    <button className="btn-primary-action btn-discard" disabled={selectedCount === 0} onClick={onDiscard}>
      Descartar ({selectedCount} carta{selectedCount > 1 ? 's' : ''})
    </button>
  );

  if (phase === 'betting') return (
    <div className="action-panel-bar">
      <p style={{ marginBottom: '8px', fontSize: '0.9rem', color: '#e5e7eb' }}>
        Fase: <strong style={{ color: '#fbbf24' }}>{stage.toUpperCase()}</strong> {betState > 0 ? `| ¡Apuesta de ${betState === 2 ? 'ÓRDAGO' : 'ENVIDO'} en mesa!` : ''}
      </p>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', width: '100%' }}>
        {betState > 0 ? (
          <>
            <button className="btn-primary-action" style={{ flex: '1 1 45%', backgroundColor: '#059669' }} onClick={() => onBet('Quiero')}>Quiero</button>
            {betState === 1 && (
              <>
                <button className="btn-primary-action" style={{ flex: '1 1 45%' }} onClick={() => onBet('Envido')}>Re-envidar (+2)</button>
                <button className="btn-primary-action" style={{ flex: '1 1 95%', backgroundColor: '#d97706' }} onClick={() => onBet('Ordago')}>ÓRDAGO</button>
              </>
            )}
            <button className="btn-primary-action" style={{ flex: '1 1 45%', backgroundColor: '#dc2626' }} onClick={() => onBet('No Quiero')}>No Quiero</button>
          </>
        ) : (
          <>
            <button className="btn-primary-action" style={{ flex: '1' }} onClick={() => onBet('Envido')}>Envido</button>
            <button className="btn-primary-action" style={{ flex: '1', backgroundColor: '#d97706' }} onClick={() => onBet('Ordago')}>ÓRDAGO</button>
            <button className="btn-primary-action" style={{ flex: '1 1 100%', backgroundColor: '#4b5563' }} onClick={() => onBet('Paso')}>Paso</button>
          </>
        )}
      </div>
    </div>
  );

  if (phase === 'round-over') return (
    <button className="btn-primary-action" onClick={onStart}>Siguiente Mano</button>
  );

  return null;
};

export default ActionPanel;