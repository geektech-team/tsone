export const docsCss = `
:root {
  color-scheme: light;
  --docs-bg: #ffffff;
  --docs-surface: #f8fafc;
  --docs-text: #162033;
  --docs-muted: #5f6b7a;
  --docs-border: #d9e2ec;
  --docs-accent: #1565c0;
  --docs-code-bg: #0f172a;
  --docs-code-text: #e2e8f0;
}

:root[data-theme='dark'] {
  color-scheme: dark;
  --docs-bg: #10141f;
  --docs-surface: #171d2b;
  --docs-text: #edf2f7;
  --docs-muted: #a8b3c2;
  --docs-border: #2a3446;
  --docs-accent: #73b7ff;
  --docs-code-bg: #060914;
  --docs-code-text: #dbeafe;
}

body {
  margin: 0;
  background: var(--docs-bg);
  color: var(--docs-text);
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.docs-shell {
  min-height: 100vh;
}

.docs-topbar {
  align-items: center;
  border-bottom: 1px solid var(--docs-border);
  display: flex;
  gap: 24px;
  justify-content: space-between;
  min-height: 56px;
  padding: 0 28px;
}

.docs-brand {
  color: var(--docs-text);
  font-size: 18px;
  font-weight: 700;
  text-decoration: none;
}

.docs-tools {
  align-items: center;
  display: flex;
  min-height: 38px;
}

.docs-layout {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  min-height: calc(100vh - 57px);
}

.docs-sidebar {
  background: var(--docs-surface);
  border-right: 1px solid var(--docs-border);
  padding: 20px 18px;
}

.docs-search {
  margin-bottom: 20px;
  min-height: 40px;
}

.docs-nav-section + .docs-nav-section {
  margin-top: 22px;
}

.docs-nav h2 {
  color: var(--docs-muted);
  font-size: 12px;
  letter-spacing: 0;
  margin: 0 0 8px;
  text-transform: uppercase;
}

.docs-nav ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

.docs-nav a {
  border-radius: 6px;
  color: var(--docs-muted);
  display: block;
  font-size: 14px;
  line-height: 1.4;
  padding: 7px 9px;
  text-decoration: none;
}

.docs-nav a.active,
.docs-nav a:hover {
  background: rgba(21, 101, 192, 0.12);
  color: var(--docs-accent);
}

.docs-main {
  max-width: 920px;
  padding: 44px 56px 72px;
}

.doc-section-label {
  color: var(--docs-accent);
  font-size: 13px;
  font-weight: 700;
  margin: 0 0 12px;
}

.doc-article h1 {
  font-size: 42px;
  line-height: 1.12;
  margin: 0 0 18px;
}

.doc-article h2 {
  border-top: 1px solid var(--docs-border);
  font-size: 26px;
  margin: 36px 0 14px;
  padding-top: 28px;
}

.doc-article h3 {
  font-size: 20px;
  margin: 28px 0 10px;
}

.doc-article p,
.doc-article li {
  color: var(--docs-muted);
  font-size: 16px;
  line-height: 1.75;
}

.doc-article a {
  color: var(--docs-accent);
}

.doc-article code {
  background: var(--docs-surface);
  border: 1px solid var(--docs-border);
  border-radius: 4px;
  color: var(--docs-text);
  font-size: 0.92em;
  padding: 2px 5px;
}

.doc-article pre {
  background: var(--docs-code-bg);
  border-radius: 8px;
  color: var(--docs-code-text);
  overflow: auto;
  padding: 16px;
}

.doc-article pre code {
  background: transparent;
  border: 0;
  color: inherit;
  padding: 0;
}

.doc-api-table {
  border-collapse: collapse;
  width: 100%;
}

.doc-api-table th,
.doc-api-table td {
  border-bottom: 1px solid var(--docs-border);
  padding: 10px;
  text-align: left;
  vertical-align: top;
}

.doc-callout {
  border: 1px solid var(--docs-border);
  border-left: 4px solid var(--docs-accent);
  border-radius: 8px;
  padding: 14px 16px;
}

.docs-search input {
  border: 1px solid var(--docs-border);
  border-radius: 6px;
  box-sizing: border-box;
  color: var(--docs-text);
  font: inherit;
  padding: 8px 10px;
  width: 100%;
}

.docs-search-results {
  list-style: none;
  margin: 10px 0 18px;
  padding: 0;
}

.docs-search-results a {
  color: var(--docs-text);
  display: block;
  font-size: 14px;
  padding: 5px 0;
  text-decoration: none;
}

.docs-theme-toggle {
  border: 1px solid var(--docs-border);
  border-radius: 6px;
  background: var(--docs-surface);
  color: var(--docs-text);
  cursor: pointer;
  font: inherit;
  padding: 7px 10px;
}

@media (max-width: 820px) {
  .docs-layout {
    display: block;
  }

  .docs-sidebar {
    border-bottom: 1px solid var(--docs-border);
    border-right: 0;
  }

  .docs-main {
    padding: 32px 22px 56px;
  }

  .doc-article h1 {
    font-size: 34px;
  }
}
`;
