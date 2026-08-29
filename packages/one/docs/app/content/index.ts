import { componentPages } from './components';
import { guidePages } from './guide';
import { homePage } from './home';
import { validateOneDocPages } from './types';

export const oneDocPages = validateOneDocPages([
  homePage,
  ...guidePages,
  ...componentPages,
]);

export { oneThemeTokens } from './theme-tokens';
export * from './types';
