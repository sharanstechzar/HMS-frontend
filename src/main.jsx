import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './theme/global.css';
import './components/common/StatCard.css'; // Keep StatCard for now if not migrated

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
