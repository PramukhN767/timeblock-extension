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
        
        // Filter out invalid entries
        const filteredLeaderboard = result.data.filter(user => {
          // Must have focus time > 0
          if (!user.totalMinutes || user.totalMinutes <= 0) return false;
          
          // Must have valid display name (not empty, not just "User")
          if (!user.displayName || user.displayName.trim() === '') return false;
          
          // Must have valid email
          if (!user.email || user.email.trim() === '') return false;
          
          return true;
        });
        
        console.log('Filtered leaderboard:', filteredLeaderboard);
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
      if (message.type === 'FOCUS_UPDATED' || message.type === 'FOCUS_COMPLETE') {
        console.log('Leaderboard: Refreshing after focus update');
        // Add a small delay to let Firestore update
        setTimeout(() => {
          loadLeaderboard();
        }, 1000);
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
        <div className="leaderboard-error">
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
        <div className="leaderboard-empty">
          <div style={{fontSize: '48px', marginBottom: '12px'}}>🎯</div>
          <div style={{fontSize: '14px', color: '#808090'}}>
            No focus time yet
          </div>
          <div style={{fontSize: '12px', color: '#606070', marginTop: '4px'}}>
            Complete a timer to get on the board!
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="leaderboard">
      <div className="leaderboard-header">
        <span className="leaderboard-icon">🏆</span>
        <span className="leaderboard-title">Total Focus Time</span>
        {userRank && (
          <span className="user-rank">#{userRank}</span>
        )}
      </div>
      
      <div className="leaderboard-list">
        {leaderboard.map((user, index) => {
          const isCurrentUser = user.userId === userId;
          const rankEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`;
          
          return (
            <div 
              key={user.userId} 
              className={`leaderboard-item ${isCurrentUser ? 'current-user' : ''}`}
            >
              <div className="leaderboard-rank">{rankEmoji}</div>
              <div className="leaderboard-user">
                <div className="leaderboard-name">
                  {user.displayName}
                  {isCurrentUser && <span className="you-badge">You</span>}
                </div>
                <div className="leaderboard-email">{user.email}</div>
              </div>
              <div className="leaderboard-score">
                <span className="score-value">{user.totalMinutes}</span>
                <span className="score-unit">min</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Leaderboard;