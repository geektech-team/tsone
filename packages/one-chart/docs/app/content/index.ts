import { barChartPage } from './bar';
import { funnelChartPage } from './funnel';
import { gettingStartedPage } from './getting-started';
import { homePage } from './home';
import { lineChartPage } from './line';
import { pieChartPage } from './pie';
import { radarChartPage } from './radar';
import { scatterChartPage } from './scatter';
import { validateOneChartDocPages } from './types';

export const oneChartDocPages = validateOneChartDocPages([
  homePage,
  gettingStartedPage,
  barChartPage,
  lineChartPage,
  pieChartPage,
  radarChartPage,
  scatterChartPage,
  funnelChartPage,
]);

export * from './types';
