export function formatRelativeTime(value, now = new Date()) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const diffMs = now.getTime() - date.getTime();
  const future = diffMs < 0;
  const abs = Math.abs(diffMs);
  const minutes = Math.round(abs / 60000);
  const hours = Math.round(abs / 3600000);
  const days = Math.round(abs / 86400000);

  let phrase;
  if (abs < 45000) phrase = "sapo";
  else if (minutes < 60) phrase = `${minutes} min`;
  else if (hours < 24) phrase = `${hours} orë`;
  else if (days === 1) phrase = "1 ditë";
  else phrase = `${days} ditë`;

  if (phrase === "sapo") return "Sapo";
  return future ? `pas ${phrase}` : `${phrase} më parë`;
}

export function formatUpdatedBy(value, actor) {
  const rel = formatRelativeTime(value);
  if (!rel) return null;
  const who = actor && String(actor).trim();
  if (rel === "Sapo") return who ? `Përditësuar sapo nga ${who}` : "Përditësuar sapo";
  return who ? `Përditësuar ${rel} nga ${who}` : `Përditësuar ${rel}`;
}

export function formatDurationSince(value, now = new Date()) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const minutes = Math.max(0, Math.round((now.getTime() - date.getTime()) / 60000));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} orë ${rest} min` : `${hours} orë`;
}
