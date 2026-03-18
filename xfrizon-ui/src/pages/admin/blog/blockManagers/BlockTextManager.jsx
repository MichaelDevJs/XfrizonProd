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
          onClick={() => applyFormat(block.id, "heading")}
          className="px-3 py-2 bg-[#444] border border-[#555] rounded hover:bg-[#555] font-bold text-sm text-gray-200 transition"
          title="Heading"
        >
          H#
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
