/**
 * Whole-field text formatting: { bold, italic, underline, fontSize, color, fontFamily }.
 * Applies to an entire field's text (not a mixed/partial selection within it).
 */
export const FONT_FAMILIES = [
  { value: '', label: 'Default' },
  { value: "'Inter', sans-serif", label: 'Sans' },
  { value: "'Sora', sans-serif", label: 'Display' },
  { value: "'JetBrains Mono', monospace", label: 'Mono' },
  { value: 'Georgia, serif', label: 'Serif' },
];

/** Preset font sizes (px) offered in the size dropdown next to the font family picker. */
export const FONT_SIZES = [8, 9, 10, 10.5, 11, 12, 12.5, 14, 16, 18, 20, 24, 28, 32, 36, 48, 60, 72];

/** Converts a field's style record into a React inline style object, for rendering on the canvas. */
export function styleToCss(style) {
  if (!style) return undefined;
  const css = {};
  if (style.bold) css.fontWeight = 700;
  if (style.italic) css.fontStyle = 'italic';
  if (style.underline) css.textDecoration = 'underline';
  if (style.fontSize) css.fontSize = `${style.fontSize}px`;
  if (style.color) css.color = style.color;
  if (style.fontFamily) css.fontFamily = style.fontFamily;
  return css;
}

/**
 * Builds an onStyleChange(patch) callback for one field on an entity that has a `styles` map
 * (e.g. company.styles.name), routed through the entity's own onChange(patch) updater.
 */
export function makeStyleSetter(entity, fieldKey, onChange) {
  return (patch) => {
    const current = entity?.styles?.[fieldKey] || {};
    onChange({ styles: { ...(entity?.styles || {}), [fieldKey]: { ...current, ...patch } } });
  };
}
