import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// 開発環境でのサンプルデータ作成機能を読み込み
if (process.env.NODE_ENV === 'development') {
  import('./utils/sampleData');
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);


