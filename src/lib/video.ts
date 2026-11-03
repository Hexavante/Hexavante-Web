export function getYoutubeEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) {
      const id = parsed.pathname.slice(1).split("?")[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (parsed.hostname.includes("youtube.com")) {
      const id = parsed.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
      const pathMatch = parsed.pathname.match(/\/(embed|shorts|live)\/([^/?]+)/);
      if (pathMatch) return `https://www.youtube.com/embed/${pathMatch[2]}`;
    }
    if (parsed.hostname.includes("youtube-nocookie.com")) {
      return url;
    }
  } catch {
    return null;
  }
  return null;
}

export function getVimeoEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("vimeo.com")) {
      const id = parsed.pathname.split("/").filter(Boolean).pop();
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
  } catch {
    return null;
  }
  return null;
}

export function isTeraBoxUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname.includes("terabox.com") || parsed.hostname.includes("1024terabox.com");
  } catch {
    return false;
  }
}

export function isDirectVideoUrl(url: string): boolean {
  return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url);
}

export function getVideoEmbedUrl(url: string, provider?: string | null): string | null {
  if (provider === "vimeo") return getVimeoEmbedUrl(url);
  if (provider === "youtube") return getYoutubeEmbedUrl(url);
  if (isTeraBoxUrl(url)) return null;
  const yt = getYoutubeEmbedUrl(url);
  if (yt) return yt;
  const vimeo = getVimeoEmbedUrl(url);
  if (vimeo) return vimeo;
  return null;
}

export function canPublishTutorialVideo(value: string): boolean {
  if (/^\/uploads\/(?!\/)/.test(value)) return isDirectVideoUrl(value);
  let url: URL;
  try { url = new URL(value); } catch { return false; }
  if (!["https:", "http:"].includes(url.protocol)) return false;
  const host = url.hostname.toLowerCase();
  if (/(^|\.)(youtube\.com|youtu\.be|youtube-nocookie\.com)$/.test(host)) {
    const embed = getYoutubeEmbedUrl(value);
    return !!embed && /^\/embed\/[\w-]{11}\/?$/.test(new URL(embed).pathname);
  }
  if (/(^|\.)vimeo\.com$/.test(host)) return /^\/(?:.*\/)?\d+\/?$/.test(url.pathname);
  if (/(^|\.)(1024terabox|terabox)\.com$/.test(host)) return url.pathname.length > 1;
  return isDirectVideoUrl(value);
}
