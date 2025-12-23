import React, { useState, useEffect } from 'react';
import { sendFriendRequest, getFriendRequests, acceptFriendRequest, rejectFriendRequest, getFriends } from '../../services/friendService';

function Friends() {
  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [friendEmail, setFriendEmail] = useState('');
  const [friendRequests, setFriendRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'

  useEffect(() => {
    chrome.storage.local.get(['userId', 'userEmail', 'userDisplayName'], (result) => {
      if (result.userId) {
        setUserId(result.userId);
        setUserEmail(result.userEmail || '');
        setUserName(result.userDisplayName || 'User');
        loadData(result.userId);
      } else {
        setLoading(false);
      }
    });
  }, []);

  const loadData = async (uid) => {
    setLoading(true);
    
    const requestsResult = await getFriendRequests(uid);
    if (requestsResult.success) {
      setFriendRequests(requestsResult.data);
    }
    
    const friendsResult = await getFriends(uid);
    if (friendsResult.success) {
      setFriends(friendsResult.data);
    }
    
    setLoading(false);
  };

  const showMessage = (text, type = 'success') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 3000);
  };

  const handleSendRequest = async (e) => {
    e.preventDefault();
    if (!friendEmail.trim()) return;
    
    setMessage('Sending...');
    setMessageType('info');
    
    const result = await sendFriendRequest(userId, userEmail, userName, friendEmail.trim());
    
    if (result.success) {
      showMessage('✅ Friend request sent!', 'success');
      setFriendEmail('');
    } else {
      showMessage(`❌ ${result.error}`, 'error');
    }
  };

  const handleAccept = async (requestId) => {
    const result = await acceptFriendRequest(requestId, userId);
    if (result.success) {
      loadData(userId);
      showMessage('✅ Friend request accepted!', 'success');
    } else {
      showMessage(`❌ ${result.error}`, 'error');
    }
  };

  const handleReject = async (requestId) => {
    const result = await rejectFriendRequest(requestId);
    if (result.success) {
      loadData(userId);
      showMessage('Request rejected', 'info');
    }
  };

  if (!userId) return null;

  if (loading) {
    return (
      <div className="friends-panel">
        <div className="friends-header">
          <span className="friends-icon">👥</span>
          <span className="friends-title">Friends</span>
        </div>
        <div className="friends-loading">
          <span style={{fontSize: '28px'}}>⏳</span>
          <div>Loading friends...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="friends-panel">
      <div className="friends-header">
        <span className="friends-icon">👥</span>
        <span className="friends-title">Friends</span>
      </div>
      
      {/* Add Friend Form */}
      <form onSubmit={handleSendRequest} className="add-friend-form">
        <input
          type="email"
          placeholder="Friend's email"
          value={friendEmail}
          onChange={(e) => setFriendEmail(e.target.value)}
          className="friend-input"
          required
        />
        <button type="submit" className="friend-add-btn">Add</button>
      </form>
      
      {/* Message Display */}
      {message && (
        <div className={`friend-message ${messageType}`}>
          {message}
        </div>
      )}
      
      {/* Friend Requests */}
      {friendRequests.length > 0 && (
        <div className="friend-section">
          <div className="section-title">Pending Requests ({friendRequests.length})</div>
          <div className="friend-list">
            {friendRequests.map(req => (
              <div key={req.id} className="friend-item request">
                <div className="friend-avatar">{req.fromName[0].toUpperCase()}</div>
                <div className="friend-info">
                  <div className="friend-name">{req.fromName}</div>
                  <div className="friend-email">{req.fromEmail}</div>
                </div>
                <div className="friend-actions">
                  <button 
                    onClick={() => handleAccept(req.id)} 
                    className="accept-btn"
                    title="Accept"
                  >
                    ✓
                  </button>
                  <button 
                    onClick={() => handleReject(req.id)} 
                    className="reject-btn"
                    title="Reject"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Friends List */}
      {friends.length > 0 && (
        <div className="friend-section">
          <div className="section-title">Your Friends ({friends.length})</div>
          <div className="friend-list">
            {friends.map(friend => (
              <div key={friend.id} className="friend-item">
                <div className="friend-avatar">{friend.displayName[0].toUpperCase()}</div>
                <div className="friend-info">
                  <div className="friend-name">{friend.displayName}</div>
                  <div className="friend-email">{friend.email}</div>
                </div>
                <div className="friend-status">Friends ✓</div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Empty State */}
      {friends.length === 0 && friendRequests.length === 0 && (
        <div className="friends-empty">
          <div style={{fontSize: '48px', marginBottom: '12px'}}>👋</div>
          <div style={{fontSize: '14px', color: '#808090', marginBottom: '8px'}}>
            No friends yet
          </div>
          <div style={{fontSize: '12px', color: '#606070'}}>
            Add someone using their email above
          </div>
        </div>
      )}
    </div>
  );
}

export default Friends;