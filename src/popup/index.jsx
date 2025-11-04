import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import TimerDisplay from './components/TimerDisplay';
import TimerControls from './components/TimerControls';
import './styles.css';

function App() {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);

  // Handler functions (temporary - just local state for now)
  const handleStart = () => {
    console.log('Start clicked!');
    setIsRunning(true);
  };

  const handlePause = () => {
    console.log('Pause clicked!');
    setIsRunning(false);
  };

  const handleReset = () => {
    console.log('Reset clicked!');
    setIsRunning(false);
    setTimeLeft(25 * 60);
  };

  return (
    <div className="app-container">
      <h1 className="app-title">TimeBlock</h1>
      
      <TimerDisplay 
        timeLeft={timeLeft} 
        isRunning={isRunning}
      />
      
      <TimerControls
        isRunning={isRunning}
        onStart={handleStart}
        onPause={handlePause}
        onReset={handleReset}
      />
      
      <div style={{ color: '#666', textAlign: 'center', fontSize: '12px', marginTop: '8px' }}>
        (Local state only - background connection next)
      </div>
    </div>
  );
}

// Mount React
const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);