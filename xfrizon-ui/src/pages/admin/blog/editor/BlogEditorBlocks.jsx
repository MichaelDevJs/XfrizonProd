import React from "react";
import { BLOCK_COLORS } from "../utils/blockHelpers";
import BlockTextManager from "../blockManagers/BlockTextManager";
import BlockImageManager from "../blockManagers/BlockImageManager";
import BlockVideoManager from "../blockManagers/BlockVideoManager";
import BlockYouTubeManager from "../blockManagers/BlockYouTubeManager";
import BlockAudioManager from "../blockManagers/BlockAudioManager";
import BlockEmbedsManager from "../blockManagers/BlockEmbedsManager";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";

export default function BlogEditorBlocks({
  formData,
  expandedBlockId,
  setExpandedBlockId,
  addBlock,
  removeBlock,
  updateBlock,
  moveBlock,
  applyFormat,
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      distance: 8,
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = formData.blocks.findIndex((b) => b.id === active.id);
      const newIndex = formData.blocks.findIndex((b) => b.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newBlocks = arrayMove([...formData.blocks], oldIndex, newIndex);
        // Update formData with new block order
        const event = new Event("updateBlocks");
        // Call a callback or update through moveBlock multiple times
        newBlocks.forEach((block, idx) => {
          if (idx !== oldIndex) {
            if (idx > oldIndex) {
              moveBlock(active.id, "down");
            } else {
              moveBlock(active.id, "up");
            }
          }
        });
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-white mb-4">Content Blocks</h3>

        {/* Add Block Button at Top */}
        <div className="bg-[#2a2a2a] rounded-lg border-2 border-dashed border-[#444] p-3 text-center">
          <button
            onClick={() => addBlock("text")}
            className="text-sm text-gray-400 hover:text-gray-200 font-semibold"
          >
            + Add First Block
          </button>
        </div>

        {/* Blocks List with Sortable Context */}
        <SortableContext
          items={formData.blocks.map((b) => b.id)}
          strategy={verticalListSortingStrategy}
        >
          {formData.blocks.map((block, idx) => (
            <SortableBlockItem
              key={block.id}
              block={block}
              idx={idx}
              totalBlocks={formData.blocks.length}
              expandedBlockId={expandedBlockId}
              setExpandedBlockId={setExpandedBlockId}
              removeBlock={removeBlock}
              updateBlock={updateBlock}
              applyFormat={applyFormat}
              addBlock={addBlock}
            />
          ))}
        </SortableContext>
      </div>
    </DndContext>
  );
}

function SortableBlockItem({
  block,
  idx,
  totalBlocks,
  expandedBlockId,
  setExpandedBlockId,
  removeBlock,
  updateBlock,
  applyFormat,
  addBlock,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div key={block.id} ref={setNodeRef} style={style}>
      {/* Block Container */}
      <div
        className={`bg-[#2a2a2a] rounded-xl shadow-md overflow-hidden border border-[#444] ${
          isDragging ? "shadow-2xl ring-2 ring-purple-500" : ""
        }`}
      >
        {/* Block Header */}
        <BlockHeader
          block={block}
          expandedBlockId={expandedBlockId}
          setExpandedBlockId={setExpandedBlockId}
          isDragging={isDragging}
          removeBlock={removeBlock}
          dragAttributes={attributes}
          dragListeners={listeners}
        />

        {/* Block Content */}
        {expandedBlockId === block.id && (
          <div className="p-6 border-t border-[#444]">
            <BlockContentManager
              block={block}
              updateBlock={updateBlock}
              applyFormat={applyFormat}
            />

            {/* Block Controls */}
            <div className="flex gap-2 mt-4 pt-4 border-t border-[#444] justify-between">
              <div className="text-xs text-gray-500">
                📌 Drag handle: use ⋮⋮ icon to reorder
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Block Buttons Between Blocks */}
      <BlockSeparator block={block} addBlock={addBlock} />
    </div>
  );
}

function BlockHeader({
  block,
  expandedBlockId,
  setExpandedBlockId,
  isDragging,
  removeBlock,
  dragAttributes,
  dragListeners,
}) {
  const blockInfo = BLOCK_COLORS[block.type] || BLOCK_COLORS.text;
  const itemCount =
    block.type === "text"
      ? block.content.length
      : block[`${block.type}s`]?.length || 0;

  return (
    <div
      className={`p-4 bg-[#333] border-b border-[#444] hover:bg-[#3a3a3a] transition flex items-center justify-between ${
        isDragging ? "bg-purple-900" : ""
      }`}
    >
      {/* Left: Drag Handle + Info (drag only from handle) */}
      <div className="flex items-center gap-3 flex-1">
        {/* Drag Handle - Only this has drag listeners */}
        <span
          className="text-lg select-none cursor-grab active:cursor-grabbing hover:text-purple-400 transition"
          {...dragAttributes}
          {...dragListeners}
        >
          ⋮⋮
        </span>
        <span className="text-lg">{blockInfo.icon}</span>

        {/* Block Info - Clickable for expand/collapse */}
        <div
          className="flex-1 cursor-pointer"
          onClick={() =>
            setExpandedBlockId(expandedBlockId === block.id ? null : block.id)
          }
        >
          <p className="text-sm font-bold text-white capitalize">
            {block.type} Block
          </p>
          <p className="text-xs text-gray-400">
            {block.type === "text"
              ? `${itemCount} characters`
              : `${itemCount} items`}
          </p>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Quick Delete Button */}
        <button
          onClick={() => removeBlock(block.id)}
          className="px-2 py-1 bg-red-900/80 text-red-300 rounded hover:bg-red-800 transition text-sm"
          title="Delete block"
        >
          🗑
        </button>

        {/* Expand/Collapse Arrow */}
        <span
          className="text-gray-500 cursor-pointer ml-2"
          onClick={() =>
            setExpandedBlockId(expandedBlockId === block.id ? null : block.id)
          }
        >
          {expandedBlockId === block.id ? "▼" : "▶"}
        </span>
      </div>
    </div>
  );
}

function BlockContentManager({ block, updateBlock, applyFormat }) {
  switch (block.type) {
    case "text":
      return (
        <BlockTextManager
          block={block}
          updateBlock={updateBlock}
          applyFormat={applyFormat}
        />
      );
    case "image":
      return <BlockImageManager block={block} updateBlock={updateBlock} />;
    case "video":
      return <BlockVideoManager block={block} updateBlock={updateBlock} />;
    case "youtube":
      return <BlockYouTubeManager block={block} updateBlock={updateBlock} />;
    case "audio":
      return <BlockAudioManager block={block} updateBlock={updateBlock} />;
    case "embeds":
      return <BlockEmbedsManager block={block} updateBlock={updateBlock} />;
    default:
      return null;
  }
}

function BlockSeparator({ block, addBlock }) {
  const blockTypes = [
    { type: "text", label: "📝 Text", color: "bg-purple-600" },
    { type: "image", label: "📸 Photos", color: "bg-blue-600" },
    { type: "video", label: "🎬 Video", color: "bg-green-600" },
    { type: "youtube", label: "▶️ YouTube", color: "bg-red-600" },
    { type: "audio", label: "🎵 Audio", color: "bg-indigo-600" },
    { type: "embeds", label: "🔗 Embeds", color: "bg-amber-600" },
  ];

  return (
    <div className="py-2">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#444]"></div>
        </div>
        <div className="relative flex justify-center">
          <div className="bg-[#1e1e1e] px-2 flex gap-2 flex-wrap">
            {blockTypes.map((item) => (
              <button
                key={item.type}
                onClick={() => addBlock(item.type, block.id)}
                className={`px-2 py-1 text-xs text-white rounded hover:opacity-90 transition ${item.color}`}
                title={`Add ${item.type} block`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
