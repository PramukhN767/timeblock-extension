console.log('TimeBlock background worker started');

// Timer state
let timerState = {
  timeLeft: 25 * 60, // 25 minutes in seconds
  totalDuration: 25 * 60, // Track original duration
  isRunning: false,
  timerInterval: null
};

// Save timer state to Chrome Storage
function saveTimerState() {
  chrome.storage.local.set({ 
    timerState: {
      timeLeft: timerState.timeLeft,
      totalDuration: timerState.totalDuration,
      isRunning: timerState.isRunning,
      lastSaved: Date.now()
    }
  });
}

// Track focus time (for stats)
function trackFocusTime() {
  const today = new Date().toDateString();
  
  chrome.storage.local.get(['focusStats'], (result) => {
    const stats = result.focusStats || {};
    stats[today] = (stats[today] || 0) + 1; // Add 1 second
    
    chrome.storage.local.set({ focusStats: stats });
  });
}

// Load timer state from Chrome Storage
function loadTimerState() {
  chrome.storage.local.get(['timerState'], (result) => {
    if (result.timerState) {
      console.log('Loaded timer state from storage:', result.timerState);
      
      const savedState = result.timerState;
      
      // Calculate time elapsed while Chrome was closed
      const now = Date.now();
      const elapsed = Math.floor((now - savedState.lastSaved) / 1000);
      
      console.log(`Time elapsed while Chrome was closed: ${elapsed} seconds`);
      
      // Restore state
      timerState.timeLeft = Math.max(0, savedState.timeLeft - elapsed);
      timerState.totalDuration = savedState.totalDuration;
      timerState.isRunning = false;
      timerState.timerInterval = null;
      
      // If timer was running and still has time left, restart it
      if (savedState.isRunning && timerState.timeLeft > 0) {
        console.log('Timer was running, restarting with', timerState.timeLeft, 'seconds left');
        startTimer();
      } else if (timerState.timeLeft === 0 && savedState.isRunning) {
        console.log('Timer finished while Chrome was closed');
        // Show notification
        chrome.notifications.create({
          type: 'basic',
          title: 'TimeBlock Timer',
          message: 'Timer finished while you were away!',
          iconUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
        });
      }
    } else {
      console.log('No saved timer state found');
    }
  });
}

// Start timer
function startTimer() {
  if (timerState.isRunning) return;
  
  timerState.isRunning = true;
  
  timerState.timerInterval = setInterval(() => {
    if (timerState.timeLeft > 0) {
      timerState.timeLeft--;
      
      // Track focus time
      trackFocusTime();
      
      // Save state every second
      saveTimerState();
      
      // Send update to popup
      chrome.runtime.sendMessage({
        type: 'TIMER_UPDATE',
        timeLeft: timerState.timeLeft,
        isRunning: timerState.isRunning
      }).catch(() => {});
      
    } else {
      // Timer finished
      timerState.isRunning = false;
      
      if (timerState.timerInterval) {
        clearInterval(timerState.timerInterval);
        timerState.timerInterval = null;
      }
      
      // Reset to original duration
      timerState.timeLeft = timerState.totalDuration;
      saveTimerState();

      // Update streak (NEW CODE)
      chrome.storage.local.get(['userId'], (result) => {
        if (result.userId) {
        // Send message to update streak
        chrome.runtime.sendMessage({
          type: 'UPDATE_STREAK',
          userId: result.userId
        }).catch(() => {
          console.log('Could not send streak update message');
        });
      }
    });
      
      console.log('Timer finished! Showing notification...');
      
      // Show notification
      chrome.notifications.create({
        type: 'basic',
        title: 'TimeBlock Timer',
        message: 'Time is up! Take a break.',
        iconUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
      });
      
      // Notify popup to update stats
      chrome.runtime.sendMessage({
        type: 'FOCUS_COMPLETE'
      }).catch(() => {});
    }
  }, 1000);
}

// Pause timer
function pauseTimer() {
  timerState.isRunning = false;
  
  if (timerState.timerInterval) {
    clearInterval(timerState.timerInterval);
    timerState.timerInterval = null;
  }
  
  saveTimerState();
  
  // Send current state to popup
  chrome.runtime.sendMessage({
    type: 'TIMER_UPDATE',
    timeLeft: timerState.timeLeft,
    isRunning: timerState.isRunning
  }).catch(() => {});
}

// Reset timer
function resetTimer() {
  pauseTimer();
  timerState.timeLeft = timerState.totalDuration;
  
  saveTimerState();
  
  // Send update to popup
  chrome.runtime.sendMessage({
    type: 'TIMER_UPDATE',
    timeLeft: timerState.timeLeft,
    isRunning: timerState.isRunning
  }).catch(() => {});
}

// Set timer to custom duration
function setTimer(minutes) {
  pauseTimer();
  timerState.totalDuration = minutes * 60;
  timerState.timeLeft = minutes * 60;
  
  saveTimerState();
  
  console.log(`Timer set to ${minutes} minutes`);
  
  // Send update to popup
  chrome.runtime.sendMessage({
    type: 'TIMER_UPDATE',
    timeLeft: timerState.timeLeft,
    isRunning: timerState.isRunning
  }).catch(() => {});
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message);
  
  switch (message.type) {
    case 'START_TIMER':
      startTimer();
      sendResponse({ success: true, state: timerState });
      break;
      
    case 'PAUSE_TIMER':
      pauseTimer();
      sendResponse({ success: true, state: timerState });
      break;
      
    case 'RESET_TIMER':
      resetTimer();
      sendResponse({ success: true, state: timerState });
      break;
      
    case 'SET_TIMER':
      if (message.minutes) {
        setTimer(message.minutes);
      }
      sendResponse({ success: true, state: timerState });
      break;
      
    case 'GET_STATE':
      sendResponse({ success: true, state: timerState });
      break;
      
    default:
      sendResponse({ success: false, error: 'Unknown message type' });
  }
  
  return true;
});

// Load state when background worker starts
loadTimerState();