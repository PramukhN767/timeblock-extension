// Get DOM elements
const timerDisplay = document.getElementById('timer');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');

// Format time as MM:SS
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Update display
function updateDisplay(timeLeft) {
  timerDisplay.textContent = formatTime(timeLeft);
}

// Send message to background
function sendMessage(type) {
  chrome.runtime.sendMessage({ type }, (response) => {
    // Check if response exists
    if (chrome.runtime.lastError) {
      console.log('Message error (this is okay):', chrome.runtime.lastError.message);
      return;
    }
    
    if (response && response.success) {
      updateDisplay(response.state.timeLeft);
      
      // Update button states
      if (response.state.isRunning) {
        startBtn.disabled = true;
      } else {
        startBtn.disabled = false;
      }
    }
  });
}

// Button click handlers
startBtn.addEventListener('click', () => {
  console.log('Start button clicked');
  sendMessage('START_TIMER');
});

pauseBtn.addEventListener('click', () => {
  console.log('Pause button clicked');
  sendMessage('PAUSE_TIMER');
});

resetBtn.addEventListener('click', () => {
  console.log('Reset button clicked');
  sendMessage('RESET_TIMER');
});

// Listen for timer updates from background
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'TIMER_UPDATE') {
    updateDisplay(message.timeLeft);
  }
});

// Get initial state when popup opens
sendMessage('GET_STATE');