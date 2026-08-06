import { useRef } from 'react';
import { styleToCss } from '../../utils/textStyle';

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function UploadZone({ imageData, onUpload, placeholderText, height = 90 }) {
  const inputRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    onUpload(dataUrl);
  };

  if (imageData) {
    return (
      <div className="upload-zone upload-zone--filled" style={{ height }} onClick={() => inputRef.current?.click()}>
        <img src={imageData} alt="" />
        <input ref={inputRef} type="file" accept="image/*" hidden onChange={handleFile} />
        {/* Hidden from the exported PDF; only ever visible on hover in the editor */}
        <span className="upload-zone__replace" data-html2canvas-ignore="true">Click to replace</span>
      </div>
    );
  }

  return (
    <div className="upload-zone" style={{ height }} onClick={() => inputRef.current?.click()}>
      <span>📤 {placeholderText}</span>
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={handleFile} />
    </div>
  );
}

// The element's own box width (drag the handle on its right edge to resize) controls
// how large these render — the image simply fills its box at 100% width.
export function LogoElement({ data, onChange }) {
  return (
    <div className="el el--logo">
      <UploadZone imageData={data.imageData} onUpload={(imageData) => onChange({ imageData })} placeholderText="Upload company logo" height={70} />
    </div>
  );
}

export function ImageElement({ data, onChange }) {
  return (
    <div className="el el--image">
      <UploadZone imageData={data.imageData} onUpload={(imageData) => onChange({ imageData })} placeholderText="Upload an image" height={120} />
      {data.caption && <div className="el-caption-display" style={styleToCss(data.styles?.caption)}>{data.caption}</div>}
    </div>
  );
}

export function SignatureElement({ data, onChange }) {
  return (
    <div className="el el--signature">
      <UploadZone imageData={data.imageData} onUpload={(imageData) => onChange({ imageData })} placeholderText="Upload signature / stamp" height={80} />
      {data.label && <div className="el-caption-display el-caption-display--center" style={styleToCss(data.styles?.label)}>{data.label}</div>}
    </div>
  );
}
