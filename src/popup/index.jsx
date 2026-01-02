import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import TimerDisplay from './components/TimerDisplay';
import TimerControls from './components/TimerControls';
import TimerPresets from './components/TimerPresets';
import CustomTimerInput from './components/CustomTimerInput';
import FocusStats from './components/FocusStats';
import AuthPanel from './components/AuthPanel';
import Leaderboard from './components/Leaderboard';
import Friends from './components/Friends';
import { getTimerState, startTimer, pauseTimer, resetTimer, setCustomTimer } from './utils/chromeMessages.jsx';
import { updateFocusTime } from '../services/focusService';
import './styles.css';

function App() {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [totalDuration, setTotalDuration] = useState(25 * 60); 
  const [isRunning, setIsRunning] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = () => {
      chrome.storage.local.get(['userId'], (result) => {
        console.log('Checking auth, userId:', result.userId);
        setIsAuthenticated(!!result.userId);
        setLoading(false);
      });
    };

    checkAuth();

    // Poll for auth changes every second 
    const interval = setInterval(checkAuth, 1000);

    return () => clearInterval(interval);
  }, []);

  // Load initial state from background
  useEffect(() => {
    if (isAuthenticated) {
      loadTimerState();
    }
  }, [isAuthenticated]);

  // Listen for timer updates from background
  useEffect(() => {
    const handleMessage = (message) => {
      if (message.type === 'TIMER_UPDATE') {
        setTimeLeft(message.timeLeft);
        setIsRunning(message.isRunning);
      }
      
      // Handle focus completion
      if (message.type === 'FOCUS_COMPLETE') {
        handleFocusComplete();
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, []);

  // Handle focus completion (when timer finishes)
  const handleFocusComplete = async () => {
    try {
      // Get user info
      chrome.storage.local.get(['userId', 'userDisplayName', 'userEmail'], async (storage) => {
        if (!storage.userId) return;
        
        const displayName = storage.userDisplayName || 'User';
        const email = storage.userEmail || '';
        
        // Calculate minutes completed from current totalDuration state
        const minutesCompleted = Math.floor(totalDuration / 60);
        
        console.log('Updating focus time:', { userId: storage.userId, minutes: minutesCompleted });
        
        const result = await updateFocusTime(storage.userId, minutesCompleted, displayName, email);
        
        if (result.success) {
          console.log('Focus time updated successfully:', result.data);
          
          // Notify leaderboard to refresh
          chrome.runtime.sendMessage({ 
            type: 'FOCUS_UPDATED'
          }).catch(() => {});
        } else {
          console.error('Failed to update focus time:', result.error);
        }
      });
    } catch (error) {
      console.error('Error in handleFocusComplete:', error);
    }
  };

  // Load timer state from background
  const loadTimerState = async () => {
    try {
      const response = await getTimerState();
      if (response && response.success) {
        setTimeLeft(response.state.timeLeft);
        setTotalDuration(response.state.totalDuration);
        setIsRunning(response.state.isRunning);
      }
    } catch (error) {
      console.error('Failed to load timer state:', error);
    }
  };

  // Handler functions
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
      const response = await resetTimer();
      if (response && response.success) {
        setTimeLeft(response.state.timeLeft);
        setIsRunning(response.state.isRunning);
      }
    } catch (error) {
      console.error('Failed to reset timer:', error);
    }
  };

  const handleSetTimer = async (minutes) => {
    try {
      await setCustomTimer(minutes);
    } catch (error) {
      console.error('Failed to set timer:', error);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="app-container">
        <h1 className="app-title">TimeBlock</h1>
        <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
          <div style={{ fontSize: '24px', marginBottom: '10px' }}>⏳</div>
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  // Show auth screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="app-container auth-only">
        <h1 className="app-title">TimeBlock</h1>
        <div className="welcome-message">
          <p className="welcome-title">Stay Focused. Build Streaks. 🔥</p>
          <p className="welcome-subtitle">Track your productivity and compete with friends</p>
        </div>
        <AuthPanel onAuthChange={(authenticated) => setIsAuthenticated(authenticated)} />
      </div>
    );
  }

  // Show main app if authenticated
  return (
    <div className="app-container">
      <h1 className="app-title">TimeBlock</h1>

      <AuthPanel onAuthChange={(authenticated) => setIsAuthenticated(authenticated)} />

      <Leaderboard />

      <Friends />
      
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

      <TimerPresets
        isRunning={isRunning}
        onSetTimer={handleSetTimer}
      />

      <CustomTimerInput
        isRunning={isRunning}
        onSetTimer={handleSetTimer}
      />

      <FocusStats />
    </div>
  );
}

// Mount React
const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);