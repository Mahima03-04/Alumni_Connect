import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatusBadge from '../src/components/StatusBadge';
import EmptyState from '../src/components/EmptyState';
import StatCard from '../src/components/StatCard';

describe('StatusBadge', () => {
  it('renders a human readable label for a status', () => {
    render(<StatusBadge status="under_review" />);
    expect(screen.getByText('Under Review')).toBeInTheDocument();
  });

  it('honours a custom label override', () => {
    render(<StatusBadge status="approved" label="Verified" />);
    expect(screen.getByText('Verified')).toBeInTheDocument();
  });

  it('renders nothing without a status', () => {
    const { container } = render(<StatusBadge />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('EmptyState', () => {
  it('shows the title and description', () => {
    render(<EmptyState title="No jobs yet" description="Check back soon." />);
    expect(screen.getByText('No jobs yet')).toBeInTheDocument();
    expect(screen.getByText('Check back soon.')).toBeInTheDocument();
  });

  it('applies an action node when provided', () => {
    render(<EmptyState title="Empty" action={<button type="button">Create</button>} />);
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
  });
});

describe('StatCard', () => {
  it('renders the label and value', () => {
    render(<StatCard label="Total users" value={42} />);
    expect(screen.getByText('Total users')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders a hint and a downward trend', () => {
    render(<StatCard label="Pending" value={3} hint="awaiting review" trend={{ direction: 'down', value: '-5%' }} />);
    expect(screen.getByText('awaiting review')).toBeInTheDocument();
    expect(screen.getByText('-5%')).toBeInTheDocument();
  });
});
