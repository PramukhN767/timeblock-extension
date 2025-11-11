function TimerPresets({ isRunning, onSetTimer }) {
  const presets = [
    { minutes: 25, label: '25 min' },
    { minutes: 15, label: '15 min' },
    { minutes: 5, label: '5 min' }
  ];

  return (
    <div className="timer-presets">
      <div className="presets-label">Quick Set:</div>
      {presets.map(preset => (
        <button
          key={preset.minutes}
          className="preset-btn"
          onClick={() => onSetTimer(preset.minutes)}
          disabled={isRunning}
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
}

export default TimerPresets;