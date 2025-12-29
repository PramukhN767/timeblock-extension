import React, { useState } from 'react';

function CustomTimerInput({ isRunning, onSetTimer }) {
  const [customMinutes, setCustomMinutes] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const minutes = parseInt(customMinutes);
    
    // Validation
    if (!customMinutes || customMinutes.trim() === '') {
      setError('Enter a duration');
      return;
    }
    
    if (isNaN(minutes) || minutes < 1) {
      setError('Minimum 1 minute');
      return;
    }
    
    if (minutes > 120) {
      setError('Maximum 120 minutes');
      return;
    }
    
    // Valid - set timer
    setError('');
    onSetTimer(minutes);
    setCustomMinutes('');
  };

  const handleChange = (e) => {
    setCustomMinutes(e.target.value);
    if (error) setError('');
  };

  return (
    <div className="custom-timer-section">
      <form onSubmit={handleSubmit} className="custom-timer-form">
        <label className="custom-label">Custom:</label>
        <input
          type="number"
          value={customMinutes}
          onChange={handleChange}
          placeholder="30"
          min="1"
          max="120"
          className="custom-input"
          disabled={isRunning}
        />
        <span className="custom-unit">min</span>
        <button 
          type="submit" 
          className="custom-set-btn"
          disabled={isRunning || !customMinutes}
        >
          Set
        </button>
      </form>
      {error && (
        <div className="custom-error">{error}</div>
      )}
    </div>
  );
}

export default CustomTimerInput;