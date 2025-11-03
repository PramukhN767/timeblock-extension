import React from 'react';

function TimerDisplay({ timeLeft, isRunning }) {
  // Format seconds to MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Determine status text
  const getStatus = () => {
    if (isRunning) return 'Running';
    if (timeLeft < 25 * 60 && timeLeft > 0) return 'Paused';
    return 'Ready';
  };

  const statusClass = isRunning ? 'running' : timeLeft < 25 * 60 ? 'paused' : '';

  return (
    <div className="timer-display">
      <div className="timer-time">{formatTime(timeLeft)}</div>
      <div className={`timer-status ${statusClass}`}>{getStatus()}</div>
    </div>
  );
}

export default TimerDisplay;