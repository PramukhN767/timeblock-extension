import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import TimerDisplay from './components/TimerDisplay';
import './styles.css';

function App() {
  // State for timer
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);

  return (
    <div className="app-container">
      <h1 className="app-title">TimeBlock</h1>
      
      <TimerDisplay 
        timeLeft={timeLeft} 
        isRunning={isRunning}
      />
      
      <div style={{ color: '#666', textAlign: 'center', fontSize: '12px' }}>
        Controls coming next...
      </div>
    </div>
  );
}

// Mount React
const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);