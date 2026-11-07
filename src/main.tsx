import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/index.css';
import App from './App';
import { AuthProvider } from './auth/AuthContext';
import { PrivacyPage, isPrivacyPath } from './components/PrivacyPage';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isPrivacyPath(window.location.pathname) ? <PrivacyPage /> : (
      <AuthProvider>
        <App />
      </AuthProvider>
    )}
  </StrictMode>,
);
