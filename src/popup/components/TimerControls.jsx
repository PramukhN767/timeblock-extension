import React from 'react';

function TimerControls({ isRunning, onStart, onPause, onReset }) {
  return (
    <div className="timer-controls">
      <button 
        className="control-btn start-btn" 
        onClick={onStart}
        disabled={isRunning}
      >
        Start
      </button>
      
      <button 
        className="control-btn pause-btn" 
        onClick={onPause}
        disabled={!isRunning}
      >
        Pause
      </button>
      
      <button 
        className="control-btn reset-btn" 
        onClick={onReset}
      >
        Reset
      </button>
    </div>
  );
}

export default TimerControls;