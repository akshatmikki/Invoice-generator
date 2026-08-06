import { styleToCss } from '../../utils/textStyle';

export function TextBlockElement({ data }) {
  return (
    <div className="el el--text el-text__display" style={{ textAlign: data.align, ...styleToCss(data.styles?.text) }}>
      {data.text || <span className="empty-hint">Empty text block — select it and type in the panel on the right.</span>}
    </div>
  );
}

export function DividerElement() {
  return <hr className="el el--divider" />;
}
