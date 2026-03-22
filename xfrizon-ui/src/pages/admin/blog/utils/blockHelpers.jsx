import React from "react";

// Block helper functions for blog editor
import { toast } from "react-toastify";

const INLINE_COLOR_REGEX = /\[color=([^\]]+)\]([\s\S]+?)\[\/color\]/;
const MARKDOWN_LINK_REGEX = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/;
const BOLD_REGEX = /\*\*([^*][\s\S]*?)\*\*/;
const ITALIC_UNDERSCORE_REGEX = /_([^_][\s\S]*?)_/;
const ITALIC_ASTERISK_REGEX = /\*([^*][\s\S]*?)\*/;
const BARE_URL_REGEX = /(https?:\/\/[^\s]+)/g;

const isSafeColorValue = (value) => {
  const candidate = String(value || "").trim();
  return (
    /^#[0-9a-f]{3,8}$/i.test(candidate) ||
    /^rgb(a)?\([^)]*\)$/i.test(candidate) ||
    /^[a-z]+$/i.test(candidate)
  );
};

const wrapPlainTextUrls = (text, linkClassName, keyPrefix) => {
  const content = String(text || "");
  if (!content) return "";

  const nodes = [];
  let cursor = 0;
  let match;

  while ((match = BARE_URL_REGEX.exec(content)) !== null) {
    const [url] = match;
    const start = match.index;

    if (start > cursor) {
      nodes.push(content.slice(cursor, start));
    }

    nodes.push(
      <a
        key={`${keyPrefix}-url-${start}`}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClassName}
      >
        {url}
      </a>,
    );

    cursor = start + url.length;
  }

  if (cursor < content.length) {
    nodes.push(content.slice(cursor));
  }

  return nodes.length > 0 ? nodes : content;
};

const renderInlineNodes = (text, options, keyPrefix = "inline") => {
  const content = String(text || "");
  if (!content) return "";

  const patterns = [
    {
      regex: INLINE_COLOR_REGEX,
      render: (match, children, key) => {
        const colorValue = String(match[1] || "").trim();
        return (
          <span
            key={key}
            style={isSafeColorValue(colorValue) ? { color: colorValue } : {}}
          >
            {children}
          </span>
        );
      },
    },
    {
      regex: MARKDOWN_LINK_REGEX,
      render: (match, _children, key) => (
        <a
          key={key}
          href={match[2]}
          target="_blank"
          rel="noopener noreferrer"
          className={options.linkClassName}
        >
          {match[1]}
        </a>
      ),
    },
    {
      regex: BOLD_REGEX,
      render: (_match, children, key) => <strong key={key}>{children}</strong>,
    },
    {
      regex: ITALIC_UNDERSCORE_REGEX,
      render: (_match, children, key) => <em key={key}>{children}</em>,
    },
    {
      regex: ITALIC_ASTERISK_REGEX,
      render: (_match, children, key) => <em key={key}>{children}</em>,
    },
  ];

  let earliestMatch = null;
  let selectedPattern = null;

  patterns.forEach((pattern) => {
    const match = pattern.regex.exec(content);
    if (!match) return;

    if (!earliestMatch || match.index < earliestMatch.index) {
      earliestMatch = match;
      selectedPattern = pattern;
    }
  });

  if (!earliestMatch || !selectedPattern) {
    return wrapPlainTextUrls(content, options.linkClassName, keyPrefix);
  }

  const before = content.slice(0, earliestMatch.index);
  const raw = earliestMatch[0];
  const innerText =
    selectedPattern.regex === MARKDOWN_LINK_REGEX
      ? ""
      : selectedPattern.regex === INLINE_COLOR_REGEX
        ? earliestMatch[2]
        : earliestMatch[1];
  const after = content.slice(earliestMatch.index + raw.length);
  const nodes = [];

  if (before) {
    nodes.push(
      <React.Fragment key={`${keyPrefix}-before-${earliestMatch.index}`}>
        {renderInlineNodes(before, options, `${keyPrefix}-before`)}
      </React.Fragment>,
    );
  }

  const children = innerText
    ? renderInlineNodes(innerText, options, `${keyPrefix}-inner-${earliestMatch.index}`)
    : null;

  nodes.push(
    selectedPattern.render(
      earliestMatch,
      children,
      `${keyPrefix}-match-${earliestMatch.index}`,
    ),
  );

  if (after) {
    nodes.push(
      <React.Fragment key={`${keyPrefix}-after-${earliestMatch.index}`}>
        {renderInlineNodes(after, options, `${keyPrefix}-after`)}
      </React.Fragment>,
    );
  }

  return nodes;
};

export const renderRichText = (content, options = {}) => {
  const settings = {
    paragraphClassName: "mb-2",
    heading1ClassName: "text-3xl font-bold mt-6 mb-3",
    heading2ClassName: "text-2xl font-bold mt-5 mb-3",
    heading3ClassName: "text-xl font-semibold mt-4 mb-2",
    bulletClassName: "ml-5 list-disc",
    linkClassName: "text-blue-400 underline underline-offset-2",
    wrapperClassName: "",
    textStyle: {},
    ...options,
  };

  const lines = String(content || "").split("\n");

  return (
    <div className={settings.wrapperClassName} style={settings.textStyle}>
      {lines.map((line, idx) => {
        const leadingSpaces = line.match(/^\s*/)?.[0].length || 0;
        const indentLevel = Math.floor(leadingSpaces / 2);
        const trimmed = line.trim();

        if (!trimmed) {
          return <div key={`line-${idx}`} className="h-4" />;
        }

        if (trimmed.startsWith("### ")) {
          return (
            <h3 key={`line-${idx}`} className={settings.heading3ClassName}>
              {renderInlineNodes(trimmed.slice(4), settings, `h3-${idx}`)}
            </h3>
          );
        }

        if (trimmed.startsWith("## ")) {
          return (
            <h2 key={`line-${idx}`} className={settings.heading2ClassName}>
              {renderInlineNodes(trimmed.slice(3), settings, `h2-${idx}`)}
            </h2>
          );
        }

        if (trimmed.startsWith("# ")) {
          return (
            <h1 key={`line-${idx}`} className={settings.heading1ClassName}>
              {renderInlineNodes(trimmed.slice(2), settings, `h1-${idx}`)}
            </h1>
          );
        }

        if (
          trimmed.startsWith("- ") ||
          trimmed.startsWith("* ") ||
          trimmed.startsWith("• ")
        ) {
          return (
            <ul
              key={`line-${idx}`}
              className={settings.bulletClassName}
              style={{ marginLeft: `${indentLevel * 1.25}rem` }}
            >
              <li>{renderInlineNodes(trimmed.slice(2), settings, `li-${idx}`)}</li>
            </ul>
          );
        }

        if (/^\d+\.\s/.test(trimmed)) {
          const numberedText = trimmed.replace(/^\d+\.\s/, "");
          return (
            <ol
              key={`line-${idx}`}
              className={settings.bulletClassName}
              style={{ marginLeft: `${indentLevel * 1.25}rem` }}
            >
              <li>
                {renderInlineNodes(numberedText, settings, `oli-${idx}`)}
              </li>
            </ol>
          );
        }

        return (
          <p key={`line-${idx}`} className={settings.paragraphClassName}>
            {renderInlineNodes(line, settings, `p-${idx}`)}
          </p>
        );
      })}
    </div>
  );
};

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
    case "continue":
      newBlock.type = "continue";
      newBlock.label = "Next Break";
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

export const applyFormat = (
  blockId,
  format,
  formData,
  setFormData,
  options = {},
) => {
  const block = formData.blocks.find((b) => b.id === blockId);
  if (block?.type !== "text") return;

  const textareaId = `textarea-${blockId}`;
  const textarea = document.getElementById(textareaId);
  if (!textarea) return;

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selectedText = block.content.substring(start, end);
  const fallbackSelection = selectedText || "Your text";

  const getCurrentLineIndent = () => {
    const lineStart = block.content.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
    const currentLine = block.content.slice(lineStart);
    return currentLine.match(/^[\t ]*/)?.[0] || "";
  };

  const applyListPrefix = (prefixBuilder) => {
    const indent = getCurrentLineIndent();
    const sourceLines = fallbackSelection.split("\n");
    return sourceLines
      .map((line, idx) => {
        const normalized = line.trim();
        const content = normalized.length > 0 ? normalized : "Your text";
        return `${indent}${prefixBuilder(idx)} ${content}`;
      })
      .join("\n");
  };

  let formattedText = fallbackSelection;

  switch (format) {
    case "bold":
      formattedText = `**${fallbackSelection}**`;
      break;
    case "italic":
      formattedText = `_${fallbackSelection}_`;
      break;
    case "heading":
    case "heading1":
      formattedText = `# ${fallbackSelection}`;
      break;
    case "heading2":
      formattedText = `## ${fallbackSelection}`;
      break;
    case "heading3":
      formattedText = `### ${fallbackSelection}`;
      break;
    case "bullet":
      formattedText = applyListPrefix(() => "-");
      break;
    case "numbered":
      formattedText = applyListPrefix((idx) => `${idx + 1}.`);
      break;
    case "link": {
      const url = window.prompt("Enter URL", "https://");
      if (!url) return;
      const defaultLabel = selectedText || "";
      const linkLabel =
        defaultLabel ||
        window.prompt("Enter link text (display name)", "") ||
        "Link";
      formattedText = `[${linkLabel}](${url.trim()})`;
      break;
    }
    case "color": {
      const color =
        typeof options.color === "string" && options.color.trim()
          ? options.color.trim()
          : window.prompt("Enter text color (hex or CSS color)", "#ef4444");
      if (!color) return;
      formattedText = `[color=${color.trim()}]${fallbackSelection}[/color]`;
      break;
    }
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
    return renderRichText(block.content, {
      paragraphClassName: "mb-2",
      heading1ClassName: "text-3xl font-bold mt-5 mb-3",
      heading2ClassName: "text-2xl font-bold mt-4 mb-2",
      heading3ClassName: "text-xl font-semibold mt-4 mb-2",
      bulletClassName: "ml-4 list-disc",
      linkClassName: "text-blue-400 underline underline-offset-2",
      textStyle: {
        fontFamily: block.style?.fontFamily || "inherit",
        fontSize: block.style?.fontSize
          ? `${block.style.fontSize}px`
          : undefined,
        color: block.style?.color || undefined,
        opacity: block.style?.opacity !== undefined ? block.style.opacity : 1,
      },
    });
  } else if (block.type === "image") {
    return (
      <div className="grid grid-cols-2 gap-2">
        {block.images?.slice(0, 4).map((img) => (
          <figure key={img.id}>
            <img
              src={img.src}
              alt="preview"
              className="w-full h-24 object-cover rounded"
            />
            {(img.caption || img.credit) && (
              <figcaption className="mt-1 text-[10px] text-gray-500">
                {img.caption || ""}
                {img.caption && img.credit ? " " : ""}
                {img.credit ? `(${img.credit})` : ""}
              </figcaption>
            )}
          </figure>
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
  } else if (block.type === "continue") {
    return (
      <div className="rounded border border-dashed border-amber-500/50 bg-amber-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-amber-300">
        Next button starts after this point
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
  continue: {
    icon: "⤵",
    color: "bg-zinc-600",
    hoverColor: "hover:bg-zinc-700",
  },
};

export const CATEGORIES = [
  "General",
  "News",
  "Culture",
  "Events",
  "Arts",
  "Music",
  "Fashion",
  "Reviews",
  "Food",
];
