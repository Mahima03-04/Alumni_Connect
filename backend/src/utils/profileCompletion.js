'use strict';

/**
 * Calculates an alumni profile completion percentage (0-100) from a fixed
 * checklist of fields. Used on dashboards and profile cards.
 */
const ALUMNI_FIELDS = [
  'university',
  'department',
  'degree',
  'graduationYear',
  'currentCompany',
  'jobTitle',
  'biography',
  'linkedinUrl',
];

function hasValue(value) {
  if (value === undefined || value === null) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'string') return value.trim().length > 0;
  return true;
}

function computeAlumniCompletion(profile = {}, user = {}) {
  const items = [...ALUMNI_FIELDS, 'skills'];
  let filled = 0;

  items.forEach((field) => {
    if (hasValue(profile[field])) filled += 1;
  });

  // The profile photo lives on the user document.
  if (hasValue(user.profilePhoto)) filled += 1;

  const total = items.length + 1;
  return Math.round((filled / total) * 100);
}

module.exports = { computeAlumniCompletion };
