// Helper functions to communicate with background worker

const sendMessageToBackground = (type, data = {}) => {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type, ...data }, (response) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(response);
      }
    });
  });
};

const getTimerState = () => {
  return sendMessageToBackground('GET_STATE');
};

const startTimer = () => {
  return sendMessageToBackground('START_TIMER');
};

const pauseTimer = () => {
  return sendMessageToBackground('PAUSE_TIMER');
};

const resetTimer = () => {
  return sendMessageToBackground('RESET_TIMER');
};

const setCustomTimer = (minutes) => {
  return sendMessageToBackground('SET_TIMER', { minutes });
};

// CommonJS exports instead of ES6
module.exports = {
  sendMessageToBackground,
  getTimerState,
  startTimer,
  pauseTimer,
  resetTimer,
  setCustomTimer
};