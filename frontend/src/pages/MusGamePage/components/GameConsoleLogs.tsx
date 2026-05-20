import React from 'react';
import type { LogEntry } from '../../../types/MusGame';

interface GameConsoleLogsProps {
  logs: LogEntry[];
}

const GameConsoleLogs: React.FC<GameConsoleLogsProps> = ({ logs }) => {
  return (
    <div className="logs-scroll-box">
      {logs.map((log) => (
        <div key={log.id} className="log-item-line">
          <span className="log-time">[{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}]</span> {log.message}
        </div>
      ))}
    </div>
  );
};

export default GameConsoleLogs;