# Development Notes

## Storage Reset Commands

If timer shows wrong time during development:

### Clear Chrome Storage:
```javascript
chrome.storage.local.clear(() => {
  console.log('Storage cleared!');
});
```

### Reset Timer State:
```javascript
timerState = {
  timeLeft: 25 * 60,
  totalDuration: 25 * 60,
  isRunning: false,
  timerInterval: null
};
```

### View All Stored Data:
```javascript
chrome.storage.local.get(null, (items) => {
  console.log('All stored data:', items);
});
```

## Last Updated
November 20, 2025