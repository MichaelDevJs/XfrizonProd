// Block helper functions for blog editor
import { toast } from "react-toastify";

export const initializeBlocks = (blog) => {
  if (blog?.blocks) {
    // Handle string (JSON) or array
    let blocks = blog.blocks;
    if (typeof blocks === "string") {
      try {
        blocks = JSON.parse(blocks);
      } catch (e) {
        console.error("Failed to parse blocks:", e);
        blocks = [];
      }
    }
    if (Array.isArray(blocks) && blocks.length > 0) {
      return blocks;
    }
  }
  return [{ id: Date.now(), type: "text", content: blog?.content || "" }];
};

export const addBlock = (formData, setFormData, type, afterBlockId = null) => {
  let newBlock = { id: Date.now() + Math.random() };

  switch (type) {
    case "text":
      newBlock.type = "text";
      newBlock.content = "";
      break;
    case "image":
      newBlock.type = "image";
      newBlock.images = [];
      break;
    case "video":
      newBlock.type = "video";
      newBlock.videos = [];
      break;
    case "youtube":
      newBlock.type = "youtube";
      newBlock.youtubeLinks = [];
      break;
    case "audio":
      newBlock.type = "audio";
      newBlock.audioTracks = [];
      break;
    case "embeds":
      newBlock.type = "embeds";
      newBlock.embeds = [];
      break;
    default:
      return;
  }

  setFormData((prev) => {
    const newBlocks = [...prev.blocks];
    if (afterBlockId) {
      const idx = newBlocks.findIndex((b) => b.id === afterBlockId);
      newBlocks.splice(idx + 1, 0, newBlock);
    } else {
      newBlocks.push(newBlock);
    }
    return { ...prev, blocks: newBlocks };
  });

  return newBlock;
};

export const removeBlock = (blockId, formData, setFormData) => {
  if (formData.blocks.length === 1) {
    toast.error("You must have at least one content block");
    return false;
  }
  setFormData((prev) => ({
    ...prev,
    blocks: prev.blocks.filter((b) => b.id !== blockId),
  }));
  return true;
};

export const updateBlock = (blockId, updates, formData, setFormData) => {
  setFormData((prev) => ({
    ...prev,
    blocks: prev.blocks.map((b) =>
      b.id === blockId ? { ...b, ...updates } : b,
    ),
  }));
};

export const moveBlock = (blockId, direction, formData, setFormData) => {
  const idx = formData.blocks.findIndex((b) => b.id === blockId);
  if (direction === "up" && idx > 0) {
    const newBlocks = [...formData.blocks];
    [newBlocks[idx], newBlocks[idx - 1]] = [newBlocks[idx - 1], newBlocks[idx]];
    setFormData((prev) => ({ ...prev, blocks: newBlocks }));
  } else if (direction === "down" && idx < formData.blocks.length - 1) {
    const newBlocks = [...formData.blocks];
    [newBlocks[idx], newBlocks[idx + 1]] = [newBlocks[idx + 1], newBlocks[idx]];
    setFormData((prev) => ({ ...prev, blocks: newBlocks }));
  }
};

export const applyFormat = (blockId, format, formData, setFormData) => {
  const block = formData.blocks.find((b) => b.id === blockId);
  if (block?.type !== "text") return;

  const textareaId = `textarea-${blockId}`;
  const textarea = document.getElementById(textareaId);
  if (!textarea) return;

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selectedText = block.content.substring(start, end);
  let formattedText = selectedText;

  switch (format) {
    case "bold":
      formattedText = `**${selectedText}**`;
      break;
    case "italic":
      formattedText = `_${selectedText}_`;
      break;
    case "heading":
      formattedText = `\n# ${selectedText}\n`;
      break;
    case "bullet":
      formattedText = `\n• ${selectedText}\n`;
      break;
    default:
      break;
  }

  const newContent =
    block.content.substring(0, start) +
    formattedText +
    block.content.substring(end);
  updateBlock(blockId, { content: newContent }, formData, setFormData);
};

export const renderBlockPreview = (block) => {
  if (block.type === "text") {
    return block.content.split("\n").map((line, idx) => {
      if (line.startsWith("# "))
        return (
          <h2 key={idx} className="text-2xl font-bold mt-4 mb-2">
            {line.substring(2)}
          </h2>
        );
      if (line.startsWith("• "))
        return (
          <li key={idx} className="ml-4 list-disc">
            {line.substring(2)}
          </li>
        );
      if (line.startsWith("**") && line.endsWith("**"))
        return (
          <p key={idx} className="font-bold">
            {line.substring(2, line.length - 2)}
          </p>
        );
      if (line.startsWith("_") && line.endsWith("_"))
        return (
          <p key={idx} className="italic">
            {line.substring(1, line.length - 1)}
          </p>
        );
      if (line.trim())
        return (
          <p key={idx} className="mb-2">
            {line}
          </p>
        );
      return <br key={idx} />;
    });
  } else if (block.type === "image") {
    return (
      <div className="grid grid-cols-2 gap-2">
        {block.images?.slice(0, 4).map((img) => (
          <img
            key={img.id}
            src={img.src}
            alt="preview"
            className="w-full h-24 object-cover rounded"
          />
        ))}
      </div>
    );
  } else if (block.type === "video") {
    return (
      <div className="text-xs text-gray-600">
        📹 {block.videos?.length || 0} video(s)
      </div>
    );
  } else if (block.type === "youtube") {
    return (
      <div className="text-xs text-gray-600">
        ▶️ {block.youtubeLinks?.length || 0} YouTube video(s)
      </div>
    );
  } else if (block.type === "audio") {
    return (
      <div className="text-xs text-gray-600">
        🎵 {block.audioTracks?.length || 0} audio track(s)
      </div>
    );
  } else if (block.type === "embeds") {
    return (
      <div className="text-xs text-gray-600">
        🔗 {block.embeds?.length || 0} embed(s)
      </div>
    );
  }
};

export const BLOCK_COLORS = {
  text: {
    icon: "📝",
    color: "bg-purple-600",
    hoverColor: "hover:bg-purple-700",
  },
  image: { icon: "📸", color: "bg-blue-600", hoverColor: "hover:bg-blue-700" },
  video: {
    icon: "🎬",
    color: "bg-green-600",
    hoverColor: "hover:bg-green-700",
  },
  youtube: { icon: "▶️", color: "bg-red-600", hoverColor: "hover:bg-red-700" },
  audio: {
    icon: "🎵",
    color: "bg-indigo-600",
    hoverColor: "hover:bg-indigo-700",
  },
  embeds: {
    icon: "🔗",
    color: "bg-amber-600",
    hoverColor: "hover:bg-amber-700",
  },
};

export const CATEGORIES = [
  "News",
  "Fashion",
  "Reviews",
  "Diaspora",
  "Music",
  "Politics",
  "General",
];
