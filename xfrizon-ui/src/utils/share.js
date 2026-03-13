export const getAbsoluteShareUrl = (pathOrUrl) => {
  if (!pathOrUrl) return window.location.href;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const normalized = String(pathOrUrl).startsWith("/")
    ? String(pathOrUrl)
    : `/${String(pathOrUrl)}`;
  return `${window.location.origin}${normalized}`;
};

export const openMessageShare = ({ title = "", url = "" }) => {
  const payload = encodeURIComponent(`${title}\n${url}`.trim());
  window.open(`https://wa.me/?text=${payload}`, "_blank", "noopener,noreferrer");
};

export const openInstagramShare = ({ title = "", url = "" }) => {
  const payload = encodeURIComponent(`${title}\n${url}`.trim());
  // Instagram web does not support direct prefilled post/story via URL,
  // so we open Instagram and let users paste the copied link.
  window.open(`https://www.instagram.com/?url=${payload}`, "_blank", "noopener,noreferrer");
};

export const shareNativelyOrCopy = async ({ title = "", text = "", url = "" }) => {
  if (navigator.share) {
    await navigator.share({ title, text, url });
    return "shared";
  }

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(url);
    return "copied";
  }

  const area = document.createElement("textarea");
  area.value = url;
  document.body.appendChild(area);
  area.select();
  document.execCommand("copy");
  document.body.removeChild(area);
  return "copied";
};

export const copyShareText = async ({ title = "", url = "" }) => {
  const payload = `${title}\n${url}`.trim();
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(payload);
    return;
  }
  const area = document.createElement("textarea");
  area.value = payload;
  document.body.appendChild(area);
  area.select();
  document.execCommand("copy");
  document.body.removeChild(area);
};
