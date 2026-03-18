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
            caption: "",
            credit: "",
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
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {block.images.map((img) => (
            <div
              key={img.id}
              className="relative rounded-lg overflow-hidden border border-zinc-800 bg-[#232323]"
            >
              <img
                src={getPreviewUrl(img)}
                alt={img.name}
                className="w-full h-32 object-cover"
              />
              <div className="p-2 space-y-2">
                <input
                  type="text"
                  value={img.caption || ""}
                  onChange={(e) =>
                    updateBlock(block.id, {
                      images: block.images.map((i) =>
                        i.id === img.id ? { ...i, caption: e.target.value } : i,
                      ),
                    })
                  }
                  placeholder="Caption"
                  className="w-full px-2 py-1 bg-[#1e1e1e] border border-zinc-700 rounded text-[11px] text-gray-200"
                />
                <input
                  type="text"
                  value={img.credit || ""}
                  onChange={(e) =>
                    updateBlock(block.id, {
                      images: block.images.map((i) =>
                        i.id === img.id ? { ...i, credit: e.target.value } : i,
                      ),
                    })
                  }
                  placeholder="Credit (e.g. Photo by...)"
                  className="w-full px-2 py-1 bg-[#1e1e1e] border border-zinc-700 rounded text-[11px] text-gray-200"
                />
                <button
                  onClick={() => {
                    revokePreview(img);
                    updateBlock(block.id, {
                      images: block.images.filter((i) => i.id !== img.id),
                    });
                  }}
                  className="w-full px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
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
