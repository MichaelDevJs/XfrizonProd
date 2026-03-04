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
    <div className="space-y-6">
      {/* Title Section */}
      <div className="bg-[#2a2a2a] rounded-xl shadow-md p-6 border border-[#444]">
        <label className="block text-sm font-semibold text-gray-300 mb-2">
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
          className="w-full px-4 py-3 bg-[#1e1e1e] border border-[#444] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-lg text-white placeholder-gray-600"
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
      <div className="bg-[#2a2a2a] rounded-xl shadow-md p-6 border border-[#444]">
        <label className="block text-sm font-semibold text-gray-300 mb-3">
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
              className="w-full h-48 object-cover"
            />
            <button
              onClick={() => handleCoverImageChange(null)}
              className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
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
          className="w-full px-4 py-3 bg-[#1e1e1e] border border-[#444] rounded-lg text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded file:bg-purple-600 file:text-white file:cursor-pointer hover:file:bg-purple-700"
        />
        <p className="text-xs text-gray-500 mt-2">
          Recommended size: 1920x1080px or larger
        </p>
      </div>

      {/* Author & Category & Location */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#2a2a2a] rounded-xl shadow-md p-6 border border-[#444]">
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            Author Name *
          </label>
          <input
            type="text"
            name="author"
            value={formData.author}
            onChange={handleInputChange}
            placeholder="Your name"
            className="w-full px-4 py-3 bg-[#1e1e1e] border border-[#444] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-600"
          />
        </div>
        <div className="bg-[#2a2a2a] rounded-xl shadow-md p-6 border border-[#444]">
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            Category
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            className="w-full px-4 py-3 bg-[#1e1e1e] border border-[#444] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
        <div className="bg-[#2a2a2a] rounded-xl shadow-md p-6 border border-[#444]">
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            Location
          </label>
          <input
            type="text"
            name="location"
            value={formData.location || ""}
            onChange={handleInputChange}
            placeholder="City, Country..."
            className="w-full px-4 py-3 bg-[#1e1e1e] border border-[#444] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-600"
          />
        </div>
      </div>

      {/* Genre & Tags */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#2a2a2a] rounded-xl shadow-md p-6 border border-[#444]">
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            Genre
          </label>
          <select
            name="genre"
            value={formData.genre || ""}
            onChange={handleInputChange}
            className="w-full px-4 py-3 bg-[#1e1e1e] border border-[#444] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
          >
            <option value="">Select Genre</option>
            <option value="Hip-Hop">Hip-Hop</option>
            <option value="Pop">Pop</option>
            <option value="Rock">Rock</option>
            <option value="Jazz">Jazz</option>
            <option value="Electronic">Electronic</option>
            <option value="Classical">Classical</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div className="bg-[#2a2a2a] rounded-xl shadow-md p-6 border border-[#444]">
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            Tags (comma separated)
          </label>
          <input
            type="text"
            placeholder="tag1, tag2, tag3..."
            value={Array.isArray(formData.tags) ? formData.tags.join(", ") : ""}
            onChange={(e) => {
              const tags = e.target.value
                .split(",")
                .map((t) => t.trim())
                .filter((t) => t);
              handleInputChange({ target: { name: "tags", value: tags } });
            }}
            className="w-full px-4 py-3 bg-[#1e1e1e] border border-[#444] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-600"
          />
        </div>
      </div>

      {/* Excerpt */}
      <div className="bg-[#2a2a2a] rounded-xl shadow-md p-6 border border-[#444]">
        <label className="block text-sm font-semibold text-gray-300 mb-2">
          Excerpt (Summary)
        </label>
        <textarea
          name="excerpt"
          value={formData.excerpt}
          onChange={handleInputChange}
          placeholder="Brief summary of your blog..."
          className="w-full px-4 py-3 bg-[#1e1e1e] border border-[#444] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm text-white placeholder-gray-600 resize-none"
          rows="2"
        />
      </div>
    </div>
  );
}
