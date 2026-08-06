import { FONT_FAMILIES } from '../utils/textStyle';

/** A labeled text field with a formatting toolbar (bold/italic/underline/font/size/color) applied to its whole value. */
export function TextField({ label, value, placeholder, onChange, style, onStyleChange, multiline = false, rows = 3 }) {
  const s = style || {};
  const inputStyle = {
    fontWeight: s.bold ? 700 : undefined,
    fontStyle: s.italic ? 'italic' : undefined,
    textDecoration: s.underline ? 'underline' : undefined,
    fontSize: s.fontSize ? `${s.fontSize}px` : undefined,
    color: s.color || undefined,
    fontFamily: s.fontFamily || undefined,
  };

  return (
    <label className="pf-field">
      <span className="pf-field__label">{label}</span>
      <div className="pf-format-toolbar">
        <button
          type="button"
          className={`pf-fmt-btn ${s.bold ? 'pf-fmt-btn--active' : ''}`}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onStyleChange({ bold: !s.bold })}
          title="Bold"
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          className={`pf-fmt-btn ${s.italic ? 'pf-fmt-btn--active' : ''}`}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onStyleChange({ italic: !s.italic })}
          title="Italic"
        >
          <em>I</em>
        </button>
        <button
          type="button"
          className={`pf-fmt-btn ${s.underline ? 'pf-fmt-btn--active' : ''}`}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onStyleChange({ underline: !s.underline })}
          title="Underline"
        >
          <u>U</u>
        </button>
        <select
          className="pf-fmt-select"
          value={s.fontFamily || ''}
          onChange={(e) => onStyleChange({ fontFamily: e.target.value || undefined })}
          title="Font"
        >
          {FONT_FAMILIES.map((f) => (
            <option key={f.label} value={f.value}>{f.label}</option>
          ))}
        </select>
        <input
          type="number"
          className="pf-fmt-size"
          min="8"
          max="72"
          placeholder="Size"
          value={s.fontSize || ''}
          onChange={(e) => onStyleChange({ fontSize: e.target.value ? Number(e.target.value) : undefined })}
          title="Font size (px)"
        />
        <input
          type="color"
          className="pf-fmt-color"
          value={s.color || '#1f2733'}
          onChange={(e) => onStyleChange({ color: e.target.value })}
          title="Font color"
        />
      </div>
      {multiline ? (
        <textarea className="pf-textarea" style={inputStyle} rows={rows} value={value ?? ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input type="text" className="pf-input" style={inputStyle} value={value ?? ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      )}
    </label>
  );
}
