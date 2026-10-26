import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { useDebounce } from '../src/hooks/useDebounce';

function DebounceHarness() {
  const [value, setValue] = useState('alpha');
  const debounced = useDebounce(value, 50);
  return (
    <div>
      <button type="button" onClick={() => setValue('beta')}>
        Change
      </button>
      <span data-testid="value">{debounced}</span>
    </div>
  );
}

describe('useDebounce', () => {
  it('exposes the initial value immediately', () => {
    render(<DebounceHarness />);
    expect(screen.getByTestId('value')).toHaveTextContent('alpha');
  });

  it('updates the value only after the delay has elapsed', async () => {
    render(<DebounceHarness />);
    fireEvent.click(screen.getByRole('button', { name: 'Change' }));

    // Immediately after the change the debounced value is still the old one.
    expect(screen.getByTestId('value')).toHaveTextContent('alpha');

    await waitFor(() => expect(screen.getByTestId('value')).toHaveTextContent('beta'));
  });
});
