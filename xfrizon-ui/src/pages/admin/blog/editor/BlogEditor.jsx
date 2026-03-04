import React, { useState } from "react";
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

export default function BlogEditor({
  blog,
  onSave,
  onCancel,
  editingId,
  isSaving = false,
}) {
  const [formData, setFormData] = useState({
    title: blog?.title || "",
    author: blog?.author || "",
    category: blog?.category || "General",
    location: blog?.location || "",
    genre: blog?.genre || "",
    excerpt: blog?.excerpt || "",
    coverImage: blog?.coverImage || null,
    blocks: initializeBlocks(blog),
    tags: blog?.tags || [],
    titleStyle: blog?.titleStyle || {},
  });

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
    <div className="bg-[#1e1e1e] min-h-screen p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white">
          {editingId ? "Edit Blog Post" : "Create New Blog Post"}
        </h1>
        <p className="text-gray-400 mt-2">
          Build your story with text and media blocks
        </p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left - Editor */}
        <div className="col-span-2 space-y-6">
          <BlogEditorForm
            formData={formData}
            handleInputChange={handleInputChange}
            handleTitleStyleChange={handleTitleStyleChange}
            handleCoverImageChange={handleCoverImageChange}
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
        <div className="space-y-6">
          <BlogEditorPreview
            formData={formData}
            isPreview={isPreview}
            setIsPreview={setIsPreview}
          />

          {/* Action Buttons */}
          <div className="space-y-3 bg-[#2a2a2a] p-6 rounded-lg">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full px-6 py-3 bg-linear-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving
                ? "Saving..."
                : `✓ Save ${editingId ? "Changes" : "Draft"}`}
            </button>
            <button
              onClick={onCancel}
              disabled={isSaving}
              className="w-full px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
