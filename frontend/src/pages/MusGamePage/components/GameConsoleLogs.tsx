import React, { useRef } from 'react';
import type { LogEntry } from '../../../types/MusGame';

interface GameConsoleLogsProps {
  logs: LogEntry[];
}

interface LogAnalysis {
  icon: string;
  colorClass: string;
}

const parseLogMessage = (msg: string): LogAnalysis => {
  const m = msg.toLowerCase();
  
  // 1. Cabeceras de lances (Grande, Chica, Pares, Juego/Punto)
  if (m.includes('apuestas de la grande') || m.includes('declaración de grande')) {
    return { icon: '👑', colorClass: 'log-lance-header log-grande' };
  }
  if (m.includes('apuestas de la chica') || m.includes('declaración de chica')) {
    return { icon: '🔍', colorClass: 'log-lance-header log-chica' };
  }
  if (m.includes('declaración de pares') || m.includes('apuestas de la pares')) {
    return { icon: '♊', colorClass: 'log-lance-header log-pares' };
  }
  if (m.includes('declaración de juego') || m.includes('apuestas de la juego') || m.includes('apuestas de la punto')) {
    return { icon: '🎯', colorClass: 'log-lance-header log-juego' };
  }
  if (m.includes('siguiente lance') || m.includes('comienzan los lances') || m.includes('recuento final')) {
    return { icon: '📍', colorClass: 'log-lance-transition' };
  }
  
  // 2. Apuestas y Envíos específicos (Envido vs Órdago)
  if (m.includes('lanza un órdago') || m.includes('órdago no aceptado')) {
    return { icon: '🔥', colorClass: 'log-bet-ordago' };
  }
  if (m.includes('envida') || m.includes('re-envida') || m.includes('apuesta total')) {
    return { icon: '💰', colorClass: 'log-bet-envido' };
  }
  
  // 3. Aceptaciones, rechazos y pasos
  if (m.includes('acepta el envite') || m.includes('quiero')) {
    return { icon: '✅', colorClass: 'log-decision-accept' };
  }
  if (m.includes('rechaza la apuesta') || m.includes('no quiero')) {
    return { icon: '❌', colorClass: 'log-decision-decline' };
  }
  if (m.includes('pasa') || m.includes('todos pasan')) {
    return { icon: '💨', colorClass: 'log-decision-pass' };
  }
  
  // 4. Descartes
  if (m.includes('descarta') || m.includes('descarte') || m.includes('reparten descartes')) {
    return { icon: '🃏', colorClass: 'log-discard' };
  }
  
  // 5. Repartos
  if (m.includes('se reparten') || m.includes('comienza la mano') || m.includes('cartas repartidas')) {
    return { icon: '🔄', colorClass: 'log-deal' };
  }
  
  // 6. Ganador / Puntos acumulados
  if (m.includes('ganador') || m.includes('gana') || m.includes('puntos') || m.includes('se lleva') || m.includes('suma +')) {
    return { icon: '🏆', colorClass: 'log-win' };
  }
  
  // 7. Mus checks y descartes
  if (m.includes('mus') || m.includes('corto') || m.includes('corta')) {
    return { icon: '🛑', colorClass: 'log-mus' };
  }
  
  return { icon: '📋', colorClass: 'log-default' };
};

const GameConsoleLogs: React.FC<GameConsoleLogsProps> = ({ logs }) => {
  // Store stable timestamps for each log ID to avoid shifts on re-renders
  const timestampsRef = useRef<{ [id: string]: string }>({});

  const getTimestamp = (id: string): string => {
    if (!timestampsRef.current[id]) {
      timestampsRef.current[id] = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    }
    return timestampsRef.current[id];
  };

  return (
    <div className="logs-scroll-box">
      {logs.map((log) => {
        const { icon, colorClass } = parseLogMessage(log.message);
        const time = getTimestamp(log.id);

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