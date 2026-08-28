import { apiPages } from './api';
import { contributingPages } from './contributing';
import { examplePages } from './examples';
import { guidePages } from './guide';
import { homePages } from './home';

export const zhSourcePages = [
  ...homePages,
  ...guidePages,
  ...apiPages,
  ...examplePages,
  ...contributingPages,
];
