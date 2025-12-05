import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import TimerDisplay from './components/TimerDisplay';
import TimerControls from './components/TimerControls';
import TimerPresets from './components/TimerPresets';
import FocusStats from './components/FocusStats';
import AuthPanel from './components/AuthPanel';
import StreakDisplay from './components/StreakDisplay';
import Leaderboard from './components/Leaderboard';
import { getTimerState, startTimer, pauseTimer, resetTimer, setCustomTimer } from './utils/chromeMessages.jsx';
import { updateStreak } from '../services/streakService';
import './styles.css';

function App() {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
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

    // Poll for auth changes every second (simple approach)
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
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, []);

  // Handle streak updates when timer completes
  useEffect(() => {
    const handleStreakUpdate = async (message) => {
      if (message.type === 'UPDATE_STREAK' && message.userId) {
        console.log('Processing streak update for user:', message.userId);
        
        try {
          // Get user info from Firebase Auth
          chrome.storage.local.get(['userDisplayName', 'userEmail'], async (storage) => {
            const displayName = storage.userDisplayName || 'User';
            const email = storage.userEmail || '';
            
            const result = await updateStreak(message.userId, displayName, email);
            
            if (result.success) {
              console.log('Streak updated successfully:', result.data);
              
              // Notify StreakDisplay component to refresh
              chrome.runtime.sendMessage({ 
                type: 'STREAK_UPDATED',
                data: result.data 
              }).catch(() => {
                console.log('Could not send streak updated notification');
              });
            } else {
              console.error('Failed to update streak:', result.error);
            }
          });
        } catch (error) {
          console.error('Error updating streak:', error);
        }
      }
    };

    chrome.runtime.onMessage.addListener(handleStreakUpdate);
    return () => chrome.runtime.onMessage.removeListener(handleStreakUpdate);
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

      <StreakDisplay />

      <Leaderboard />
      
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

      <FocusStats />
    </div>
  );
}

// Mount React
const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);