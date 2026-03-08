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
    <div className="bg-[#2a2a2a] border border-zinc-800 rounded-lg p-3">
      <h4 className="text-xs font-bold text-gray-300 flex items-center gap-2 mb-3">
        <FaFont size={12} />
        Text Styling
      </h4>

      {/* Scrollable Content Container */}
      <div className="max-h-72 overflow-y-auto hide-scrollbar space-y-3">
        {/* Font Family */}
        <div>
          <label className="text-[10px] font-semibold text-gray-400 mb-1.5 block">
            Font Family
          </label>
          <select
            value={style.fontFamily || "Arial"}
            onChange={(e) => handleFontChange(e.target.value)}
            className="w-full px-3 py-2 bg-[#1e1e1e] border border-zinc-800 rounded text-xs text-white focus:outline-none focus:border-zinc-600"
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
          <label className="text-[10px] font-semibold text-gray-400 mb-1.5 flex items-center gap-1.5">
            <FaTextHeight size={10} />
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
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 mt-2">
            {[14, 16, 18, 20, 24, 28].map((size) => (
              <button
                key={size}
                onClick={() => handleSizeChange(size)}
                className={`px-2 py-1 text-[10px] rounded border ${
                  style.fontSize === size
                    ? "border-purple-500 bg-purple-500 bg-opacity-20 text-purple-300"
                    : "border-zinc-700 bg-[#1e1e1e] text-gray-400 hover:border-zinc-600"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Text Color & Opacity */}
        <div>
          <label className="text-[10px] font-semibold text-gray-400 mb-2 flex items-center gap-1.5">
            <FaPalette size={10} />
            Color & Opacity
          </label>
          <div className="space-y-2">
            {/* Color Picker Section - Compact Mobile Layout */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-start">
              {/* Color Wheel - Smaller on Mobile */}
              <div className="flex flex-row sm:flex-col items-center gap-2 w-full sm:w-auto">
                <input
                  type="color"
                  value={style.color || "#d1d5db"}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full cursor-pointer border-2 border-zinc-700 hover:border-purple-500 transition-all"
                  title="Click to select color"
                />
                <div className="flex-1 sm:flex-none">
                  <p className="text-[10px] text-gray-400">Color Picker</p>
                  <p className="text-[10px] font-mono text-gray-300 mt-0.5">
                    {style.color || "#d1d5db"}
                  </p>
                </div>
              </div>

              {/* Color Info - Compact */}
              <div className="flex-1 w-full space-y-2">
                {/* Color Preview */}
                <div className="bg-[#1e1e1e] p-2 rounded border border-zinc-800">
                  <p className="text-[10px] text-gray-400 mb-1.5">Preview</p>
                  <div
                    className="w-full h-8 rounded border border-zinc-700"
                    style={{
                      backgroundColor: hexToRgba(
                        style.color || "#d1d5db",
                        opacity / 100,
                      ),
                    }}
                  ></div>
                </div>

                {/* Opacity Slider - Compact */}
                <div className="bg-[#1e1e1e] p-2 rounded border border-zinc-800">
                  <label className="text-[10px] font-semibold text-gray-400 mb-1.5 flex items-center gap-1.5">
                    <FaEye size={9} />
                    Opacity: {Math.round(opacity)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={opacity}
                    onChange={(e) => handleOpacityChange(e.target.value)}
                    className="w-full h-1.5 bg-[#1e1e1e] rounded-lg appearance-none cursor-pointer mb-1.5"
                  />
                  <div className="grid grid-cols-5 gap-1">
                    {[20, 40, 60, 80, 100].map((opacityVal) => (
                      <button
                        key={opacityVal}
                        onClick={() => handleOpacityChange(opacityVal)}
                        className={`px-1.5 py-0.5 text-[10px] rounded border transition-all ${
                          opacity === opacityVal
                            ? "border-purple-500 bg-purple-500 bg-opacity-20 text-purple-300"
                            : "border-zinc-700 bg-[#1e1e1e] text-gray-400 hover:border-zinc-600"
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
        <div className="border-t border-zinc-800 pt-2">
          <p className="text-[10px] font-semibold text-gray-400 mb-1.5">
            Text Preview:
          </p>
          <div
            className="bg-[#1e1e1e] p-2 rounded border border-zinc-800 text-center"
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
    </div>
  );
}
