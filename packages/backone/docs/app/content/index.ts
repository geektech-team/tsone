import { homePage } from './home';
import { startPage } from './start';
import { routingPage } from './routing';
import { contextPage } from './context';
import { middlewarePage } from './middleware';
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
  routingPage,
  contextPage,
  middlewarePage,
  errorsPage,
  performancePage,
  createServerPage,
  contextApiPage,
  middlewareApiPage,
  errorsApiPage,
]);

export * from './types';
