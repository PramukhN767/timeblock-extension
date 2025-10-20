// Get DOM elements
const timerDisplay = document.getElementById('timer');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');

// Timer state
let timeLeft = 25 * 60; // 25 minutes in seconds
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

// Button click handlers
startBtn.addEventListener('click', () => {
  console.log('Start clicked');
  // We'll add timer logic next
});

pauseBtn.addEventListener('click', () => {
  console.log('Pause clicked');
  // We'll add pause logic next
});

resetBtn.addEventListener('click', () => {
  console.log('Reset clicked');
  timeLeft = 25 * 60;
  updateDisplay();
});

// Initialize
updateDisplay();