import {createRoot} from 'react-dom/client';
import {installStaticApiFallback} from './lib/apiClient';
import App from './App.tsx';
import './index.css';

installStaticApiFallback();

createRoot(document.getElementById('root')!).render(<App />);
