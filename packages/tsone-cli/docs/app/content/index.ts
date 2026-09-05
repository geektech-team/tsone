import { configPage, proxyPage } from './config';
import { commandsPage, gettingStartedPage } from './guide';
import { homePage } from './home';
import { apiPage } from './reference';
import { validateCliDocPages } from './types';

export const cliDocPages = validateCliDocPages([
  homePage,
  gettingStartedPage,
  commandsPage,
  configPage,
  proxyPage,
  apiPage,
]);

export * from './types';
