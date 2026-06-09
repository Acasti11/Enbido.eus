import React from 'react';

interface TimerCircleProps {
  timeLeft: number;
  isActive: boolean;
}

export const TimerCircle: React.FC<TimerCircleProps> = ({ timeLeft, isActive }) => {
  if (!isActive) return null;
  const maxTime = 10;
  const radius = 27;
  const strokeWidth = 3;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(timeLeft, maxTime) / maxTime) * circumference;

  let strokeColor = '#10b981';
  if (timeLeft <= 3) strokeColor = '#ef4444';
  else if (timeLeft <= 6) strokeColor = '#f59e0b';

  return (
    <svg className="timer-svg" width="64" height="64" viewBox="0 0 64 64">
      <circle
        cx="32"
        cy="32"
        r={radius}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        fill="transparent"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        transform="rotate(-90 32 32)"
      />
    </svg>
  );
};
