import React, { useRef } from "react";
import { toast } from "react-toastify";

export default function VideoManager({ formData, setFormData }) {
  const fileInputRef = useRef(null);

  const getPreviewUrl = (video) => video?.preview || video?.src;

  const revokePreview = (video) => {
    const url = getPreviewUrl(video);
    if (typeof url === "string" && url.startsWith("blob:")) {
      URL.revokeObjectURL(url);
    }
  };

  const handleVideoUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      const previewUrl = URL.createObjectURL(file);
      setFormData((prev) => ({
        ...prev,
        videos: [
          ...prev.videos,
          {
            id: Date.now() + Math.random(),
            src: previewUrl,
            preview: previewUrl,
            file,
            name: file.name,
            size: (file.size / (1024 * 1024)).toFixed(2),
            uploadedAt: new Date().toLocaleString(),
            type: file.type,
          },
        ],
      }));
      toast.success(`Video "${file.name}" uploaded`);
    });
  };

  const removeVideo = (id) => {
    const target = formData.videos.find((vid) => vid.id === id);
    revokePreview(target);
    setFormData((prev) => ({
      ...prev,
      videos: prev.videos.filter((vid) => vid.id !== id),
    }));
    toast.info("Video removed");
  };

  return (
    <div className="space-y-4">
      <button
        onClick={() => fileInputRef.current?.click()}
        className="w-full px-4 py-3 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-blue-600 font-medium"
      >
        🎬 Click to Upload Videos
      </button>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="video/*"
        onChange={handleVideoUpload}
        className="hidden"
      />

      {formData.videos.length > 0 && (
        <div className="space-y-2">
          {formData.videos.map((video) => (
            <div
              key={video.id}
              className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200"
            >
              <div className="flex-1">
                <p className="font-semibold text-sm text-blue-900">
                  {video.name}
                </p>
                <p className="text-xs text-gray-600">
                  {video.size}MB • {video.uploadedAt}
                </p>
              </div>
              <button
                onClick={() => removeVideo(video.id)}
                className="text-red-500 hover:text-red-700 ml-2"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {formData.videos.length === 0 && (
        <p className="text-center text-gray-500 py-8">No videos uploaded yet</p>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
        <p className="text-xs text-amber-800">
          💡 <strong>Tip:</strong> Supports MP4, WebM, AVI. For larger videos,
          use YouTube links instead.
        </p>
      </div>
    </div>
  );
}
