import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { StorageService } from './services/storageService';
import { applyThemeMode } from './services/themeService';
import './index.css';

applyThemeMode(StorageService.getSettings().themeMode);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
