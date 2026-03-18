import React from "react";
import { renderBlockPreview } from "../utils/blockHelpers";

export default function BlogEditorPreview({
  formData,
  isPreview,
  setIsPreview,
}) {
  const authorImageSrc = formData.authorProfileImage
    ? typeof formData.authorProfileImage === "string"
      ? formData.authorProfileImage
      : URL.createObjectURL(formData.authorProfileImage)
    : null;

  const metaParts = [
    formData.author || "Author",
    formData.location || "Location",
    formData.genre || "Genre",
  ];

  return (
    <div className="space-y-3">
      {/* Preview Toggle */}
      <div className="bg-[#2a2a2a] rounded-lg p-3 border border-zinc-800">
        <button
          onClick={() => setIsPreview(!isPreview)}
          className={`w-full px-3 py-2 rounded-lg text-xs font-semibold transition ${
            isPreview
              ? "bg-[#403838] text-white"
              : "bg-[#333] text-gray-300 hover:bg-[#3a3a3a]"
          }`}
        >
          {isPreview ? "👁️ Preview ON" : "👁️ Show Preview"}
        </button>
      </div>

      {/* Preview Panel */}
      {isPreview && (
        <div className="bg-black rounded-lg sticky top-4 max-h-[70vh] overflow-y-auto border border-zinc-800">
          <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2 p-3 pb-0">
            Live Preview
          </h3>

          {/* Cover Image Preview */}
          {formData.coverImage && (
            <div className="relative w-full h-48 sm:h-56 overflow-hidden bg-black">
              <img
                src={
                  typeof formData.coverImage === "string"
                    ? formData.coverImage
                    : URL.createObjectURL(formData.coverImage)
                }
                alt="Cover"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/40 to-black/20"></div>
              <div className="absolute inset-0 flex items-end">
                <div className="w-full p-3">
                  <span className="text-[10px] uppercase tracking-widest text-gray-200">
                    {formData.category || "General"}
                  </span>
                  <h1
                    className="mt-1 text-lg sm:text-xl font-semibold text-white"
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
                  <div className="mt-2 text-[10px] uppercase tracking-wider text-gray-200">
                    {metaParts.join(" | ")}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Content Preview */}
          <div className="p-3 space-y-3">
            {!formData.coverImage && (
              <div>
                <h2 className="text-lg font-semibold text-white">
                  {formData.title || "Title"}
                </h2>
              </div>
            )}
            <div className="text-xs text-gray-400 flex items-center gap-2">
              {authorImageSrc && (
                <img
                  src={authorImageSrc}
                  alt={formData.author || "Author"}
                  className="w-5 h-5 rounded-full object-cover border border-zinc-700"
                />
              )}
              <p>
                By {formData.author || "Author"} • {formData.category}
              </p>
            </div>
            {formData.excerpt && (
              <p className="text-xs text-gray-500 italic">{formData.excerpt}</p>
            )}
            <div className="border-t border-zinc-800 pt-3">
              {formData.blocks.map((block) => (
                <div key={block.id} className="mb-3">
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
