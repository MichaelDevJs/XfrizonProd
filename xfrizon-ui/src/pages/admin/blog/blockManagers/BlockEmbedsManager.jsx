import React from "react";
import { toast } from "react-toastify";

export default function BlockEmbedsManager({ block, updateBlock }) {
  const embedTypes = [
    {
      type: "soundcloud",
      label: "🎵 SoundCloud",
      placeholder: "https://soundcloud.com/...",
    },
    {
      type: "instagram",
      label: "📸 Instagram",
      placeholder: "https://instagram.com/p/...",
    },
    {
      type: "spotify",
      label: "🎧 Spotify",
      placeholder: "https://open.spotify.com/...",
    },
    {
      type: "tiktok",
      label: "🎬 TikTok",
      placeholder: "https://www.tiktok.com/...",
    },
    {
      type: "twitter",
      label: "𝕏 Twitter/X",
      placeholder: "https://twitter.com/...",
    },
    {
      type: "generic",
      label: "🔗 Generic Embed",
      placeholder: "https://any-url.com",
    },
  ];

  const addEmbed = () => {
    const embedType = prompt(
      `Select embed type:\n${embedTypes.map((e, i) => `${i + 1}. ${e.label}`).join("\n")}\n\nEnter number:`,
    );

    if (
      !embedType ||
      isNaN(embedType) ||
      embedType < 1 ||
      embedType > embedTypes.length
    ) {
      return;
    }

    const selectedType = embedTypes[parseInt(embedType) - 1];
    const url = prompt(
      `Enter ${selectedType.label} URL:\n\n${selectedType.placeholder}`,
    );
    const title = prompt("Enter title (optional):");

    if (url && url.trim()) {
      updateBlock(block.id, {
        embeds: [
          ...(block.embeds || []),
          {
            id: Date.now(),
            type: selectedType.type,
            url: url.trim(),
            title: title?.trim() || "",
          },
        ],
      });
      toast.success(`${selectedType.label} embed added`);
    }
  };

  const getEmbedLabel = (type) => {
    return embedTypes.find((e) => e.type === type)?.label || "Embed";
  };

  return (
    <div className="space-y-3">
      {block.embeds?.length > 0 && (
        <div className="space-y-2 border-t border-[#444] pt-3">
          {block.embeds.map((embed) => (
            <div
              key={embed.id}
              className="flex items-center justify-between p-3 bg-[#333] rounded-lg border border-amber-700"
            >
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate text-white">
                  {embed.title || getEmbedLabel(embed.type)}
                </p>
                <p className="text-xs text-gray-400 truncate">{embed.url}</p>
              </div>
              <button
                onClick={() =>
                  updateBlock(block.id, {
                    embeds: block.embeds.filter((e) => e.id !== embed.id),
                  })
                }
                className="text-red-500 hover:text-red-700 ml-2 flex-shrink-0"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
      <button
        onClick={addEmbed}
        className="w-full px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 text-sm font-semibold transition"
      >
        + Add Embed (SoundCloud, Instagram, Spotify, etc.)
      </button>
    </div>
  );
}
