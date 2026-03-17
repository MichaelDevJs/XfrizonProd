import React from "react";
import { CATEGORIES } from "../utils/blockHelpers";
import FontStyler from "../components/FontStyler";

export default function BlogEditorForm({
  formData,
  handleInputChange,
  handleTitleStyleChange,
  handleCoverImageChange,
}) {
  return (
    <div className="space-y-4">
      {/* Title Section */}
      <div className="bg-[#2a2a2a] rounded-lg p-3 border border-zinc-800">
        <label className="block text-xs font-semibold text-gray-300 mb-1.5">
          Blog Title *
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          placeholder="Enter an engaging title..."
          style={{
            fontFamily: formData.titleStyle?.fontFamily || "inherit",
            fontSize: formData.titleStyle?.fontSize
              ? `${formData.titleStyle.fontSize}px`
              : "1.125rem",
            color: formData.titleStyle?.color || "#ffffff",
          }}
          className="w-full px-3 py-2 bg-[#1e1e1e] border border-zinc-800 rounded-lg focus:outline-none focus:border-zinc-600 text-sm text-white placeholder-gray-600"
        />
      </div>

      {/* Title Styling */}
      {handleTitleStyleChange && (
        <FontStyler
          blockId="title"
          style={formData.titleStyle || {}}
          onStyleChange={handleTitleStyleChange}
        />
      )}

      {/* Cover Image */}
      <div className="bg-[#2a2a2a] rounded-lg p-3 border border-zinc-800">
        <label className="block text-xs font-semibold text-gray-300 mb-2">
          Cover Image (Optional)
        </label>
        {formData.coverImage && (
          <div className="mb-4 relative rounded-lg overflow-hidden">
            <img
              src={
                typeof formData.coverImage === "string"
                  ? formData.coverImage
                  : URL.createObjectURL(formData.coverImage)
              }
              alt="Cover"
              className="w-full h-36 sm:h-44 object-cover"
            />
            <button
              onClick={() => handleCoverImageChange(null)}
              className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs"
            >
              Remove
            </button>
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              handleCoverImageChange(e.target.files[0]);
            }
          }}
          className="w-full px-3 py-2 bg-[#1e1e1e] border border-zinc-800 rounded-lg text-xs text-gray-300 file:mr-3 file:py-1.5 file:px-3 file:rounded file:bg-[#403838] file:text-white file:cursor-pointer hover:file:bg-[#4f4545]"
        />
        <p className="text-[10px] text-gray-500 mt-2">
          Recommended size: 1920x1080px or larger
        </p>
      </div>

      {/* Post Details (Compact Scroll Block) */}
      <div className="bg-[#2a2a2a] rounded-lg p-3 border border-zinc-800">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-gray-300 uppercase tracking-wide">
            Post Details
          </label>
          <span className="text-[10px] text-zinc-500">Scrollable</span>
        </div>

        <div className="max-h-72 overflow-y-auto hide-scrollbar pr-1 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Author Name *
              </label>
              <input
                type="text"
                name="author"
                value={formData.author}
                onChange={handleInputChange}
                placeholder="Your name"
                className="w-full px-3 py-2 bg-[#1e1e1e] border border-zinc-800 rounded-lg focus:outline-none focus:border-zinc-600 text-xs text-white placeholder-gray-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-[#1e1e1e] border border-zinc-800 rounded-lg focus:outline-none focus:border-zinc-600 text-xs text-white"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location || ""}
                onChange={handleInputChange}
                placeholder="City, Country..."
                className="w-full px-3 py-2 bg-[#1e1e1e] border border-zinc-800 rounded-lg focus:outline-none focus:border-zinc-600 text-xs text-white placeholder-gray-600"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Tags (comma separated)
              </label>
              <input
                type="text"
                placeholder="tag1, tag2, tag3..."
                value={
                  Array.isArray(formData.tags) ? formData.tags.join(", ") : ""
                }
                onChange={(e) => {
                  const tags = e.target.value
                    .split(",")
                    .map((t) => t.trim())
                    .filter((t) => t);
                  handleInputChange({ target: { name: "tags", value: tags } });
                }}
                className="w-full px-3 py-2 bg-[#1e1e1e] border border-zinc-800 rounded-lg focus:outline-none focus:border-zinc-600 text-xs text-white placeholder-gray-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Excerpt (Summary)
            </label>
            <textarea
              name="excerpt"
              value={formData.excerpt}
              onChange={handleInputChange}
              placeholder="Brief summary of your blog..."
              className="w-full px-3 py-2 bg-[#1e1e1e] border border-zinc-800 rounded-lg focus:outline-none focus:border-zinc-600 text-xs text-white placeholder-gray-600 resize-none"
              rows="3"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
