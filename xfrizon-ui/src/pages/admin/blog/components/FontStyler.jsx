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
    <div className="bg-[#2a2a2a] border border-[#444] rounded-lg p-4 space-y-4">
      <h4 className="text-sm font-bold text-gray-300 flex items-center gap-2">
        <FaFont size={14} />
        Text Styling
      </h4>

      {/* Font Family */}
      <div>
        <label className="text-xs font-semibold text-gray-400 mb-2 block">
          Font Family
        </label>
        <select
          value={style.fontFamily || "Arial"}
          onChange={(e) => handleFontChange(e.target.value)}
          className="w-full px-3 py-2 bg-[#1e1e1e] border border-[#555] rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="Arial">System Default</option>
          {FONTS.map((font) => (
            <option key={font} value={font}>
              {font}
            </option>
          ))}
        </select>
      </div>

      {/* Font Size */}
      <div>
        <label className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-2">
          <FaTextHeight size={12} />
          Font Size: {style.fontSize || 18}px
        </label>
        <input
          type="range"
          min="12"
          max="48"
          value={style.fontSize || 18}
          onChange={(e) => handleSizeChange(e.target.value)}
          className="w-full h-2 bg-[#1e1e1e] rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex gap-2 mt-2">
          {[14, 16, 18, 20, 24, 28].map((size) => (
            <button
              key={size}
              onClick={() => handleSizeChange(size)}
              className={`px-2 py-1 text-xs rounded border ${
                style.fontSize === size
                  ? "border-purple-500 bg-purple-500 bg-opacity-20 text-purple-300"
                  : "border-gray-600 bg-[#1e1e1e] text-gray-400 hover:border-gray-500"
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Text Color */}
      <div>
        <label className="text-xs font-semibold text-gray-400 mb-3 flex items-center gap-2">
          <FaPalette size={12} />
          Text Color & Opacity
        </label>
        <div className="space-y-3">
          {/* Color Picker Section */}
          <div className="flex gap-4 items-start">
            {/* Color Wheel */}
            <div className="flex flex-col items-center gap-2">
              <input
                type="color"
                value={style.color || "#d1d5db"}
                onChange={(e) => handleColorChange(e.target.value)}
                className="w-24 h-24 rounded-full cursor-pointer border-4 border-[#555] hover:border-purple-500 transition-all shadow-lg"
                title="Click to select color"
              />
              <p className="text-xs text-gray-400">Color Picker</p>
            </div>

            {/* Color Info */}
            <div className="flex-1 space-y-3">
              {/* Color Value Display */}
              <div className="bg-[#1e1e1e] p-3 rounded border border-[#444]">
                <p className="text-xs text-gray-400 mb-2">Color Value</p>
                <p className="text-sm font-mono text-gray-200 break-all">
                  {style.color || "#d1d5db"}
                </p>
                <div
                  className="w-full h-10 mt-2 rounded border border-[#555]"
                  style={{
                    backgroundColor: hexToRgba(
                      style.color || "#d1d5db",
                      opacity / 100,
                    ),
                  }}
                ></div>
              </div>

              {/* Opacity Slider */}
              <div className="bg-[#1e1e1e] p-3 rounded border border-[#444]">
                <label className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-2">
                  <FaEye size={11} />
                  Opacity: {Math.round(opacity)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={opacity}
                  onChange={(e) => handleOpacityChange(e.target.value)}
                  className="w-full h-2 bg-[#1e1e1e] rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex gap-2 mt-2">
                  {[20, 40, 60, 80, 100].map((opacityVal) => (
                    <button
                      key={opacityVal}
                      onClick={() => handleOpacityChange(opacityVal)}
                      className={`flex-1 px-2 py-1 text-xs rounded border transition-all ${
                        opacity === opacityVal
                          ? "border-purple-500 bg-purple-500 bg-opacity-20 text-purple-300"
                          : "border-gray-600 bg-[#1e1e1e] text-gray-400 hover:border-gray-500"
                      }`}
                    >
                      {opacityVal}%
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="border-t border-[#444] pt-3">
        <p className="text-xs font-semibold text-gray-400 mb-2">Preview:</p>
        <div
          className="bg-[#1e1e1e] p-3 rounded border border-[#444] text-center"
          style={{
            fontFamily: style.fontFamily || "Arial",
            fontSize: `${style.fontSize || 18}px`,
            color: style.color || "#d1d5db",
          }}
        >
          The quick brown fox
        </div>
      </div>
    </div>
  );
}
