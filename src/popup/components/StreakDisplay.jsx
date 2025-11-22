import React, { useState, useEffect } from 'react';
import { getUserStreak } from '../../services/streakService';
import { auth } from '../../services/firebase';

function StreakDisplay() {
  const [streakData, setStreakData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Get current user
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        loadStreak(currentUser.uid);
      } else {
        setStreakData(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Load streak data
  const loadStreak = async (userId) => {
    setLoading(true);
    const result = await getUserStreak(userId);
    
    if (result.success) {
      setStreakData(result.data);
    }
    setLoading(false);
  };

  // Listen for streak updates
  useEffect(() => {
    const handleMessage = (message) => {
      if (message.type === 'STREAK_UPDATED' && user) {
        loadStreak(user.uid);
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, [user]);

  // Don't show if not logged in
  if (!user) {
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