import { barChartPage } from './bar';
import { gettingStartedPage } from './getting-started';
import { homePage } from './home';
import { lineChartPage } from './line';
import { pieChartPage } from './pie';
import { radarChartPage } from './radar';
import { validateOneChartDocPages } from './types';

export const oneChartDocPages = validateOneChartDocPages([
  homePage,
  gettingStartedPage,
  barChartPage,
  lineChartPage,
  pieChartPage,
  radarChartPage,
]);

export * from './types';
