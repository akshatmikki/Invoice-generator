/**
 * Given a value's position between min and max, returns a hex color
 * interpolated between a light and a dark shade of the app's accent
 * color. Higher calculated values render darker/more saturated —
 * this is what makes chart colors respond to the calculation itself,
 * not just cycle through a fixed palette.
 */
const LIGHT = { r: 0xe7, g: 0xec, b: 0xfd }; // --accent-100
const DARK = { r: 0x1f, g: 0x2e, b: 0x8f }; // deep accent

export function valueToColor(value, min, max) {
  if (max === min) return hexOf(DARK);
  const t = clamp((value - min) / (max - min), 0, 1);
  const r = Math.round(LIGHT.r + (DARK.r - LIGHT.r) * t);
  const g = Math.round(LIGHT.g + (DARK.g - LIGHT.g) * t);
  const b = Math.round(LIGHT.b + (DARK.b - LIGHT.b) * t);
  return hexOf({ r, g, b });
}

function hexOf({ r, g, b }) {
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

function clamp(n, lo, hi) {
  return Math.min(hi, Math.max(lo, n));
}

/** Fixed accent colors used for pie/donut slices (order-cycled, not value-based, for readability). */
export const SLICE_COLORS = ['#3454d1', '#4d6bea', '#e8a33d', '#2e7d5b', '#c8492f', '#6b7280', '#8a5cf6', '#0e9494'];
