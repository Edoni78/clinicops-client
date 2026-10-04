import { supabase } from "../lib/supabaseClient";

export function publicObjectUrl(bucket, path) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data?.publicUrl || null;
}

export async function blobToDataUrl(blob) {
  if (!blob) return null;
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function fetchAsDataUrl(urlOrPath, bucket) {
  if (!urlOrPath) return null;
  try {
    if (/^https?:\/\//i.test(urlOrPath)) {
      const response = await fetch(urlOrPath);
      if (!response.ok) return null;
      return blobToDataUrl(await response.blob());
    }
    const { data, error } = await supabase.storage.from(bucket).download(urlOrPath);
    if (error || !data) return null;
    return blobToDataUrl(data);
  } catch {
    return null;
  }
}

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export function assertImageFile(file) {
  if (!file) throw new Error("Skedari mungon.");
  const type = (file.type || "").toLowerCase();
  const name = (file.name || "").toLowerCase();
  const okType = IMAGE_TYPES.includes(type) || /\.(jpe?g|png|gif|webp)$/.test(name);
  if (!okType) {
    const err = new Error("Lejohen vetëm imazhe jpg, png, gif ose webp.");
    err.response = { status: 400, data: { message: err.message } };
    throw err;
  }
  if (file.size > 5 * 1024 * 1024) {
    const err = new Error("Imazhi e kalon madhësinë maksimale prej 5 MB.");
    err.response = { status: 400, data: { message: err.message } };
    throw err;
  }
}

export function fileExtension(file) {
  const name = file?.name || "";
  const match = name.match(/\.([a-z0-9]+)$/i);
  return (match?.[1] || "png").toLowerCase();
}
