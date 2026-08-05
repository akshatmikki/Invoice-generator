export function TextBlockElement({ data, onChange, isEditing }) {
  if (isEditing) {
    return (
      <div className="el el--text">
        <textarea
          className="el-text__editor"
          value={data.text}
          style={{ textAlign: data.align, fontSize: data.fontSize, fontWeight: data.bold ? 700 : 400 }}
          onChange={(e) => onChange({ text: e.target.value })}
          rows={3}
        />
      </div>
    );
  }
  return (
    <div
      className="el el--text el-text__display"
      style={{ textAlign: data.align, fontSize: data.fontSize, fontWeight: data.bold ? 700 : 400 }}
    >
      {data.text}
    </div>
  );
}

export function DividerElement() {
  return <hr className="el el--divider" />;
}
