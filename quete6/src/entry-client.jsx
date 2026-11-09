import {createRoot, hydrateRoot} from 'react-dom/client';
import {BrowserRouter} from 'react-router';
import App from './App.jsx';
import './style.css';

const root = document.getElementById('root');
const app = <BrowserRouter><App /></BrowserRouter>;
if (root.querySelector('main')) {
  hydrateRoot(root, app);
} else {
  createRoot(root).render(app);
}
