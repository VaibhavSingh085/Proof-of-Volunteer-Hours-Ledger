// LegalDocVault contract exports
// LegalDoc requires: npm run compact (compiles legaldoc.compact -> managed/legaldoc)
// Counter is available from the example-counter template

export * as Counter from "./managed/counter/contract/index.js";
export * from "./witnesses";

// LegalDoc - uncomment after running: npm run compact
export * as LegalDoc from "./managed/legaldoc/contract/index.js";
