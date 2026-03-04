import React from "react";
import { toast } from "react-toastify";

export default function BlockYouTubeManager({ block, updateBlock }) {
  return (
    <div className="space-y-3">
      {block.youtubeLinks?.map((video) => (
        <div
          key={video.id}
          className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200"
        >
          <div className="flex-1">
            <p className="font-semibold text-sm">{video.title}</p>
            <p className="text-xs text-gray-600 truncate">{video.url}</p>
          </div>
          <button
            onClick={() =>
              updateBlock(block.id, {
                youtubeLinks: block.youtubeLinks.filter(
                  (v) => v.id !== video.id,
                ),
              })
            }
            className="text-red-500 hover:text-red-700 ml-2"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        onClick={() => {
          const url = prompt("Enter YouTube URL:");
          const title = prompt("Enter video title:");
          if (url && title) {
            updateBlock(block.id, {
              youtubeLinks: [
                ...(block.youtubeLinks || []),
                { id: Date.now(), url, title },
              ],
            });
            toast.success("YouTube link added");
          }
        }}
        className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm font-semibold"
      >
        + Add YouTube Link
      </button>
    </div>
  );
}
