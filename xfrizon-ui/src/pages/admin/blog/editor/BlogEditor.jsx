import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  initializeBlocks,
  addBlock as addBlockHelper,
  removeBlock as removeBlockHelper,
  updateBlock as updateBlockHelper,
  moveBlock as moveBlockHelper,
  applyFormat as applyFormatHelper,
} from "../utils/blockHelpers";
import BlogEditorForm from "./BlogEditorForm";
import BlogEditorBlocks from "./BlogEditorBlocks";
import BlogEditorPreview from "./BlogEditorPreview";

const AI_DRAFT_KEY = "xf_ai_draft_content";

export default function BlogEditor({
  blog,
  onSave,
  onCancel,
  editingId,
  isSaving = false,
}) {
  // Check if there's an AI-generated draft waiting to be loaded on a new post
  const aiDraft = !editingId ? (sessionStorage.getItem(AI_DRAFT_KEY) || "") : "";

  const [formData, setFormData] = useState(() => {
    const baseBlocks = initializeBlocks(blog);
    // If opening a new post with AI draft content, pre-fill the first text block
    const blocks =
      aiDraft && !editingId
        ? baseBlocks.map((b, i) =>
            i === 0 && b.type === "text" ? { ...b, content: aiDraft } : b
          )
        : baseBlocks;

    return {
      title: blog?.title || "",
      author: blog?.author || "",
      authorProfileImage:
        blog?.authorProfileImage ||
        blog?.authorAvatar ||
        blog?.authorImage ||
        blog?.titleStyle?.authorProfileImage ||
        null,
      category: blog?.category || "General",
      location: blog?.location || "",
      excerpt: blog?.excerpt || "",
      coverImage: blog?.coverImage || null,
      blocks,
      tags: blog?.tags || [],
      titleStyle: blog?.titleStyle || {},
    };
  });

  // Clear the AI draft from sessionStorage after it's been loaded
  useEffect(() => {
    if (aiDraft) {
      sessionStorage.removeItem(AI_DRAFT_KEY);
      toast.info("AI content loaded into editor");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [isPreview, setIsPreview] = useState(false);
  const [expandedBlockId, setExpandedBlockId] = useState(null);

  // Handlers that wrap the helper functions
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTitleStyleChange = (blockId, newStyle) => {
    setFormData((prev) => ({
      ...prev,
      titleStyle: newStyle,
    }));
  };

  const handleCoverImageChange = (image) => {
    setFormData((prev) => ({
      ...prev,
      coverImage: image,
    }));
  };

  const handleAuthorProfileImageChange = (image) => {
    setFormData((prev) => ({
      ...prev,
      authorProfileImage: image,
    }));
  };

  const handleAddBlock = (type, afterBlockId = null) => {
    addBlockHelper(formData, setFormData, type, afterBlockId);
    // Set expanded to new block ID if created
    const newBlockId = Date.now() + Math.random();
  };

  const handleRemoveBlock = (blockId) => {
    removeBlockHelper(blockId, formData, setFormData);
  };

  const handleUpdateBlock = (blockId, updates) => {
    updateBlockHelper(blockId, updates, formData, setFormData);
  };

  const handleMoveBlock = (blockId, direction) => {
    moveBlockHelper(blockId, direction, formData, setFormData);
  };

  const handleApplyFormat = (blockId, format) => {
    applyFormatHelper(blockId, format, formData, setFormData);
  };

  const handleSave = () => {
    if (
      !formData.title.trim() ||
      !formData.author.trim() ||
      !formData.blocks.some((b) => b.type === "text" && b.content.trim())
    ) {
      toast.error("Please fill in title, author, and at least some content");
      return;
    }
    onSave(formData);
  };

  return (
    <div className="bg-[#1e1e1e] min-h-screen p-3 sm:p-4">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-xl sm:text-2xl font-semibold text-white">
          {editingId ? "Edit Blog Post" : "Create New Blog Post"}
        </h1>
        <p className="text-gray-400 mt-1 text-xs">
          Build your story with text and media blocks
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Left - Editor */}
        <div className="xl:col-span-2 space-y-4">
          <BlogEditorForm
            formData={formData}
            handleInputChange={handleInputChange}
            handleTitleStyleChange={handleTitleStyleChange}
            handleCoverImageChange={handleCoverImageChange}
            handleAuthorProfileImageChange={handleAuthorProfileImageChange}
          />
          <BlogEditorBlocks
            formData={formData}
            expandedBlockId={expandedBlockId}
            setExpandedBlockId={setExpandedBlockId}
            addBlock={handleAddBlock}
            removeBlock={handleRemoveBlock}
            updateBlock={handleUpdateBlock}
            moveBlock={handleMoveBlock}
            applyFormat={handleApplyFormat}
          />
        </div>

        {/* Right - Preview & Actions */}
        <div className="space-y-4 xl:sticky xl:top-4 self-start">
          <BlogEditorPreview
            formData={formData}
            isPreview={isPreview}
            setIsPreview={setIsPreview}
          />

          {/* Action Buttons */}
          <div className="space-y-2 bg-[#2a2a2a] p-3 rounded-lg">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full px-4 py-2 bg-[#403838] text-white rounded-lg hover:bg-[#4f4545] text-xs font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving
                ? "Saving..."
                : `✓ Save ${editingId ? "Changes" : "Draft"}`}
            </button>
            <button
              onClick={onCancel}
              disabled={isSaving}
              className="w-full px-4 py-2 bg-zinc-800 text-zinc-200 rounded-lg hover:bg-zinc-700 text-xs font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
