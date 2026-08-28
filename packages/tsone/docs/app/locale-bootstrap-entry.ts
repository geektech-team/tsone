import {
  runDocsLocaleBootstrap,
  type LocaleBootstrapEnvironment,
} from './locale-bootstrap';

function getStorage(): LocaleBootstrapEnvironment['storage'] {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

runDocsLocaleBootstrap({
  pathname: window.location.pathname,
  storage: getStorage(),
  languages: window.navigator.languages,
  replace: (href) => window.location.replace(href),
});
