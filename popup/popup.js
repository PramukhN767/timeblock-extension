// Get DOM elements
const timerDisplay = document.getElementById('timer');
const statusDisplay = document.getElementById('status');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const presetBtns = document.querySelectorAll('.preset-btn');
const todayFocusDisplay = document.getElementById('todayFocus');
const customInput = document.getElementById('customInput');
const setCustomBtn = document.getElementById('setCustomBtn');
const errorMessage = document.getElementById('errorMessage');

// Format time as MM:SS
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Update display
function updateDisplay(timeLeft, isRunning) {
  timerDisplay.textContent = formatTime(timeLeft);
  
  // Update status
  if (isRunning) {
    statusDisplay.textContent = 'Running';
    statusDisplay.className = 'status running';
  } else if (timeLeft < 25 * 60 && timeLeft > 0) {
    statusDisplay.textContent = 'Paused';
    statusDisplay.className = 'status paused';
  } else {
    statusDisplay.textContent = 'Ready';
    statusDisplay.className = 'status';
  }

  // Disable custom input and presets while running
  customInput.disabled = isRunning;
  setCustomBtn.disabled = isRunning;
  presetBtns.forEach(btn => btn.disabled = isRunning);
}

// Send message to background
function sendMessage(type, data = {}) {
  chrome.runtime.sendMessage({ type, ...data }, (response) => {
    if (chrome.runtime.lastError) {
      console.log('Message error:', chrome.runtime.lastError.message);
      return;
    }
    
    if (response && response.success) {
      updateDisplay(response.state.timeLeft, response.state.isRunning);
    }
  });
}

// Load today's focus time
function loadTodayFocus() {
  chrome.storage.local.get(['focusStats'], (result) => {
    const today = new Date().toDateString();
    const stats = result.focusStats || {};
    const totalSeconds = stats[today] || 0;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    todayFocusDisplay.textContent = `${minutes}m ${seconds}s`;
  });
}

// Validate custom timer input
function validateCustomInput(value) {
  const num = parseInt(value);
  
  if (!value || value.trim() === '') {
    return { valid: false, error: 'Please enter a duration' };
  }
  
  if (isNaN(num)) {
    return { valid: false, error: 'Please enter a valid number' };
  }
  
  if (num < 1) {
    return { valid: false, error: 'Minimum 1 minute' };
  }
  
  if (num > 120) {
    return { valid: false, error: 'Maximum 120 minutes' };
  }
  
  return { valid: true, value: num };
}

// Show error message
function showError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.add('show');
  
  setTimeout(() => {
    errorMessage.classList.remove('show');
  }, 3000);
}

// Clear error message
function clearError() {
  errorMessage.classList.remove('show');
}

// Set custom timer
function setCustomTimer() {
  const inputValue = customInput.value;
  const validation = validateCustomInput(inputValue);
  
  if (!validation.valid) {
    showError(validation.error);
    customInput.focus();
    return;
  }
  
  // Valid input, set the timer
  clearError();
  sendMessage('SET_TIMER', { minutes: validation.value });
  customInput.value = ''; // Clear input
  customInput.blur(); // Remove focus
  
  // Optional: Show success feedback
  statusDisplay.textContent = `Set to ${validation.value} min`;
  statusDisplay.className = 'status';
}

// Button click handlers
startBtn.addEventListener('click', () => {
  sendMessage('START_TIMER');
});

pauseBtn.addEventListener('click', () => {
  sendMessage('PAUSE_TIMER');
});

resetBtn.addEventListener('click', () => {
  sendMessage('RESET_TIMER');
});

// Preset buttons
presetBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const minutes = parseInt(btn.dataset.minutes);
    sendMessage('SET_TIMER', { minutes });
  });
});

// Custom timer button
setCustomBtn.addEventListener('click', setCustomTimer);

// Allow Enter key to set timer
customInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    setCustomTimer();
  }
});

// Clear error when user starts typing
customInput.addEventListener('input', clearError);

// Listen for timer updates from background
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'TIMER_UPDATE') {
    updateDisplay(message.timeLeft, message.isRunning);
  }
  if (message.type === 'FOCUS_COMPLETE') {
    loadTodayFocus();
  }
});

// Get initial state when popup opens
sendMessage('GET_STATE');
loadTodayFocus();