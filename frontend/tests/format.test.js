import { describe, it, expect, vi } from 'vitest';
import {
  getInitials,
  titleCase,
  truncate,
  formatDateTime,
  formatRelativeTime,
  formatCountdown,
  formatFileSize,
  fileUrl,
  buildQueryString,
} from '../src/utils/format';

describe('format utilities', () => {
  it('derives two letter initials from a full name', () => {
    expect(getInitials('Arjun Mehta')).toBe('AM');
    expect(getInitials('Madonna')).toBe('MA');
    expect(getInitials('')).toBe('?');
  });

  it('turns snake_case and dashed values into readable labels', () => {
    expect(titleCase('under_review')).toBe('Under Review');
    expect(titleCase('full-time')).toBe('Full Time');
  });

  it('truncates long text and leaves short text untouched', () => {
    expect(truncate('short', 160)).toBe('short');
    expect(truncate('a'.repeat(200), 10)).toBe('aaaaaaaaaa...');
  });

  it('formats file sizes', () => {
    expect(formatFileSize(0)).toBe('0 KB');
    expect(formatFileSize(2048)).toBe('2 KB');
    expect(formatFileSize(3 * 1024 * 1024)).toBe('3.0 MB');
  });

  it('returns an uploaded file path unchanged and null when empty', () => {
    expect(fileUrl('/uploads/photos/a.png')).toBe('/uploads/photos/a.png');
    expect(fileUrl(null)).toBeNull();
  });

  it('builds a query string and skips blank/all values', () => {
    expect(buildQueryString({ page: 1, search: '', role: 'all', dept: 'CS' })).toBe('?page=1&dept=CS');
    expect(buildQueryString({})).toBe('');
  });

  it('returns a dash for invalid or empty dates', () => {
    expect(formatDateTime(null)).toBe('-');
    expect(formatDateTime('not-a-date')).toBe('-');
    expect(formatRelativeTime(undefined)).toBe('-');
  });
});

describe('relative time and countdown', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('describes the present moment as "just now"', () => {
    expect(formatRelativeTime(new Date())).toBe('just now');
  });

  it('formats past times in minutes and days', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-10T12:00:00Z'));
    expect(formatRelativeTime(new Date('2026-01-10T11:30:00Z'))).toBe('30 min ago');
    expect(formatRelativeTime(new Date('2026-01-08T12:00:00Z'))).toBe('2 days ago');
  });

  it('returns Completed for past dates and counts down future ones', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-10T12:00:00Z'));
    expect(formatCountdown(new Date('2026-01-08T12:00:00Z'))).toBe('Completed');
    expect(formatCountdown(new Date('2026-01-13T12:00:00Z'))).toBe('in 3 days');
  });
});
