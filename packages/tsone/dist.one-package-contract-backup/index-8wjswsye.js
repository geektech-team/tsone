// lib/style/StyleManager.ts
class StyleManager {
  styleElement;
  styles = new Map;
  constructor() {
    this.styleElement = document.createElement("style");
    document.head.appendChild(this.styleElement);
  }
  addStyle(name, options) {
    this.styles.set(name, options);
    this.updateStyles();
  }
  removeStyle(name) {
    this.styles.delete(name);
    this.updateStyles();
  }
  clearStyles() {
    this.styles.clear();
    this.styleElement.textContent = "";
  }
  destroy() {
    this.clearStyles();
    this.styleElement.remove();
  }
  convertToCSS(properties) {
    return Object.entries(properties).map(([key, value]) => {
      const cssKey = key.replace(/([A-Z])/g, "-$1").toLowerCase();
      return `${cssKey}: ${value};`;
    }).join(`
`);
  }
  updateStyles() {
    let cssText = "";
    this.styles.forEach((style) => {
      cssText += `${style.selector} {
${this.convertToCSS(style.properties)}
}
`;
      if (style.hover) {
        cssText += `${style.selector}:hover {
${this.convertToCSS(style.hover)}
}
`;
      }
      if (style.media) {
        Object.entries(style.media).forEach(([query, properties]) => {
          cssText += `@media ${query} {
${style.selector} {
${this.convertToCSS(properties)}
}
}
`;
        });
      }
    });
    this.styleElement.textContent = cssText;
  }
}

export { StyleManager };

//# debugId=401A1B62728D384364756E2164756E21
//# sourceMappingURL=index-8wjswsye.js.map
