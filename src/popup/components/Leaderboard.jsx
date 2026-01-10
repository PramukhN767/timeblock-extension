import React, { useState, useEffect } from 'react';
import { getUserFocus } from '../../services/focusService';
import { getFriends } from '../../services/friendService';

function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');

  useEffect(() => {
    chrome.storage.local.get(['userId', 'userEmail', 'userDisplayName'], (result) => {
      if (result.userId) {
        setUserId(result.userId);
        setUserEmail(result.userEmail || '');
        setUserName(result.userDisplayName || 'You');
        loadFriendsLeaderboard(result.userId);
      } else {
        setLoading(false);
      }
    });
  }, []);

  const loadFriendsLeaderboard = async (uid) => {
    console.log('Loading friends leaderboard...');
    setLoading(true);
    setError(null);
    
    try {
      const userFocusResult = await getUserFocus(uid);
      const currentUserFocus = userFocusResult.success ? userFocusResult.data.totalMinutes || 0 : 0;
      
      // Get current user's display name from Chrome storage
      const chromeStorage = await chrome.storage.local.get(['userDisplayName', 'userEmail']);
      const currentUserDisplayName = chromeStorage.userDisplayName || userName || 'You';
      const currentUserEmail = chromeStorage.userEmail || userEmail;
      
      // Get friends list
      const friendsResult = await getFriends(uid);
      
      if (!friendsResult.success) {
        // No friends yet - just show current user
        const soloLeaderboard = [{
          userId: uid,
          displayName: currentUserDisplayName,
          email: currentUserEmail,
          totalMinutes: currentUserFocus,
          isCurrentUser: true
        }];
        
        setLeaderboard(soloLeaderboard);
        setLoading(false);
        return;
      }
      
      const leaderboardData = [];
      
      // Add current user
      leaderboardData.push({
        userId: uid,
        displayName: currentUserDisplayName,
        email: currentUserEmail,
        totalMinutes: currentUserFocus,
        isCurrentUser: true
      });
      
      // Add each friend's focus data
      const friends = friendsResult.data || [];
      for (const friend of friends) {
        const friendFocusResult = await getUserFocus(friend.userId);
        const friendFocusMinutes = friendFocusResult.success ? friendFocusResult.data.totalMinutes || 0 : 0;
        
        leaderboardData.push({
          userId: friend.userId,
          displayName: friend.displayName,
          email: friend.email,
          totalMinutes: friendFocusMinutes,
          isCurrentUser: false
        });
      }
      
      // Sort by totalMinutes descending
      leaderboardData.sort((a, b) => b.totalMinutes - a.totalMinutes);
      
      console.log('Friends leaderboard:', leaderboardData);
      setLeaderboard(leaderboardData);
      
    } catch (err) {
      console.error('Error loading friends leaderboard:', err);
      setError(err.message);
    }
    
    setLoading(false);
  };

  // Listen for focus updates
  useEffect(() => {
    const handleMessage = (message) => {
      if (message.type === 'FOCUS_UPDATED' || message.type === 'FOCUS_COMPLETE') {
        console.log('Leaderboard: Refreshing after focus update');
        setTimeout(() => {
          if (userId) loadFriendsLeaderboard(userId);
        }, 1000);
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, [userId]);

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
          <div>Loading...</div>
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
          ⚠️ {error}
        </div>
      </div>
    );
  }

  // Calculate user's rank
  const userRank = leaderboard.findIndex(u => u.isCurrentUser) + 1;

  return (
    <div className="leaderboard">
      <div className="leaderboard-header">
        <span className="leaderboard-icon">🏆</span>
        <span className="leaderboard-title">
          {leaderboard.length === 1 ? 'Your Progress' : 'Leaderboard'}
        </span>
        {leaderboard.length > 1 && (
          <span className="user-rank">#{userRank}</span>
        )}
      </div>
      
      {leaderboard.length === 1 ? (
        // Solo view - just the user
        <div className="leaderboard-solo">
          <div className="leaderboard-item current-user">
            <div className="leaderboard-rank">🎯</div>
            <div className="leaderboard-user">
              <div className="leaderboard-name">
                {leaderboard[0].displayName}
              </div>
              <div className="leaderboard-email">{leaderboard[0].email}</div>
            </div>
            <div className="leaderboard-score">
              <span className="score-value">{leaderboard[0].totalMinutes}</span>
              <span className="score-unit">min</span>
            </div>
          </div>
          
          <div className="leaderboard-empty-message">
            <div style={{fontSize: '32px', marginBottom: '8px'}}>👥</div>
            <div style={{fontSize: '13px', color: '#a0a0b0', marginBottom: '4px'}}>
              Add friends to compete!
            </div>
            <div style={{fontSize: '11px', color: '#606070'}}>
              Find them in the Friends section below
            </div>
          </div>
        </div>
      ) : (
        // Friends leaderboard
        <div className="leaderboard-list">
          {leaderboard.map((user, index) => {
            const isCurrentUser = user.isCurrentUser;
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
      )}
    </div>
  );
}

export default Leaderboard;