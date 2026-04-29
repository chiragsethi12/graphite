/**
 * formatRelativeTime — Human-friendly relative timestamps.
 *
 * Examples:
 *   "just now"  |  "2 minutes ago"  |  "1 hour ago"
 *   "yesterday" |  "3 days ago"     |  "last week"
 *   "2 weeks ago" | "Apr 12"        |  "Dec 3, 2024"
 */
export default function formatRelativeTime(dateStr) {
  if (!dateStr) return "";

  const now = Date.now();
  const date = new Date(dateStr);
  const diff = now - date.getTime();

  // Guard against future dates or invalid
  if (diff < 0 || isNaN(diff)) return "just now";

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours   = Math.floor(minutes / 60);
  const days    = Math.floor(hours / 24);
  const weeks   = Math.floor(days / 7);

  if (seconds < 60) return "just now";
  if (minutes === 1) return "1 minute ago";
  if (minutes < 60)  return `${minutes} minutes ago`;
  if (hours === 1)   return "1 hour ago";
  if (hours < 24)    return `${hours} hours ago`;
  if (days === 1)    return "yesterday";
  if (days < 7)      return `${days} days ago`;
  if (weeks === 1)   return "last week";
  if (weeks < 4)     return `${weeks} weeks ago`;

  // Beyond 4 weeks — show short date
  const sameYear = date.getFullYear() === new Date().getFullYear();
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = monthNames[date.getMonth()];
  const day = date.getDate();

  if (sameYear) return `${month} ${day}`;
  return `${month} ${day}, ${date.getFullYear()}`;
}
