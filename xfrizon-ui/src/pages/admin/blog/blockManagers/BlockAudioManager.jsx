import React from "react";
import { toast } from "react-toastify";

export default function BlockAudioManager({ block, updateBlock }) {
  const fileInputRef = React.useRef(null);
  const [audioType, setAudioType] = React.useState("local");

  const handleAudioUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      updateBlock(block.id, {
        audioTracks: [
          ...(block.audioTracks || []),
          {
            id: Date.now(),
            type: "local",
            name: file.name,
            size: (file.size / 1024 / 1024).toFixed(2),
            uploadedAt: new Date().toLocaleDateString(),
          },
        ],
      });
      toast.success(`"${file.name}" added`);
    });
  };

  const audioTypeButtons = [
    { id: "local", label: "🎵 Local", color: "bg-blue-600" },
    { id: "soundcloud", label: "☁️ SoundCloud", color: "bg-orange-600" },
    { id: "spotify", label: "🎧 Spotify", color: "bg-green-600" },
    { id: "djmix", label: "🎚️ DJ Mix", color: "bg-purple-600" },
  ];

  return (
    <div className="space-y-3">
      {/* Audio Type Selector */}
      <div className="flex gap-2 flex-wrap">
        {audioTypeButtons.map((type) => (
          <button
            key={type.id}
            onClick={() => setAudioType(type.id)}
            className={`px-3 py-2 text-white rounded text-sm font-semibold transition ${
              audioType === type.id ? type.color : "bg-[#444] hover:bg-[#555]"
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* Local Audio Upload */}
      {audioType === "local" && (
        <>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full px-4 py-3 border-2 border-dashed border-blue-600 rounded-lg hover:border-blue-400 hover:bg-[#333] transition text-blue-400 font-medium"
          >
            🎵 Click to Upload Audio
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="audio/*"
            onChange={handleAudioUpload}
            className="hidden"
          />
          <p className="text-xs text-gray-500">💡 Max 200MB per file</p>
        </>
      )}

      {/* SoundCloud */}
      {audioType === "soundcloud" && (
        <input
          type="text"
          placeholder="SoundCloud URL or embed code..."
          onKeyPress={(e) => {
            if (e.key === "Enter" && e.target.value.trim()) {
              updateBlock(block.id, {
                audioTracks: [
                  ...(block.audioTracks || []),
                  {
                    id: Date.now(),
                    type: "soundcloud",
                    url: e.target.value,
                    uploadedAt: new Date().toLocaleDateString(),
                  },
                ],
              });
              e.target.value = "";
              toast.success("SoundCloud track added");
            }
          }}
          className="w-full px-4 py-2 bg-[#1e1e1e] border border-[#444] rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-white placeholder-gray-600"
        />
      )}

      {/* Spotify */}
      {audioType === "spotify" && (
        <input
          type="text"
          placeholder="Spotify track/playlist URL..."
          onKeyPress={(e) => {
            if (e.key === "Enter" && e.target.value.trim()) {
              updateBlock(block.id, {
                audioTracks: [
                  ...(block.audioTracks || []),
                  {
                    id: Date.now(),
                    type: "spotify",
                    url: e.target.value,
                    uploadedAt: new Date().toLocaleDateString(),
                  },
                ],
              });
              e.target.value = "";
              toast.success("Spotify track added");
            }
          }}
          className="w-full px-4 py-2 bg-[#1e1e1e] border border-[#444] rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white placeholder-gray-600"
        />
      )}

      {/* DJ Mix Form */}
      {audioType === "djmix" && (
        <DJMixForm block={block} updateBlock={updateBlock} />
      )}

      {/* Audio Tracks List */}
      {block.audioTracks?.length > 0 && (
        <div className="space-y-2 border-t border-[#444] pt-3">
          {block.audioTracks.map((track) => (
            <div
              key={track.id}
              className="flex items-center justify-between p-3 bg-[#333] rounded-lg border border-indigo-700"
            >
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate text-white">
                  {track.type === "local"
                    ? track.name
                    : track.type === "djmix"
                      ? `${track.name} - ${track.artist}`
                      : track.url}
                </p>
                <p className="text-xs text-gray-400">
                  {track.type === "local" && `${track.size}MB`}
                  {track.type === "djmix" &&
                    `${track.duration}min - ${track.genre}`}
                  {(track.type === "soundcloud" || track.type === "spotify") &&
                    track.uploadedAt}
                </p>
              </div>
              <button
                onClick={() =>
                  updateBlock(block.id, {
                    audioTracks: block.audioTracks.filter(
                      (t) => t.id !== track.id,
                    ),
                  })
                }
                className="text-red-500 hover:text-red-400 ml-2"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DJMixForm({ block, updateBlock }) {
  return (
    <div className="space-y-2">
      <input
        type="text"
        placeholder="DJ mix name..."
        id={`djMixName-${block.id}`}
        className="w-full px-4 py-2 bg-[#1e1e1e] border border-[#444] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-600"
      />
      <input
        type="text"
        placeholder="Artist name..."
        id={`djMixArtist-${block.id}`}
        className="w-full px-4 py-2 bg-[#1e1e1e] border border-[#444] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-600"
      />
      <input
        type="number"
        placeholder="Duration (minutes)..."
        id={`djMixDuration-${block.id}`}
        className="w-full px-4 py-2 bg-[#1e1e1e] border border-[#444] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-600"
      />
      <input
        type="text"
        placeholder="Genre..."
        id={`djMixGenre-${block.id}`}
        className="w-full px-4 py-2 bg-[#1e1e1e] border border-[#444] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-600"
      />
      <button
        onClick={() => {
          const name = document.getElementById(`djMixName-${block.id}`).value;
          const artist = document.getElementById(
            `djMixArtist-${block.id}`,
          ).value;
          const duration = document.getElementById(
            `djMixDuration-${block.id}`,
          ).value;
          const genre = document.getElementById(`djMixGenre-${block.id}`).value;
          if (name && artist && duration && genre) {
            updateBlock(block.id, {
              audioTracks: [
                ...(block.audioTracks || []),
                {
                  id: Date.now(),
                  type: "djmix",
                  name,
                  artist,
                  duration,
                  genre,
                  uploadedAt: new Date().toLocaleDateString(),
                },
              ],
            });
            document.getElementById(`djMixName-${block.id}`).value = "";
            document.getElementById(`djMixArtist-${block.id}`).value = "";
            document.getElementById(`djMixDuration-${block.id}`).value = "";
            document.getElementById(`djMixGenre-${block.id}`).value = "";
            toast.success("DJ mix added");
          }
        }}
        className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-semibold transition"
      >
        + Add DJ Mix
      </button>
    </div>
  );
}
