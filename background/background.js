console.log('TimeBlock background worker started');

// Timer state
let timerState = {
  timeLeft: 25 * 60,
  totalDuration: 25 * 60,
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
    stats[today] = (stats[today] || 0) + 1;
    chrome.storage.local.set({ focusStats: stats });
  });
}

// Load timer state from Chrome Storage
function loadTimerState() {
  chrome.storage.local.get(['timerState'], (result) => {
    if (result.timerState) {
      console.log('Loaded timer state from storage:', result.timerState);
      
      const savedState = result.timerState;
      const now = Date.now();
      const elapsed = Math.floor((now - savedState.lastSaved) / 1000);
      
      console.log(`Time elapsed: ${elapsed} seconds`);
      
      if (timerState) {
        timerState.timeLeft = Math.max(0, savedState.timeLeft - elapsed);
        timerState.totalDuration = savedState.totalDuration;
        timerState.isRunning = false;
        timerState.timerInterval = null;
        
        if (savedState.isRunning && timerState.timeLeft > 0) {
          console.log('Restarting timer');
          startTimer();
        }
      }
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
      trackFocusTime();
      saveTimerState();
      
      chrome.runtime.sendMessage({
        type: 'TIMER_UPDATE',
        timeLeft: timerState.timeLeft,
        isRunning: timerState.isRunning
      }).catch(() => {});
      
    } else {
      // Timer finished - STOP
      timerState.isRunning = false;
      
      if (timerState.timerInterval) {
        clearInterval(timerState.timerInterval);
        timerState.timerInterval = null;
      }
      
      const completedMinutes = Math.floor(timerState.totalDuration / 60);
      timerState.timeLeft = timerState.totalDuration;
      saveTimerState();
      
      console.log('Timer finished!', completedMinutes, 'minutes');
      
      // Save completion to storage for popup to pick up
      chrome.storage.local.set({
        lastCompletedSession: {
          minutes: completedMinutes,
          timestamp: Date.now()
        }
      });
      
      // Show notification
      chrome.notifications.create({
        type: 'basic',
        title: 'TimeBlock Timer',
        message: `Great! You focused for ${completedMinutes} minute${completedMinutes !== 1 ? 's' : ''}!`,
        iconUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
      });
      
      // Notify popup
      chrome.runtime.sendMessage({
        type: 'FOCUS_COMPLETE',
        minutesCompleted: completedMinutes
      }).catch(() => {});
      
      chrome.runtime.sendMessage({
        type: 'TIMER_UPDATE',
        timeLeft: timerState.timeLeft,
        isRunning: timerState.isRunning,
        totalDuration: timerState.totalDuration
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
  
  chrome.runtime.sendMessage({
    type: 'TIMER_UPDATE',
    timeLeft: timerState.timeLeft,
    isRunning: timerState.isRunning
  }).catch(() => {});
}

// Reset timer
function resetTimer() {
  timerState.isRunning = false;
  
  if (timerState.timerInterval) {
    clearInterval(timerState.timerInterval);
    timerState.timerInterval = null;
  }
  
  timerState.timeLeft = timerState.totalDuration;
  saveTimerState();
  
  chrome.runtime.sendMessage({
    type: 'TIMER_UPDATE',
    timeLeft: timerState.timeLeft,
    isRunning: timerState.isRunning,
    totalDuration: timerState.totalDuration
  }).catch(() => {});
  
  return {
    success: true,
    state: {
      timeLeft: timerState.timeLeft,
      totalDuration: timerState.totalDuration,
      isRunning: timerState.isRunning
    }
  };
}

// Set timer
function setTimer(minutes) {
  timerState.isRunning = false;
  
  if (timerState.timerInterval) {
    clearInterval(timerState.timerInterval);
    timerState.timerInterval = null;
  }
  
  timerState.totalDuration = minutes * 60;
  timerState.timeLeft = minutes * 60;
  saveTimerState();
  
  chrome.runtime.sendMessage({
    type: 'TIMER_UPDATE',
    timeLeft: timerState.timeLeft,
    isRunning: timerState.isRunning,
    totalDuration: timerState.totalDuration
  }).catch(() => {});
  
  return {
    success: true,
    state: {
      timeLeft: timerState.timeLeft,
      totalDuration: timerState.totalDuration,
      isRunning: timerState.isRunning
    }
  };
}

// Listen for messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received:', message.type);
  
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
      sendResponse(resetTimer());
      break;
    case 'SET_TIMER':
      if (message.minutes) sendResponse(setTimer(message.minutes));
      break;
    case 'GET_STATE':
      sendResponse({ success: true, state: timerState });
      break;
    default:
      sendResponse({ success: false, error: 'Unknown message type' });
  }
  
  return true;
});

loadTimerState();