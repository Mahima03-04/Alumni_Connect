import { describe, it, expect } from 'vitest';
import { NAV_BY_ROLE, ROLE_HOME, ROLE_LABELS, STATUS_STYLES } from '../src/utils/constants';

describe('role configuration', () => {
  it('defines a navigation menu for every role', () => {
    expect(Object.keys(NAV_BY_ROLE).sort()).toEqual(['admin', 'alumni', 'student']);
    Object.values(NAV_BY_ROLE).forEach((items) => {
      expect(items.length).toBeGreaterThan(0);
      items.forEach((item) => {
        expect(item).toHaveProperty('label');
        expect(item.to.startsWith('/')).toBe(true);
      });
    });
  });

  it('maps each role to a dashboard home route', () => {
    expect(ROLE_HOME.student).toBe('/student/dashboard');
    expect(ROLE_HOME.alumni).toBe('/alumni/dashboard');
    expect(ROLE_HOME.admin).toBe('/admin/dashboard');
  });

  it('has a friendly label for every role', () => {
    expect(ROLE_LABELS.admin).toBe('Administrator');
    expect(ROLE_LABELS.student).toBe('Student');
    expect(ROLE_LABELS.alumni).toBe('Alumni');
  });

  it('provides a badge colour for each important status', () => {
    ['pending', 'approved', 'rejected', 'open', 'closed', 'submitted', 'accepted'].forEach((status) => {
      expect(STATUS_STYLES[status]).toBeTruthy();
    });
  });
});
