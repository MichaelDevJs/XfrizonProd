export function getImageUrl(image, folder = "") {
  if (!image) return "/assets/placeholder.jpg";
  if (typeof image !== "string") return "/assets/placeholder.jpg";
  if (image.startsWith("http://") || image.startsWith("https://")) return image;
  // if image starts with a slash, treat as root-relative
  if (image.startsWith("/")) return image;
  // otherwise assume it's a filename in /assets or in a subfolder
  if (folder) return `/assets/${folder}/${image}`;
  return `/assets/${image}`;
}
