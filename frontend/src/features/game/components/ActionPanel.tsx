import React from 'react';
import { useTranslation } from 'react-i18next';
import type { GamePhase, BettingStage } from '@/features/game/types/MusGame';
import './mus-game.css';

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
  const { t } = useTranslation();

  const getDiscardLabel = (count: number): string => {
    const suffix = count > 1 ? 's' : '';
    return t('musGame.discard', { count, suffix });
  };

  const getBetLabel = (): string => {
    if (betState === 2) return t('musGame.betOnTable', { bet: 'ORDAGO' });
    if (betState === 1) return t('musGame.betOnTable', { bet: 'ENVIDO' });
    return '';
  };

  const renderContent = () => {
    if (phase === 'init') {
      return (
        <button
          className="btn-primary-action animate-pulse action-panel-full"
          onClick={onStart}
        >
          {t('musGame.startMatch')}
        </button>
      );
    }

    if (phase !== 'round-over' && !isMyTurn) {
      return (
        <div className="waiting-mode">
          <p className="waiting-text">
            <span>⏳</span> {t('musGame.waitingTurn')}
          </p>
        </div>
      );
    }

    if (phase === 'mus-check') {
      return (
        <>
          <button className="btn-primary-action btn-action-accept action-panel-flex" onClick={() => onDecision(true)}>{t('musGame.askMus')}</button>
          <button className="btn-primary-action btn-action-decline action-panel-flex" onClick={() => onDecision(false)}>{t('musGame.cutMus')}</button>
        </>
      );
    }

    if (phase === 'discarding') {
      return (
        <button className="btn-primary-action btn-action-bet" disabled={selectedCount === 0} onClick={onDiscard}>
          {getDiscardLabel(selectedCount)}
        </button>
      );
    }

    if (phase === 'betting') {
      return (
        <div className="action-panel-betting">
          <p className="action-panel-phase">
            {t('musGame.phase')} <strong className="action-panel-stage">{stage.toUpperCase()}</strong> {getBetLabel()}
          </p>
          <div className="action-panel-betting-buttons">
            {betState > 0 ? (
              <>
                <button className="btn-primary-action btn-action-accept action-panel-half" onClick={() => onBet('Quiero')}>{t('musGame.quiero')}</button>
                {betState === 1 && (
                  <>
                    <button className="btn-primary-action btn-action-bet action-panel-half" onClick={() => onBet('Envido')}>{t('musGame.reEnvido')}</button>
                    <button className="btn-primary-action btn-action-critical action-panel-wide" onClick={() => onBet('Ordago')}>{t('musGame.ordago')}</button>
                  </>
                )}
                <button className="btn-primary-action btn-action-decline action-panel-half" onClick={() => onBet('No Quiero')}>{t('musGame.noQuiero')}</button>
              </>
            ) : (
              <>
                <button className="btn-primary-action btn-action-bet action-panel-third" onClick={() => onBet('Envido')}>{t('musGame.envido')}</button>
                <button className="btn-primary-action btn-action-critical action-panel-third" onClick={() => onBet('Ordago')}>{t('musGame.ordago')}</button>
                <button className="btn-primary-action btn-action-neutral action-panel-full-row" onClick={() => onBet('Paso')}>{t('musGame.paso')}</button>
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
          {t('musGame.nextHand')}
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
