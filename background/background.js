console.log('TimeBlock background worker started');

// Timer state
let timerState = {
  timeLeft: 25 * 60, // 25 minutes in seconds (change to 10 for quick testing)
  isRunning: false,
  timerInterval: null
};

// Save timer state to Chrome Storage
function saveTimerState() {
  chrome.storage.local.set({ 
    timerState: {
      timeLeft: timerState.timeLeft,
      isRunning: timerState.isRunning,
      lastSaved: Date.now() // Timestamp when saved
    }
  }, () => {
    console.log('Timer state saved:', timerState);
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
      const elapsed = Math.floor((now - savedState.lastSaved) / 1000); // seconds
      
      console.log(`Time elapsed while Chrome was closed: ${elapsed} seconds`);
      
      // Restore timeLeft (subtract elapsed time)
      timerState.timeLeft = Math.max(0, savedState.timeLeft - elapsed);
      
      // Important: Set isRunning to FALSE first
      timerState.isRunning = false;
      timerState.timerInterval = null;
      
      // If timer was running and still has time left, restart it
      if (savedState.isRunning && timerState.timeLeft > 0) {
        console.log('Timer was running, restarting with', timerState.timeLeft, 'seconds left');
        startTimer(); // This will set isRunning to true
      } else if (timerState.timeLeft === 0) {
        console.log('Timer finished while Chrome was closed');
        // Show notification
        chrome.notifications.create({
          type: 'basic',
          title: 'TimeBlock Timer',
          message: 'Timer finished while you were away!',
          iconUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
        });
      } else {
        console.log('Timer was paused, keeping it paused');
      }
    } else {
      console.log('No saved timer state found');
    }
  });
}

// Load state when background worker starts
loadTimerState();

// Start timer
function startTimer() {
  if (timerState.isRunning) return;

  timerState.isRunning = true;

  timerState.timerInterval = setInterval(() => {
    if (timerState.timeLeft > 0) {
      timerState.timeLeft--;

      // Save state every second
      saveTimerState();
      
      // Try to send update to popup (ignore if closed)
      chrome.runtime.sendMessage({
        type: 'TIMER_UPDATE',
        timeLeft: timerState.timeLeft
      }).catch(() => {
        // Popup is closed, ignore error
      });
      
    } else {
      // Timer finished
      timerState.isRunning = false;
      
      if (timerState.timerInterval) {
        clearInterval(timerState.timerInterval);
        timerState.timerInterval = null;
      }
      
      // Reset time
      timerState.timeLeft = 25 * 60;
      
      console.log('Timer finished! Showing notification...');
      
      // Show notification
      chrome.notifications.create({
        type: 'basic',
        title: 'TimeBlock Timer',
        message: 'Time is up! Take a break.',
        iconUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
      });
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

  // Save state 
  saveTimerState();
  
  // Send current state to popup
  chrome.runtime.sendMessage({
    type: 'TIMER_UPDATE',
    timeLeft: timerState.timeLeft
  }).catch(() => {
    // Popup might be closed, that's okay
  });
}

// Reset timer
function resetTimer() {
  pauseTimer();
  timerState.timeLeft = 25 * 60;

  // Save state every second
  saveTimerState();
  
  // Send update to popup immediately
  chrome.runtime.sendMessage({
    type: 'TIMER_UPDATE',
    timeLeft: timerState.timeLeft
  }).catch(() => {
    // Popup might be closed, that's okay
  });
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
      
    case 'GET_STATE':
      sendResponse({ success: true, state: timerState });
      break;
      
    default:
      sendResponse({ success: false, error: 'Unknown message type' });
  }
  
  return true; // Keep message channel open for async response
});