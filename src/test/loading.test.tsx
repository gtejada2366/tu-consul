import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Loading } from '../app/components/ui/loading';

describe('Loading component', () => {
  it('renders without crashing', () => {
    const { container } = render(<Loading />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders with fullscreen prop', () => {
    const { container } = render(<Loading fullscreen />);
    expect(container.firstChild).toHaveClass('fixed');
  });

  it('renders non-fullscreen by default', () => {
    const { container } = render(<Loading />);
    expect(container.firstChild).toHaveClass('flex');
    expect(container.firstChild).not.toHaveClass('fixed');
  });
});
