import React from "react";

const PLACEHOLDER_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='700'%3E%3Crect fill='%23272727' width='1200' height='700'/%3E%3Ctext x='50%25' y='50%25' font-size='28' fill='%23717171' text-anchor='middle' dominant-baseline='middle'%3ENo Image%3C/text%3E%3C/svg%3E";

const resolveImage = (path) => {
  if (!path) return PLACEHOLDER_IMAGE;
  if (typeof path !== "string") return PLACEHOLDER_IMAGE;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (normalized.startsWith("/api") || normalized.startsWith("/uploads")) {
    return `http://localhost:8081${normalized}`;
  }
  return `http://localhost:8081/api/v1${normalized}`;
};

const formatDate = (dateValue) => {
  if (!dateValue) return "";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export default function BlogCard({ blog }) {
  const title = blog?.title || "Untitled Blog";
  const excerpt = blog?.excerpt || blog?.content || "No description available.";
  const category = blog?.category || "General";
  const author = blog?.author || "Unknown";
  const publishedDate = formatDate(blog?.publishedAt || blog?.createdAt || blog?.date);

  const imageSource = resolveImage(
    blog?.coverImage?.src || blog?.coverImage || blog?.image,
  );

  return (
    <article className="group h-full overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 transition-colors duration-200 hover:border-zinc-700">
      <div className="h-48 w-full overflow-hidden bg-zinc-900">
        <img
          src={imageSource}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(event) => {
            event.currentTarget.src = PLACEHOLDER_IMAGE;
          }}
        />
      </div>

      <div className="p-4 md:p-5">
        <div className="mb-2 flex items-center justify-between gap-2 text-[10px] uppercase tracking-widest text-zinc-500">
          <span className="truncate">{category}</span>
          {publishedDate && <span className="shrink-0">{publishedDate}</span>}
        </div>

        <h3 className="mb-2 line-clamp-2 text-lg font-semibold text-zinc-100">
          {title}
        </h3>

        <p className="mb-4 line-clamp-3 text-sm font-light leading-relaxed text-zinc-400">
          {excerpt}
        </p>

        <p className="text-xs font-light uppercase tracking-wide text-zinc-500">
          By {author}
        </p>
      </div>
    </article>
  );
}
