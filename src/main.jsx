import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './theme/global.css';
import './components/common/DataTable.css';
import './components/common/FormModal.css';
import './components/common/StatCard.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
