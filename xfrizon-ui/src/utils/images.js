export const DEFAULT_PANTHER_PLACEHOLDER = "/assets/african-panther-dark.svg";

export function getImageUrl(image, folder = "") {
  if (!image) return DEFAULT_PANTHER_PLACEHOLDER;
  if (typeof image !== "string") return DEFAULT_PANTHER_PLACEHOLDER;
  if (image.startsWith("http://") || image.startsWith("https://")) return image;
  // if image starts with a slash, treat as root-relative
  if (image.startsWith("/")) return image;
  // otherwise assume it's a filename in /assets or in a subfolder
  if (folder) return `/assets/${folder}/${image}`;
  return `/assets/${image}`;
}
