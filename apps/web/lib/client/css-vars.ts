/**
 * A ref that sets CSS custom properties on an element, for values that come from data (a bar's fill, a grid position).
 * The look stays in the CSS file; only the numbers come from here.
 */
export const cssVars = (values: Record<string, number>) => (el: HTMLElement | null) => {
  if (el) for (const [k, v] of Object.entries(values)) el.style.setProperty(`--${k}`, String(v));
};
