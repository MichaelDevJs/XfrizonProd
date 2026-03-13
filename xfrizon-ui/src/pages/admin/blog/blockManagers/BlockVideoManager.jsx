import React from "react";
import { toast } from "react-toastify";

export default function BlockVideoManager({ block, updateBlock }) {
  const fileInputRef = React.useRef(null);

  const handleVideoUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      updateBlock(block.id, {
        videos: [
          ...(block.videos || []),
          {
            id: Date.now(),
            name: file.name,
            size: (file.size / 1024 / 1024).toFixed(2),
            type: file.type,
            uploadedAt: new Date().toLocaleDateString(),
          },
        ],
      });
      toast.success(`"${file.name}" added`);
    });
  };

  return (
    <div className="space-y-3">
      <button
        onClick={() => fileInputRef.current?.click()}
        className="w-full px-4 py-3 border-2 border-dashed border-green-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition text-green-600 font-medium"
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

      {block.videos?.length > 0 && (
        <div className="space-y-2">
          {block.videos.map((video) => (
            <div
              key={video.id}
              className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200"
            >
              <div className="flex-1">
                <p className="font-semibold text-sm">{video.name}</p>
                <p className="text-xs text-gray-600">
                  {video.size}MB • {video.uploadedAt}
                </p>
              </div>
              <button
                onClick={() =>
                  updateBlock(block.id, {
                    videos: block.videos.filter((v) => v.id !== video.id),
                  })
                }
                className="text-red-500 hover:text-red-700"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-gray-500">💡 Max 500MB per video</p>
    </div>
  );
}
