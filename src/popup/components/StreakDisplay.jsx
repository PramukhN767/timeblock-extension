import React, { useState, useEffect } from 'react';
import { getUserStreak } from '../../services/streakService';

function StreakDisplay() {
  const [streakData, setStreakData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  // Get user ID from Chrome Storage
  useEffect(() => {
    chrome.storage.local.get(['userId'], (result) => {
      if (result.userId) {
        setUserId(result.userId);
        loadStreak(result.userId);
      } else {
        setLoading(false);
      }
    });
  }, []);

  // Load streak data
  const loadStreak = async (uid) => {
    setLoading(true);
    const result = await getUserStreak(uid);
    
    if (result.success) {
      setStreakData(result.data);
    }
    setLoading(false);
  };

  // Listen for streak updates
  useEffect(() => {
    const handleMessage = (message) => {
      if (message.type === 'STREAK_UPDATED' && userId) {
        loadStreak(userId);
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, [userId]);

  // Don't show if not logged in
  if (!userId) {
    return null;
  }

  if (loading) {
    return (
      <div className="streak-display">
        <div className="streak-loading">Loading streak...</div>
      </div>
    );
  }

  if (!streakData) {
    return null;
  }

  return (
    <div className="streak-display">
      <div className="streak-header">
        <span className="streak-icon">🔥</span>
        <span className="streak-title">Your Streak</span>
      </div>
      
      <div className="streak-stats">
        <div className="streak-stat-item">
          <div className="streak-stat-value">{streakData.currentStreak}</div>
          <div className="streak-stat-label">Current</div>
        </div>
        
        <div className="streak-stat-item">
          <div className="streak-stat-value">{streakData.longestStreak}</div>
          <div className="streak-stat-label">Longest</div>
        </div>
        
        <div className="streak-stat-item">
          <div className="streak-stat-value">{streakData.totalDays}</div>
          <div className="streak-stat-label">Total Days</div>
        </div>
      </div>
    </div>
  );
}

export default StreakDisplay;