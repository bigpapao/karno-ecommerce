import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { HelmetProvider } from 'react-helmet-async';
import { SpeedInsights } from '@vercel/speed-insights/react';
import './i18n';  // Import i18n configuration
import store from './store';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { routerFutureConfig } from './utils/routerConfig';

// Styles - import order matters for proper loading
import './styles/fonts.css';  // Font definitions
import './styles/rtl-unified.css';  // Unified RTL and Persian styles
import './styles/global.css';  // Global styles
import './index.css';  // Tailwind and other utilities

// Set RTL direction and Persian language
document.documentElement.setAttribute('dir', 'rtl');
document.documentElement.setAttribute('lang', 'fa');
document.body.classList.add('rtl', 'persian-content');

// Authentication is now handled via HTTP-only cookies
// App initialization will check auth status via checkAuth thunk

// Suppress source map warning for stylis-plugin-rtl in development
if (process.env.NODE_ENV === 'development') {
  const originalConsoleError = console.error;
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Failed to parse source map') &&
      args[0].includes('stylis-plugin-rtl')
    ) {
      return;
    }
    originalConsoleError(...args);
  };
}

// Create root and render app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <SpeedInsights />
    <Provider store={store}>
      <BrowserRouter future={routerFutureConfig}>
        <HelmetProvider>
          <App />
        </HelmetProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
