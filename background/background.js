console.log('TimeBlock background worker started');

// Timer state
let timerState = {
  timeLeft: 25 * 60, // 25 minutes in seconds 
  isRunning: false,
  timerInterval: null
};

// Start timer
function startTimer() {
  if (timerState.isRunning) return;

  timerState.isRunning = true;

  timerState.timerInterval = setInterval(() => {
    if (timerState.timeLeft > 0) {
      timerState.timeLeft--;
      
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