import { getInitials } from '../utils/format';

const SIZES = {
  sm: 'h-9 w-9 text-xs',
  md: 'h-12 w-12 text-sm',
  lg: 'h-16 w-16 text-lg',
  xl: 'h-24 w-24 text-2xl',
};

/** Profile photo with a coloured initials fallback (no external images). */
export default function Avatar({ src, name = '', size = 'md', className = '' }) {
  const sizeClass = SIZES[size] || SIZES.md;
  const initials = getInitials(name);

  if (src) {
    return (
      <img
        src={src}
        alt={name ? `${name} profile photo` : 'Profile photo'}
        className={`${sizeClass} rounded-full object-cover ring-2 ring-white shadow-sm ${className}`}
        loading="lazy"
        onError={(event) => {
          // Fall back to initials if the image cannot be loaded.
          event.currentTarget.style.display = 'none';
          if (event.currentTarget.nextSibling) event.currentTarget.nextSibling.style.display = 'flex';
        }}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`${sizeClass} inline-flex items-center justify-center rounded-full bg-gradient-to-br from-navy-700 to-accent-600 font-semibold text-white ring-2 ring-white shadow-sm ${className}`}
    >
      {initials}
    </span>
  );
}
