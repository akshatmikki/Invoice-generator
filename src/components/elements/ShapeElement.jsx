/** Fully customizable shape building block — rectangle, circle, triangle, or line — used to draw dividers, badges, boxes, and accents anywhere on the page. */
export function ShapeElement({ data }) {
  const {
    shapeType = 'rectangle',
    fill = '#4d6bea',
    stroke = '#1f2733',
    strokeWidth = 1,
    borderRadius = 0,
    rotation = 0,
    opacity = 100,
    shadow = false,
  } = data;

  const baseStyle = {
    width: '100%',
    height: '100%',
    opacity: Math.max(0, Math.min(100, opacity)) / 100,
    transform: rotation ? `rotate(${rotation}deg)` : undefined,
    boxShadow: shadow ? 'var(--shadow-paper)' : undefined,
  };

  if (shapeType === 'line') {
    return (
      <div
        className="el el--shape el--shape-line"
        style={{ ...baseStyle, height: `${Math.max(1, strokeWidth)}px`, background: stroke }}
      />
    );
  }

  if (shapeType === 'triangle') {
    return (
      <div
        className="el el--shape el--shape-triangle"
        style={{ ...baseStyle, background: fill, clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}
      />
    );
  }

  return (
    <div
      className="el el--shape"
      style={{
        ...baseStyle,
        background: fill,
        border: `${strokeWidth}px solid ${stroke}`,
        borderRadius: shapeType === 'circle' ? '50%' : `${borderRadius}px`,
      }}
    />
  );
}
