import React, { useRef } from "react";
import { toast } from "react-toastify";

export default function MediaGallery({ formData, setFormData }) {
  const fileInputRef = useRef(null);

  const getPreviewUrl = (image) => image?.preview || image?.src;

  const revokePreview = (image) => {
    const url = getPreviewUrl(image);
    if (typeof url === "string" && url.startsWith("blob:")) {
      URL.revokeObjectURL(url);
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      const previewUrl = URL.createObjectURL(file);
      setFormData((prev) => ({
        ...prev,
        images: [
          ...prev.images,
          {
            id: Date.now() + Math.random(),
            src: previewUrl,
            preview: previewUrl,
            file,
            name: file.name,
            uploadedAt: new Date().toLocaleString(),
          },
        ],
      }));
      toast.success(`Image "${file.name}" added`);
    });
  };

  const removeImage = (id) => {
    const target = formData.images.find((img) => img.id === id);
    revokePreview(target);
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((img) => img.id !== id),
    }));
    toast.info("Image removed");
  };

  return (
    <div className="space-y-4">
      <button
        onClick={() => fileInputRef.current?.click()}
        className="w-full px-4 py-3 border-2 border-dashed border-purple-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition text-purple-600 font-medium"
      >
        📸 Click to Upload Photos
      </button>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      {formData.images.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {formData.images.map((img) => (
            <div
              key={img.id}
              className="relative rounded-lg overflow-hidden group"
            >
              <img
                src={img.src}
                alt={img.name}
                className="w-full h-32 object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                <button
                  onClick={() => removeImage(img.id)}
                  className="px-3 py-1 bg-red-500 text-white rounded text-sm"
                >
                  Remove
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-1 truncate">{img.name}</p>
              <p className="text-xs text-gray-500">{img.uploadedAt}</p>
            </div>
          ))}
        </div>
      )}

      {formData.images.length === 0 && (
        <p className="text-center text-gray-500 py-8">No photos uploaded yet</p>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-xs text-blue-800">
          💡 <strong>Tip:</strong> Upload high-quality images for better visual
          appeal. Supports JPG, PNG, WebP.
        </p>
      </div>
    </div>
  );
}
