import React, { useState, useEffect } from 'react';
import { signInWithEmail, signUpWithEmail, signOutUser, onAuthChange } from '../../services/firebase.jsx';

function AuthPanel() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthChange((currentUser) => {
      setUser(currentUser);
      setLoading(false);
      console.log('Auth state changed:', currentUser);
    
      // Store user ID for background worker
      if (currentUser) {
        chrome.storage.local.set({ userId: currentUser.uid });
      } else {
        chrome.storage.local.remove('userId');
      }
    });
    return () => unsubscribe();
}, []);

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const result = await signInWithEmail(email, password);
      
      if (result.success) {
        setEmail('');
        setPassword('');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle sign up
  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const result = await signUpWithEmail(email, password, displayName);
      
      if (result.success) {
        setEmail('');
        setPassword('');
        setDisplayName('');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    setLoading(true);
    
    try {
      await signOutUser();
      setUser(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading && !user) {
    return (
      <div className="auth-panel">
        <div className="auth-loading">Loading...</div>
      </div>
    );
  }

  // Logged in - show user info
  if (user) {
    return (
      <div className="auth-panel">
        <div className="user-info">
          <div className="user-avatar">{user.displayName?.[0] || user.email[0].toUpperCase()}</div>
          <div className="user-details">
            <div className="user-name">{user.displayName || 'User'}</div>
            <div className="user-email">{user.email}</div>
          </div>
          <button className="auth-btn logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    );
  }

  // Not logged in - show login form
  return (
    <div className="auth-panel">
      <div className="auth-prompt">
        <p className="auth-message">
          {isSignUp ? 'Create an account to sync your data' : 'Sign in to sync your data and compete with friends'}
        </p>
        
        <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="auth-form">
          {isSignUp && (
            <input
              type="text"
              placeholder="Display Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="auth-input"
              required
            />
          )}
          
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="auth-input"
            required
          />
          
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="auth-input"
            required
            minLength="6"
          />
          
          <button type="submit" className="auth-btn login-btn" disabled={loading}>
            {loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </button>
        </form>
        
        <button 
          className="auth-toggle"
          onClick={() => {
            setIsSignUp(!isSignUp);
            setError(null);
          }}
        >
          {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
        </button>
        
        {error && <div className="auth-error">{error}</div>}
      </div>
    </div>
  );
}

export default AuthPanel;