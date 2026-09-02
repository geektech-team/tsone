// lib/style/sheet.ts
function renderStyleSheet(styles) {
  return styles.map((entry) => renderStyleEntry(entry)).join(`

`);
}
function renderStyleEntry(entry, indent = "") {
  if ("atRule" in entry) {
    const rules = entry.rules.map((rule) => renderStyleEntry(rule, `${indent}  `)).join(`

`);
    return `${indent}${entry.atRule} {
${rules}
${indent}}`;
  }
  const declarations = Object.entries(entry.properties).map(([property, value]) => `${indent}  ${toCssProperty(property)}: ${String(value)};`).join(`
`);
  return `${indent}${entry.selector} {
${declarations}
${indent}}`;
}
function toCssProperty(property) {
  if (property.startsWith("--") || property.includes("-")) {
    return property;
  }
  return property.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
}

export { renderStyleSheet };

//# debugId=61B1187B7ADC17DB64756E2164756E21
//# sourceMappingURL=index-vpx80nq5.js.map
