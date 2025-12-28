import React, { useState, useEffect } from 'react';
import { getLeaderboard, getUserRank } from '../../services/streakService';

function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);
  const [userRank, setUserRank] = useState(null);
  const [currentStreak, setCurrentStreak] = useState(0);

  // Get user ID from Chrome Storage
  useEffect(() => {
    console.log('Leaderboard: Checking for userId...');
    chrome.storage.local.get(['userId'], (result) => {
      console.log('Leaderboard: Storage result:', result);
      if (result.userId) {
        console.log('Leaderboard: Found userId, loading leaderboard');
        setUserId(result.userId);
        loadLeaderboard();
      } else {
        console.log('Leaderboard: No userId found');
        setLoading(false);
      }
    });
  }, []);

  // Load leaderboard data
  const loadLeaderboard = async () => {
    console.log('Leaderboard: Starting to load...');
    setLoading(true);
    setError(null);
    
    try {
      console.log('Leaderboard: Calling getLeaderboard...');
      const result = await getLeaderboard(10);
      console.log('Leaderboard: Result:', result);
      
      if (result.success) {
        console.log('Leaderboard: Data loaded:', result.data);
        setLeaderboard(result.data);
        
        // Get current user's streak to calculate rank
        chrome.storage.local.get(['userId'], async (storage) => {
          if (storage.userId) {
            const userInLeaderboard = result.data.find(u => u.userId === storage.userId);
            if (userInLeaderboard) {
              setCurrentStreak(userInLeaderboard.currentStreak);
              const rankResult = await getUserRank(storage.userId, userInLeaderboard.currentStreak);
              if (rankResult.success) {
                setUserRank(rankResult.rank);
              }
            }
          }
        });
      } else {
        console.error('Leaderboard: Failed to load:', result.error);
        setError(result.error);
      }
    } catch (err) {
      console.error('Leaderboard: Error loading:', err);
      setError(err.message);
    }
    
    setLoading(false);
  };

  // Listen for streak updates to refresh leaderboard
  useEffect(() => {
    const handleMessage = (message) => {
      if (message.type === 'STREAK_UPDATED') {
        console.log('Leaderboard: Refreshing after streak update');
        loadLeaderboard();
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, []);

  // Don't show if not logged in
  if (!userId) {
    return null;
  }

  if (loading) {
    return (
      <div className="leaderboard">
        <div className="leaderboard-header">
          <span className="leaderboard-icon">🏆</span>
          <span className="leaderboard-title">Leaderboard</span>
        </div>
        <div className="leaderboard-loading">
          <span style={{fontSize: '24px'}}>⏳</span>
          <div>Loading leaderboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="leaderboard">
        <div className="leaderboard-header">
          <span className="leaderboard-icon">🏆</span>
          <span className="leaderboard-title">Leaderboard</span>
        </div>
        <div style={{ color: '#ff4757', fontSize: '13px', textAlign: 'center', padding: '16px' }}>
          Error loading leaderboard: {error}
        </div>
      </div>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <div className="leaderboard">
        <div className="leaderboard-header">
          <span className="leaderboard-icon">🏆</span>
          <span className="leaderboard-title">Leaderboard</span>
        </div>
        <div style={{ color: '#888', fontSize: '13px', textAlign: 'center', padding: '16px' }}>
          No users with streaks yet. Start a timer to get on the board!
        </div>
      </div>
    );
  }

  return (
    <div className="leaderboard">
      <div className="leaderboard-header">
        <span className="leaderboard-icon">🏆</span>
        <span className="leaderboard-title">Leaderboard</span>
        {userRank && (
          <span className="user-rank">Your Rank: #{userRank}</span>
        )}
      </div>
      
      <div className="leaderboard-list">
        {leaderboard
          .filter(user => user.displayName && user.displayName !== 'Anonymous') // Filter out anonymous users
          .map((user, index) => {
          const isCurrentUser = user.userId === userId;
          const rankEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
          
          return (
            <div 
              key={user.userId} 
              className={`leaderboard-item ${isCurrentUser ? 'current-user' : ''}`}
            >
              <div className="leaderboard-rank">{rankEmoji}</div>
              <div className="leaderboard-user-info">
                <div className="leaderboard-user-name">
                  {user.displayName || 'Anonymous'}
                  {isCurrentUser && <span className="you-badge">You</span>}
                </div>
                <div className="leaderboard-user-email">{user.email}</div>
              </div>
              <div className="leaderboard-streak">
                <span className="streak-number">{user.currentStreak}</span>
                <span className="streak-icon-small">🔥</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Leaderboard;