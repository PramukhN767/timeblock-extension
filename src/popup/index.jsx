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
    chrome.storage.local.get(['userId'], (result) => {
      console.log('Checking auth, userId:', result.userId);
      setIsAuthenticated(!!result.userId);
      setLoading(false);
    });

    // Listen for auth changes
    const handleStorageChange = (changes, area) => {
      if (area === 'local' && changes.userId) {
        setIsAuthenticated(!!changes.userId.newValue);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  }, []);

  // Check for completed sessions on mount
  useEffect(() => {
    if (isAuthenticated) {
      loadTimerState();
      
      // Check if there's a completed session waiting
      chrome.storage.local.get(['lastCompletedSession'], (result) => {
        if (result.lastCompletedSession) {
          const { minutes, timestamp } = result.lastCompletedSession;
          const timeSince = Date.now() - timestamp;
          
          // If completed within last 5 minutes, sync it
          if (timeSince < 5 * 60 * 1000) {
            console.log('Found pending session:', minutes, 'minutes');
            handleFocusComplete(minutes);
            // Clear it so we don't process again
            chrome.storage.local.remove('lastCompletedSession');
          }
        }
      });
    }
  }, [isAuthenticated]);

  // Listen for timer updates from background
  useEffect(() => {
    const handleMessage = async (message) => {
      console.log('Popup received message:', message);
      
      if (message.type === 'TIMER_UPDATE') {
        setTimeLeft(message.timeLeft);
        setIsRunning(message.isRunning);
        if (message.totalDuration) {
          setTotalDuration(message.totalDuration);
        }
      }
      
      // Handle focus completion
      if (message.type === 'FOCUS_COMPLETE') {
        console.log('FOCUS_COMPLETE received, minutes:', message.minutesCompleted);
        await handleFocusComplete(message.minutesCompleted);
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, [totalDuration]);

  // Handle focus completion (when timer finishes)
  const handleFocusComplete = async (minutesCompleted) => {
    console.log('Focus complete! Minutes:', minutesCompleted);
    
    return new Promise((resolve) => {
      chrome.storage.local.get(['userId', 'userDisplayName', 'userEmail'], async (storage) => {
        if (!storage.userId) {
          console.log('No userId found, skipping focus update');
          resolve();
          return;
        }
        
        const displayName = storage.userDisplayName || 'User';
        const email = storage.userEmail || '';
        const minutes = minutesCompleted || Math.floor(totalDuration / 60);
        
        console.log('Updating focus time:', { 
          userId: storage.userId, 
          minutes, 
          displayName, 
          email 
        });
        
        try {
          const result = await updateFocusTime(storage.userId, minutes, displayName, email);
          
          if (result.success) {
            console.log('Focus time updated successfully!');
            console.log('New total:', result.data);
            
            // Force leaderboard refresh
            setTimeout(() => {
              chrome.runtime.sendMessage({ type: 'FOCUS_UPDATED' }).catch(() => {});
            }, 500);
            
          } else {
            console.error('Failed to update focus time:', result.error);
          }
        } catch (error) {
          console.error('Error updating focus:', error);
        }
        
        resolve();
      });
    });
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
        setTotalDuration(response.state.totalDuration);
        setIsRunning(response.state.isRunning);
      }
    } catch (error) {
      console.error('Failed to reset timer:', error);
    }
  };

  const handleSetTimer = async (minutes) => {
    try {
      const response = await setCustomTimer(minutes);
      if (response && response.success) {
        setTimeLeft(response.state.timeLeft);
        setTotalDuration(response.state.totalDuration);
        setIsRunning(response.state.isRunning);
      }
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