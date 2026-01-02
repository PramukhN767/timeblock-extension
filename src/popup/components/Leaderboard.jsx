import React, { useState, useEffect } from 'react';
import { getLeaderboard, getUserRank } from '../../services/focusService';

function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);
  const [userRank, setUserRank] = useState(null);

  // Get user ID from Chrome Storage
  useEffect(() => {
    chrome.storage.local.get(['userId'], (result) => {
      if (result.userId) {
        setUserId(result.userId);
        loadLeaderboard();
      } else {
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
        
        // Filter out users with no focus time or invalid names
        const filteredLeaderboard = result.data.filter(user => 
          user.totalMinutes > 0 && 
          user.displayName && 
          user.displayName !== 'Anonymous'
        );
        
        setLeaderboard(filteredLeaderboard);
        
        // Get current user's rank
        chrome.storage.local.get(['userId'], async (storage) => {
          if (storage.userId) {
            const userInLeaderboard = filteredLeaderboard.find(u => u.userId === storage.userId);
            if (userInLeaderboard) {
              const rankResult = await getUserRank(storage.userId, userInLeaderboard.totalMinutes);
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

  // Listen for focus updates to refresh leaderboard
  useEffect(() => {
    const handleMessage = (message) => {
      if (message.type === 'FOCUS_UPDATED') {
        console.log('Leaderboard: Refreshing after focus update');
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
          <span style={{fontSize: '28px'}}>⏳</span>
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
          ⚠️ Error: {error}
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
          No focus time yet. Complete a timer to get on the board!
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
          <span className="user-rank">Rank: #{userRank}</span>
        )}
      </div>
      
      <div className="leaderboard-list">
        {leaderboard.map((user, index) => {
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
              <div className="leaderboard-focus">
                <span className="focus-number">{user.totalMinutes}</span>
                <span className="focus-label">min</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Leaderboard;