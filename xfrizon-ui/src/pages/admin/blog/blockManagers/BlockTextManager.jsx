import React from "react";
import { toast } from "react-toastify";
import FontStyler from "../components/FontStyler";

export default function BlockTextManager({ block, updateBlock, applyFormat }) {
  const handleStyleChange = (blockId, newStyle) => {
    updateBlock(blockId, { style: newStyle });
  };

  return (
    <div className="space-y-4">
      {/* Formatting Toolbar */}
      <div className="flex gap-2 p-3 bg-[#333] rounded-lg flex-wrap">
        <button
          onClick={() => applyFormat(block.id, "bold")}
          className="px-3 py-2 bg-[#444] border border-[#555] rounded hover:bg-[#555] font-bold text-sm text-gray-200 transition"
          title="Bold (select text first)"
        >
          B
        </button>
        <button
          onClick={() => applyFormat(block.id, "italic")}
          className="px-3 py-2 bg-[#444] border border-[#555] rounded hover:bg-[#555] italic text-sm text-gray-200 transition"
          title="Italic (select text first)"
        >
          I
        </button>
        <button
          onClick={() => applyFormat(block.id, "heading1")}
          className="px-3 py-2 bg-[#444] border border-[#555] rounded hover:bg-[#555] font-bold text-sm text-gray-200 transition"
          title="Heading 1"
        >
          H1
        </button>
        <button
          onClick={() => applyFormat(block.id, "heading2")}
          className="px-3 py-2 bg-[#444] border border-[#555] rounded hover:bg-[#555] font-bold text-sm text-gray-200 transition"
          title="Heading 2"
        >
          H2
        </button>
        <button
          onClick={() => applyFormat(block.id, "heading3")}
          className="px-3 py-2 bg-[#444] border border-[#555] rounded hover:bg-[#555] font-bold text-sm text-gray-200 transition"
          title="Heading 3"
        >
          H3
        </button>
        <button
          onClick={() => applyFormat(block.id, "bullet")}
          className="px-3 py-2 bg-[#444] border border-[#555] rounded hover:bg-[#555] text-sm text-gray-200 transition"
          title="Bullet point"
        >
          • List
        </button>
        <button
          onClick={() => applyFormat(block.id, "link")}
          className="px-3 py-2 bg-[#444] border border-[#555] rounded hover:bg-[#555] text-sm text-gray-200 transition"
          title="Insert link"
        >
          Link
        </button>
        <button
          onClick={() => applyFormat(block.id, "color")}
          className="px-3 py-2 bg-[#444] border border-[#555] rounded hover:bg-[#555] text-sm text-gray-200 transition"
          title="Apply color to selected text"
        >
          Color
        </button>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-[#262626] px-3 py-2 text-[11px] text-zinc-400">
        Select text, then apply formatting. Supported styles include inline bold, italic, links, H1-H3 headings, bullets, and color tags.
      </div>

      <textarea
        id={`textarea-${block.id}`}
        value={block.content}
        onChange={(e) => updateBlock(block.id, { content: e.target.value })}
        placeholder="Write your content here..."
        className="w-full px-4 py-3 bg-[#1e1e1e] border border-[#444] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm text-white placeholder-gray-600 resize-none"
        rows="8"
      />

      {/* Font Styling Component */}
      <FontStyler
        blockId={block.id}
        style={block.style || {}}
        onStyleChange={handleStyleChange}
      />
    </div>
  );
}
