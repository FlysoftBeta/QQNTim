export const windowLoadPromise = new Promise<void>((resolve) => window.addEventListener("load", () => resolve()));
