import React from 'react';
import { createRoot } from 'react-dom/client';

// Simple React component
function App() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Hello from React!</h1>
      <p>TimeBlock Extension - Now with React! 🚀</p>
    </div>
  );
}

// Mount React to DOM
const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);