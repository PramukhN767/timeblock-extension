import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import TimerDisplay from './components/TimerDisplay';
import TimerControls from './components/TimerControls';
const { getTimerState, startTimer, pauseTimer, resetTimer } = require('./utils/chromeMessages');
import './styles.css';

function App() {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);

  // Load initial state from background
  useEffect(() => {
    loadTimerState();
  }, []);

  // Listen for timer updates from background
  useEffect(() => {
    const handleMessage = (message) => {
      if (message.type === 'TIMER_UPDATE') {
        setTimeLeft(message.timeLeft);
        setIsRunning(message.isRunning);
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);

    // Cleanup listener on unmount
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  // Load timer state from background
  const loadTimerState = async () => {
    try {
      const response = await getTimerState();
      if (response && response.success) {
        setTimeLeft(response.state.timeLeft);
        setIsRunning(response.state.isRunning);
      }
    } catch (error) {
      console.error('Failed to load timer state:', error);
    }
  };

  // Handler functions - now talk to background!
  const handleStart = async () => {
    try {
      await startTimer();
    } catch (error) {
      console.error('Failed to start timer:', error);
    }
  };

  const handlePause = async () => {
    try {
      await pauseTimer();
    } catch (error) {
      console.error('Failed to pause timer:', error);
    }
  };

  const handleReset = async () => {
    try {
      await resetTimer();
    } catch (error) {
      console.error('Failed to reset timer:', error);
    }
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
        Connected to background worker ✓
      </div>
    </div>
  );
}

// Mount React
const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);