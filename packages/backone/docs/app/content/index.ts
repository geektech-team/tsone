import { homePage } from './home';
import { startPage } from './start';
import { architecturePage } from './architecture';
import { routingPage } from './routing';
import { contextPage } from './context';
import { middlewarePage } from './middleware';
import { websocketPage } from './websocket';
import { ssePage } from './sse';
import { errorsPage } from './errors';
import { performancePage } from './performance';
import { createServerPage } from './create-server';
import { contextApiPage } from './api-context';
import { middlewareApiPage } from './api-middleware';
import { errorsApiPage } from './api-errors';
import { validateBackOneDocPages } from './types';

export const backOneDocPages = validateBackOneDocPages([
  homePage,
  startPage,
  architecturePage,
  routingPage,
  contextPage,
  middlewarePage,
  websocketPage,
  ssePage,
  errorsPage,
  performancePage,
  createServerPage,
  contextApiPage,
  middlewareApiPage,
  errorsApiPage,
]);

export * from './types';
