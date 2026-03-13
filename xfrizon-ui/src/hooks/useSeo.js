import { useEffect } from "react";

const upsertMetaTag = (selector, createAttrs, content) => {
  let tag = document.head.querySelector(selector);
  if (!tag) {
    tag = document.createElement("meta");
    Object.entries(createAttrs).forEach(([key, value]) => {
      tag.setAttribute(key, value);
    });
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content || "");
};

const upsertCanonical = (href) => {
  let canonical = document.head.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.setAttribute("rel", "canonical");
    document.head.appendChild(canonical);
  }
  canonical.setAttribute("href", href);
};

export default function useSeo({
  title,
  description,
  image,
  url,
  type = "website",
  keywords,
  noIndex = false,
  jsonLd,
}) {
  useEffect(() => {
    const siteName = "Xfrizon";
    const fallbackTitle = "Xfrizon - Events, Blogs, Tickets";
    const fallbackDescription =
      "Discover events, buy tickets, and read the latest music and culture blogs on Xfrizon.";
    const pageTitle = title || fallbackTitle;
    const pageDescription = description || fallbackDescription;
    const pageUrl =
      url ||
      (typeof window !== "undefined"
        ? window.location.href
        : "https://xfrizon.up.railway.app/");
    const pageImage = image || "";

    document.title = pageTitle;

    upsertMetaTag(
      'meta[name="description"]',
      { name: "description" },
      pageDescription,
    );
    upsertMetaTag('meta[name="robots"]', { name: "robots" }, noIndex ? "noindex,nofollow" : "index,follow");
    if (keywords) {
      upsertMetaTag('meta[name="keywords"]', { name: "keywords" }, keywords);
    }

    upsertMetaTag('meta[property="og:title"]', { property: "og:title" }, pageTitle);
    upsertMetaTag(
      'meta[property="og:description"]',
      { property: "og:description" },
      pageDescription,
    );
    upsertMetaTag('meta[property="og:type"]', { property: "og:type" }, type);
    upsertMetaTag('meta[property="og:url"]', { property: "og:url" }, pageUrl);
    upsertMetaTag('meta[property="og:site_name"]', { property: "og:site_name" }, siteName);
    if (pageImage) {
      upsertMetaTag('meta[property="og:image"]', { property: "og:image" }, pageImage);
    }

    upsertMetaTag('meta[name="twitter:card"]', { name: "twitter:card" }, pageImage ? "summary_large_image" : "summary");
    upsertMetaTag('meta[name="twitter:title"]', { name: "twitter:title" }, pageTitle);
    upsertMetaTag(
      'meta[name="twitter:description"]',
      { name: "twitter:description" },
      pageDescription,
    );
    if (pageImage) {
      upsertMetaTag('meta[name="twitter:image"]', { name: "twitter:image" }, pageImage);
    }

    upsertCanonical(pageUrl);

    const scriptId = "xfrizon-seo-jsonld";
    const oldScript = document.getElementById(scriptId);
    if (oldScript) {
      oldScript.remove();
    }

    if (jsonLd) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.type = "application/ld+json";
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }
  }, [title, description, image, url, type, keywords, noIndex, jsonLd]);
}
