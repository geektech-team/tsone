import { componentPages } from './components';
import { dataDisplayPages } from './data-display';
import { formPages } from './form';
import { feedbackPages } from './feedback';
import { guidePages } from './guide';
import { homePage } from './home';
import { navigationPages } from './navigation';
import { layoutPages } from './layout';
import { validateOneDocPages } from './types';

export const oneDocPages = validateOneDocPages([
  homePage,
  ...guidePages,
  ...componentPages,
  ...dataDisplayPages,
  ...formPages,
  ...navigationPages,
  ...feedbackPages,
  ...layoutPages,
]);

export { oneThemeTokens } from './theme-tokens';
export * from './types';
