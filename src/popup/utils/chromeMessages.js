// Helper functions to communicate with background worker

export const sendMessageToBackground = (type, data = {}) => {
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

export const getTimerState = () => {
  return sendMessageToBackground('GET_STATE');
};

export const startTimer = () => {
  return sendMessageToBackground('START_TIMER');
};

export const pauseTimer = () => {
  return sendMessageToBackground('PAUSE_TIMER');
};

export const resetTimer = () => {
  return sendMessageToBackground('RESET_TIMER');
};

export const setCustomTimer = (minutes) => {
  return sendMessageToBackground('SET_TIMER', { minutes });
};