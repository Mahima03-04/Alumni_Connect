/** Small formatting helpers shared across the UI. */

export function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelativeTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  const diff = Date.now() - date.getTime();
  const minutes = Math.round(diff / 60000);
  if (Math.abs(minutes) < 1) return 'just now';
  if (Math.abs(minutes) < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return `${hours} hour${Math.abs(hours) === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  if (Math.abs(days) < 30) return `${days} day${Math.abs(days) === 1 ? '' : 's'} ago`;
  const months = Math.round(days / 30);
  if (Math.abs(months) < 12) return `${months} month${Math.abs(months) === 1 ? '' : 's'} ago`;
  return `${Math.round(months / 12)} year(s) ago`;
}

/** "in 3 days" style label for future dates such as event start times. */
export function formatCountdown(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const diff = date.getTime() - Date.now();
  if (diff < 0) return 'Completed';
  const days = Math.floor(diff / 86400000);
  if (days > 1) return `in ${days} days`;
  if (days === 1) return 'tomorrow';
  const hours = Math.floor(diff / 3600000);
  if (hours >= 1) return `in ${hours} hour${hours === 1 ? '' : 's'}`;
  return 'starting soon';
}

/** Two letter initials used by the avatar fallback. */
export function getInitials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function titleCase(value = '') {
  return String(value)
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatSalary(min, max, currency = 'INR', period = 'year') {
  if (!min && !max) return 'Not disclosed';
  const fmt = (n) =>
    new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(Number(n));
  const suffix = period === 'month' ? '/month' : '/year';
  if (min && max) return `${currency} ${fmt(min)} - ${fmt(max)}${suffix}`;
  return `${currency} ${fmt(min || max)}${suffix}`;
}

export function formatFileSize(bytes) {
  if (!bytes) return '0 KB';
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

/** Absolute URL for an uploaded file (works with the Vite proxy). */
export function fileUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return path;
}

export function truncate(text = '', length = 160) {
  if (text.length <= length) return text;
  return `${text.slice(0, length).trimEnd()}...`;
}

export function buildQueryString(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '' && value !== 'all') {
      search.set(key, value);
    }
  });
  const str = search.toString();
  return str ? `?${str}` : '';
}
