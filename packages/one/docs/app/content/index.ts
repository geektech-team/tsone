import { componentPages } from './components';
import { formPages } from './form';
import { guidePages } from './guide';
import { homePage } from './home';
import { validateOneDocPages } from './types';

export const oneDocPages = validateOneDocPages([
  homePage,
  ...guidePages,
  ...componentPages,
  ...formPages,
]);

export { oneThemeTokens } from './theme-tokens';
export * from './types';
