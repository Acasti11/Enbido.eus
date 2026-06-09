import React, { useRef, useState, useEffect } from 'react';
import type { LogEntry } from '@/features/game/types/MusGame';

interface GameConsoleLogsProps {
  logs: LogEntry[];
}

interface LogAnalysis {
  icon: string;
  colorClass: string;
}

const parseLogMessage = (msg: string): LogAnalysis => {
  const m = msg.toLowerCase();

  // 1. Round headers (Grande, Chica, Pares, Juego/Punto)
  if (m.includes('apuestas de la grande') || m.includes('declaracion de grande')) {
    return { icon: '👑', colorClass: 'log-lance-header log-grande' };
  }
  if (m.includes('apuestas de la chica') || m.includes('declaracion de chica')) {
    return { icon: '🔍', colorClass: 'log-lance-header log-chica' };
  }
  if (m.includes('declaracion de pares') || m.includes('apuestas de la pares')) {
    return { icon: '♊', colorClass: 'log-lance-header log-pares' };
  }
  if (m.includes('declaracion de juego') || m.includes('apuestas de la juego') || m.includes('apuestas de la punto')) {
    return { icon: '🎯', colorClass: 'log-lance-header log-juego' };
  }
  if (m.includes('siguiente lance') || m.includes('comienzan los lances') || m.includes('recuento final')) {
    return { icon: '📍', colorClass: 'log-lance-transition' };
  }

  // 2. Bets and specific sends (Envido vs Ordago)
  if (m.includes('lanza un ordago') || m.includes('ordago no aceptado')) {
    return { icon: '🔥', colorClass: 'log-bet-ordago' };
  }
  if (m.includes('envida') || m.includes('re-envida') || m.includes('apuesta total')) {
    return { icon: '💰', colorClass: 'log-bet-envido' };
  }

  // 3. Acceptances, rejections and passes
  if (m.includes('acepta el envite') || m.includes('quiero')) {
    return { icon: '✅', colorClass: 'log-decision-accept' };
  }
  if (m.includes('rechaza la apuesta') || m.includes('no quiero')) {
    return { icon: '❌', colorClass: 'log-decision-decline' };
  }
  if (m.includes('pasa') || m.includes('todos pasan')) {
    return { icon: '💨', colorClass: 'log-decision-pass' };
  }

  // 4. Discards
  if (m.includes('descarta') || m.includes('descarte') || m.includes('reparten descartes')) {
    return { icon: '🃏', colorClass: 'log-discard' };
  }

  // 5. Deals
  if (m.includes('se reparten') || m.includes('comienza la mano') || m.includes('cartas repartidas')) {
    return { icon: '🔄', colorClass: 'log-deal' };
  }

  // 6. Winner / accumulated points
  if (m.includes('ganador') || m.includes('gana') || m.includes('puntos') || m.includes('se lleva') || m.includes('suma +')) {
    return { icon: '🏆', colorClass: 'log-win' };
  }

  // 7. Mus checks and discards
  if (m.includes('mus') || m.includes('corto') || m.includes('corta')) {
    return { icon: '🛑', colorClass: 'log-mus' };
  }

  return { icon: '📋', colorClass: 'log-default' };
};

const GameConsoleLogs: React.FC<GameConsoleLogsProps> = ({ logs }) => {
  // Store stable timestamps for each log ID to avoid shifts on re-renders
  const timestampsRef = useRef<{ [id: string]: string }>({});
  const [timestamps, setTimestamps] = useState<{ [id: string]: string }>({});

  useEffect(() => {
    const result: { [id: string]: string } = {};
    let hasNew = false;
    logs.forEach((log) => {
      if (!timestampsRef.current[log.id]) {
        timestampsRef.current[log.id] = new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
        hasNew = true;
      }
      result[log.id] = timestampsRef.current[log.id];
    });
    if (hasNew) {
      setTimestamps(result);
    }
  }, [logs]);

  return (
    <div className="logs-scroll-box">
      {logs.map((log) => {
        const { icon, colorClass } = parseLogMessage(log.message);
        const time = timestamps[log.id] || '';

        return (
          <div key={log.id} className={`log-item-card ${colorClass}`}>
            <div className="log-icon-wrapper">{icon}</div>
            <div className="log-text-content">{log.message}</div>
            <div className="log-time-stamp">{time}</div>
          </div>
        );
      })}
    </div>
  );
};

export default GameConsoleLogs;
