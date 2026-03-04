import React from "react";
import { renderBlockPreview } from "../utils/blockHelpers";

export default function BlogEditorPreview({
  formData,
  isPreview,
  setIsPreview,
}) {
  const metaParts = [
    formData.author || "Author",
    formData.location || "Location",
    formData.genre || "Genre",
  ];

  return (
    <div className="space-y-6">
      {/* Preview Toggle */}
      <div className="bg-[#2a2a2a] rounded-xl shadow-md p-4 border border-[#444]">
        <button
          onClick={() => setIsPreview(!isPreview)}
          className={`w-full px-4 py-3 rounded-lg font-semibold transition ${
            isPreview
              ? "bg-purple-600 text-white"
              : "bg-[#333] text-gray-300 hover:bg-[#3a3a3a]"
          }`}
        >
          {isPreview ? "👁️ Preview ON" : "👁️ Show Preview"}
        </button>
      </div>

      {/* Preview Panel */}
      {isPreview && (
        <div className="bg-black rounded-xl shadow-md sticky top-8 max-h-200 overflow-y-auto border border-[#444]">
          <h3 className="text-sm font-bold text-gray-400 uppercase mb-4 p-6 pb-0">
            Live Preview
          </h3>

          {/* Cover Image Preview */}
          {formData.coverImage && (
            <div className="relative w-full h-72 overflow-hidden bg-black">
              <img
                src={
                  typeof formData.coverImage === "string"
                    ? formData.coverImage
                    : URL.createObjectURL(formData.coverImage)
                }
                alt="Cover"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20"></div>
              <div className="absolute inset-0 flex items-end">
                <div className="w-full p-6">
                  <span className="text-xs uppercase tracking-widest text-gray-200">
                    {formData.category || "General"}
                  </span>
                  <h1
                    className="mt-2 text-3xl font-bold text-white"
                    style={{
                      fontFamily: formData.titleStyle?.fontFamily || "inherit",
                      fontSize: formData.titleStyle?.fontSize
                        ? `${formData.titleStyle.fontSize}px`
                        : undefined,
                      color: formData.titleStyle?.color || "#ffffff",
                      opacity:
                        formData.titleStyle?.opacity !== undefined
                          ? formData.titleStyle.opacity
                          : 1,
                    }}
                  >
                    {formData.title || "Article Title"}
                  </h1>
                  <div className="mt-3 text-xs uppercase tracking-wider text-gray-200">
                    {metaParts.join(" | ")}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Content Preview */}
          <div className="p-6 space-y-4">
            {!formData.coverImage && (
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {formData.title || "Title"}
                </h2>
              </div>
            )}
            <p className="text-sm text-gray-400">
              By {formData.author || "Author"} • {formData.category}
            </p>
            {formData.excerpt && (
              <p className="text-sm text-gray-500 italic">{formData.excerpt}</p>
            )}
            <div className="border-t border-[#444] pt-4">
              {formData.blocks.map((block) => (
                <div key={block.id} className="mb-4">
                  {renderBlockPreview(block)}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
