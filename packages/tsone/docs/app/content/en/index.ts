import { enApiPages } from './api';
import { enContributingPages } from './contributing';
import { enExamplePages } from './examples';
import { enGuidePages } from './guide';
import { enHomePages } from './home';

export const enSourcePages = [
  ...enHomePages,
  ...enGuidePages,
  ...enApiPages,
  ...enExamplePages,
  ...enContributingPages,
];
