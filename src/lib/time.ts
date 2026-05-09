/**
 * Formats a timestamp as a relative string.
 * Returns strings like: "just now", "5m ago", "3h ago", "Mon at 2pm", "Jan 12"
 */
export function timeAgo(isoString: string | undefined | null): string {
  if (!isoString) return "";
  const d    = new Date(isoString);
  const now  = Date.now();
  const diff = (now - d.getTime()) / 1000; // seconds

  if (diff < 60)                return "just now";
  if (diff < 3600)              return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)             return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 7) {
    const day = d.toLocaleDateString("en-US", { weekday: "short" });
    const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    return `${day} at ${time}`;
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
