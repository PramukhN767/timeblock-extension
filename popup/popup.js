// Get DOM elements
const timerDisplay = document.getElementById('timer');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');

// Timer state
let timeLeft = 25 * 60; // 25 minutes in seconds
let timerInterval = null; // Will hold the setInterval ID
let isRunning = false;

// Format time as MM:SS
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Update display
function updateDisplay() {
  timerDisplay.textContent = formatTime(timeLeft);
}

// Start timer
function startTimer() {
  if (isRunning) return; // Prevent multiple intervals
  
  isRunning = true;
  startBtn.disabled = true;
  
  timerInterval = setInterval(() => {
    if (timeLeft > 0) {
      timeLeft--;
      updateDisplay();
    } else {
      // Timer finished
      pauseTimer();
      alert('Time is up! Take a break.');
    }
  }, 1000); // Run every 1000ms (1 second)
}

// Pause timer
function pauseTimer() {
  isRunning = false;
  startBtn.disabled = false;
  
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

// Reset timer
function resetTimer() {
  pauseTimer();
  timeLeft = 25 * 60;
  updateDisplay();
}

// Button click handlers
startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);

// Initialize display
updateDisplay();