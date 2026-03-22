import React, { useState } from "react";
import { FaFont, FaPalette, FaTextHeight, FaEye } from "react-icons/fa";

const FONTS = [
  "Iceland",
  "Chakra Petch",
  "Sarpanch",
  "Syne Mono",
  "Text Me One",
  "Chathura",
  "Share Tech Mono",
  "Mohave",
  "Jura",
];

const FONT_SIZES = [12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 40, 48];

export default function FontStyler({ blockId, style = {}, onStyleChange }) {
  const [opacity, setOpacity] = useState(
    style.opacity !== undefined ? style.opacity * 100 : 100,
  );

  const handleFontChange = (fontFamily) => {
    onStyleChange(blockId, { ...style, fontFamily });
  };

  const handleSizeChange = (fontSize) => {
    onStyleChange(blockId, {
      ...style,
      fontSize: parseInt(fontSize),
    });
  };

  const handleColorChange = (color) => {
    onStyleChange(blockId, {
      ...style,
      color,
      opacity: opacity / 100,
    });
  };

  const handleOpacityChange = (value) => {
    const opacityValue = parseInt(value);
    setOpacity(opacityValue);
    onStyleChange(blockId, {
      ...style,
      opacity: opacityValue / 100,
    });
  };

  // Convert hex color to RGB for opacity preview
  const hexToRgba = (hex, alpha = 1) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  return (
    <div className="bg-[#2a2a2a] border border-zinc-800 rounded-lg p-3">
      <h4 className="text-xs font-bold text-gray-300 flex items-center gap-2 mb-2">
        <FaFont size={12} />
        Text Styling
      </h4>

      <details
        open
        className="rounded border border-zinc-800 bg-[#1f1f1f] mb-2"
      >
        <summary className="cursor-pointer select-none px-3 py-2 text-xs font-semibold text-gray-300 flex items-center gap-2">
          <FaTextHeight size={10} /> Typography
        </summary>
        <div className="space-y-2 px-3 pb-3 pt-1">
          <div>
            <label className="text-[10px] font-semibold text-gray-400 mb-1 block">
              Font Family
            </label>
            <select
              value={style.fontFamily || "Arial"}
              onChange={(e) => handleFontChange(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#121212] border border-zinc-700 rounded text-xs text-white focus:outline-none focus:border-zinc-500"
            >
              <option value="Arial">System Default</option>
              {FONTS.map((font) => (
                <option key={font} value={font}>
                  {font}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-gray-400 mb-1 block">
              Size (px)
            </label>
            <select
              value={style.fontSize || 18}
              onChange={(e) => handleSizeChange(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#121212] border border-zinc-700 rounded text-xs text-white focus:outline-none focus:border-zinc-500"
            >
              {FONT_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}px
                </option>
              ))}
            </select>
          </div>
        </div>
      </details>

      <details className="rounded border border-zinc-800 bg-[#1f1f1f] mb-2">
        <summary className="cursor-pointer select-none px-3 py-2 text-xs font-semibold text-gray-300 flex items-center gap-2">
          <FaPalette size={10} /> Color & Opacity
        </summary>
        <div className="space-y-2 px-3 pb-3 pt-1">
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={style.color || "#d1d5db"}
              onChange={(e) => handleColorChange(e.target.value)}
              className="h-10 w-10 rounded cursor-pointer border border-zinc-700 bg-transparent p-0"
              title="Click to select color"
            />
            <div>
              <p className="text-[10px] text-gray-400">Selected</p>
              <p className="text-[10px] font-mono text-gray-300">
                {style.color || "#d1d5db"}
              </p>
            </div>
            <div
              className="ml-auto h-8 w-20 rounded border border-zinc-700"
              style={{
                backgroundColor: hexToRgba(
                  style.color || "#d1d5db",
                  opacity / 100,
                ),
              }}
            />
          </div>

          <div>
            <label className="text-[10px] font-semibold text-gray-400 mb-1 flex items-center gap-1.5">
              <FaEye size={9} /> Opacity: {Math.round(opacity)}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={opacity}
              onChange={(e) => handleOpacityChange(e.target.value)}
              className="w-full h-1.5 bg-[#121212] rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </details>

      <div className="rounded border border-zinc-800 bg-[#1f1f1f] px-3 py-2">
        <p className="text-[10px] font-semibold text-gray-400 mb-1">Preview</p>
        <div
          className="rounded border border-zinc-700 bg-[#121212] px-2 py-1.5 text-center"
          style={{
            fontFamily: style.fontFamily || "Arial",
            fontSize: `${style.fontSize || 18}px`,
            color: style.color || "#d1d5db",
            opacity: style.opacity !== undefined ? style.opacity : 1,
          }}
        >
          The quick brown fox
        </div>
      </div>
    </div>
  );
}
