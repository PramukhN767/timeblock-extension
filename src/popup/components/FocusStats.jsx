import React, { useState, useEffect } from 'react';

function FocusStats() {
  const [todayMinutes, setTodayMinutes] = useState(0);

  useEffect(() => {
    loadTodayFocus();

    // Listen for focus updates
    const handleMessage = (message) => {
      if (message.type === 'FOCUS_COMPLETE') {
        loadTodayFocus();
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, []);

  const loadTodayFocus = () => {
    chrome.storage.local.get(['focusStats'], (result) => {
      const today = new Date().toDateString();
      const stats = result.focusStats || {};
      const todaySeconds = stats[today] || 0;
      setTodayMinutes(Math.floor(todaySeconds / 60));
    });
  };

  return (
    <div className="focus-stats">
      <div className="stat-item">
        <span className="stat-label">Today:</span>
        <span className="stat-value">{todayMinutes} min</span>
      </div>
    </div>
  );
}

export default FocusStats;