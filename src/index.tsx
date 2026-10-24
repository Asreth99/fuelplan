import React from 'react';
import ReactDOM from 'react-dom/client';
import './style.css';
import ReFuel from './App';
import { Provider } from "./components/ui/provider"
import { ToastProvider } from './toast/toast';
import { AuthProvider } from './auth/useAuth';
import { CarsProvider } from './cars/useCars';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
    <Provider>
      <ToastProvider>
        <AuthProvider>
          <CarsProvider>
            <ReFuel />
          </CarsProvider>
        </AuthProvider>
      </ToastProvider>
    </Provider>
);

