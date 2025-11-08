import React from 'react';
import ReactDOM from 'react-dom/client';
import './style.css';
import ReFuel from './App';
import { Provider } from "./components/ui/provider"

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
    <Provider>
      <ReFuel />
    </Provider>
);

