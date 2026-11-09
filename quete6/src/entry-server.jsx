import {renderToString} from 'react-dom/server';
import {StaticRouter} from 'react-router';
import App from './App.jsx';
import {getPage} from './pages.js';
export {routes, origin} from './pages.js';

export function render(pathname) {
  return {
    html: renderToString(<StaticRouter location={pathname}><App /></StaticRouter>),
    metadata: getPage(pathname),
  };
}
