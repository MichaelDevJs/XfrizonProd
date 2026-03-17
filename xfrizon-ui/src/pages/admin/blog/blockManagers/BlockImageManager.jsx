import React from "react";
import { toast } from "react-toastify";

export default function BlockImageManager({ block, updateBlock }) {
  const fileInputRef = React.useRef(null);

  const getPreviewUrl = (image) => image?.preview || image?.src;

  const revokePreview = (image) => {
    const previewUrl = getPreviewUrl(image);
    if (typeof previewUrl === "string" && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      const previewUrl = URL.createObjectURL(file);
      updateBlock(block.id, {
        images: [
          ...(block.images || []),
          {
            id: Date.now() + Math.random(),
            src: previewUrl,
            preview: previewUrl,
            name: file.name,
            file,
          },
        ],
      });
      toast.success(`Image "${file.name}" added`);
    });
  };

  return (
    <div className="space-y-3">
      <button
        onClick={() => fileInputRef.current?.click()}
        className="w-full px-4 py-3 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-blue-600 font-medium"
      >
        📸 Click to Upload Images
      </button>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      {block.images?.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {block.images.map((img) => (
            <div
              key={img.id}
              className="relative rounded-lg overflow-hidden group"
            >
              <img
                src={getPreviewUrl(img)}
                alt={img.name}
                className="w-full h-32 object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                <button
                  onClick={() => {
                    revokePreview(img);
                    updateBlock(block.id, {
                      images: block.images.filter((i) => i.id !== img.id),
                    });
                  }}
                  className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700\"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
