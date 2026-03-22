import React, { useState } from "react";
import { renderRichText } from "../utils/blockHelpers";

const FONTS = [
  "Arial",
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

export default function BlockTextManager({ block, updateBlock, applyFormat }) {
  const [selectedColor, setSelectedColor] = useState("#ef4444");

  const handleStyleChange = (styleUpdate) => {
    updateBlock(block.id, {
      style: {
        ...(block.style || {}),
        ...styleUpdate,
      },
    });
  };

  const handleColorChange = (value) => {
    setSelectedColor(value);

    const textarea = document.getElementById(`textarea-${block.id}`);
    const hasSelection =
      textarea && textarea.selectionStart !== textarea.selectionEnd;

    if (hasSelection) {
      applyFormat(block.id, "color", { color: value });
      return;
    }

    updateBlock(block.id, {
      style: {
        ...(block.style || {}),
        color: value,
      },
    });
  };

  return (
    <div className="space-y-4">
      {/* Unified Formatting + Styling Toolbar */}
      <div className="flex gap-1.5 p-2 bg-[#333] rounded-sm flex-wrap">
        <div className="flex items-center gap-1 px-1 py-0.5">
          <select
            id={`format-select-${block.id}`}
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) {
                applyFormat(block.id, e.target.value);
                e.target.value = "";
              }
            }}
            className="rounded-sm border border-[#444] bg-[#1a1a1a] px-1.5 py-0.5 text-[11px] text-gray-100 focus:outline-none"
            style={{ colorScheme: "dark" }}
            title="Apply text format"
            aria-label="Apply text format"
          >
            <option value="" disabled>
              Format
            </option>
            <option value="bold">Bold</option>
            <option value="italic">Italic</option>
            <option value="link">Link</option>
          </select>
        </div>

        <div className="flex items-center gap-1 px-1 py-0.5">
          <select
            id={`header-select-${block.id}`}
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) {
                applyFormat(block.id, e.target.value);
                e.target.value = "";
              }
            }}
            className="rounded-sm border border-[#444] bg-[#1a1a1a] px-1.5 py-0.5 text-[11px] text-gray-100 focus:outline-none"
            style={{ colorScheme: "dark" }}
            title="Apply heading level"
            aria-label="Apply heading level"
          >
            <option value="" disabled>
              Header
            </option>
            <option value="heading1">H1</option>
            <option value="heading2">H2</option>
            <option value="heading3">H3</option>
          </select>
        </div>

        <div className="flex items-center gap-1 px-1 py-0.5">
          <select
            id={`list-select-${block.id}`}
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) {
                applyFormat(block.id, e.target.value);
                e.target.value = "";
              }
            }}
            className="rounded-sm border border-[#444] bg-[#1a1a1a] px-1.5 py-0.5 text-[11px] text-gray-100 focus:outline-none"
            style={{ colorScheme: "dark" }}
            title="Apply list style"
            aria-label="Apply list style"
          >
            <option value="" disabled>
              List
            </option>
            <option value="bullet">• Bullet</option>
            <option value="numbered">1. Numbered</option>
          </select>
        </div>

        <div className="flex items-center gap-1 px-1 py-0.5">
          <input
            id={`color-picker-${block.id}`}
            type="color"
            value={selectedColor}
            onChange={(e) => handleColorChange(e.target.value)}
            className="h-6 w-7 cursor-pointer rounded-sm border border-[#444] bg-[#1a1a1a] p-0"
            title="Choose text color"
            aria-label="Choose text color"
          />
        </div>

        <div className="h-7 w-px bg-[#555] mx-1" />

        <div className="flex items-center gap-1 px-1 py-0.5">
          <select
            value={block.style?.fontFamily || "Arial"}
            onChange={(e) => handleStyleChange({ fontFamily: e.target.value })}
            className="rounded-sm border border-[#444] bg-[#1a1a1a] px-1.5 py-0.5 text-[11px] text-gray-100 focus:outline-none"
            style={{ colorScheme: "dark" }}
            title="Font family"
            aria-label="Font family"
          >
            {FONTS.map((font) => (
              <option key={font} value={font}>
                {font}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1 px-1 py-0.5">
          <select
            value={block.style?.fontSize || 18}
            onChange={(e) =>
              handleStyleChange({ fontSize: parseInt(e.target.value, 10) })
            }
            className="rounded-sm border border-[#444] bg-[#1a1a1a] px-1.5 py-0.5 text-[11px] text-gray-100 focus:outline-none"
            style={{ colorScheme: "dark" }}
            title="Font size in px"
            aria-label="Font size in px"
          >
            {FONT_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}px
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1 px-1 py-0.5">
          <input
            type="range"
            min="0"
            max="100"
            value={
              block.style?.opacity !== undefined
                ? Math.round(block.style.opacity * 100)
                : 100
            }
            onChange={(e) =>
              handleStyleChange({ opacity: parseInt(e.target.value, 10) / 100 })
            }
            className="w-20 cursor-pointer"
            title="Text opacity"
            aria-label="Text opacity"
          />
        </div>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-[#262626] px-3 py-2 text-[11px] text-zinc-400">
        Select text, then apply formatting. All styling controls are now in this
        single toolbar to keep editing workflow compact.
      </div>

      <textarea
        id={`textarea-${block.id}`}
        value={block.content}
        onChange={(e) => updateBlock(block.id, { content: e.target.value })}
        placeholder="Write your content here..."
        className="w-full px-4 py-3 bg-[#1e1e1e] border border-[#444] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm text-white placeholder-gray-600 resize-none"
        style={{
          fontFamily: block.style?.fontFamily || "inherit",
          fontSize: block.style?.fontSize
            ? `${block.style.fontSize}px`
            : undefined,
          color: block.style?.color || undefined,
          opacity:
            block.style?.opacity !== undefined
              ? block.style.opacity
              : undefined,
        }}
        rows="8"
      />

      <div className="rounded-lg border border-zinc-800 bg-[#202020] p-4">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
          Live Preview
        </div>
        <div className="min-h-20 rounded-md border border-zinc-700 bg-[#181818] p-3 text-sm text-zinc-100">
          {renderRichText(block.content || "", {
            paragraphClassName: "mb-2",
            heading1ClassName: "text-2xl font-bold mt-4 mb-2",
            heading2ClassName: "text-xl font-bold mt-3 mb-2",
            heading3ClassName: "text-lg font-semibold mt-3 mb-1",
            bulletClassName: "ml-5 list-disc",
            linkClassName: "text-sky-400 underline underline-offset-2",
            textStyle: {
              fontFamily: block.style?.fontFamily || "inherit",
              fontSize: block.style?.fontSize
                ? `${block.style.fontSize}px`
                : undefined,
              color: block.style?.color || undefined,
              opacity:
                block.style?.opacity !== undefined ? block.style.opacity : 1,
            },
          })}
        </div>
      </div>
    </div>
  );
}
