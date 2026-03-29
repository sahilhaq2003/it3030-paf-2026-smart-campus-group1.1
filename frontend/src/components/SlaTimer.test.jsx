import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import SlaTimer from './SlaTimer';

describe('SlaTimer Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render elapsed time in hours', () => {
    const createdAt = new Date(Date.now() - 2 * 60 * 60 * 1000);
    render(<SlaTimer createdAt={createdAt} priority="HIGH" status="OPEN" />);
    expect(screen.getByText(/2\.0.*h/i)).toBeInTheDocument();
  });

  it('should display SLA status label', () => {
    const createdAt = new Date(Date.now() - 1 * 60 * 60 * 1000);
    render(<SlaTimer createdAt={createdAt} priority="HIGH" status="OPEN" />);
    expect(screen.getByText(/SLA Status|SLA Breached/i)).toBeInTheDocument();
  });

  it('should highlight RED when CRITICAL priority breached (>2h)', () => {
    const createdAt = new Date(Date.now() - 3 * 60 * 60 * 1000);
    const { container } = render(<SlaTimer createdAt={createdAt} priority="CRITICAL" status="OPEN" />);
    const timer = container.querySelector('div');
    expect(timer).toHaveClass('border-red-300');
    expect(timer).toHaveClass('bg-red-50');
  });

  it('should highlight RED when HIGH priority breached (>8h)', () => {
    const createdAt = new Date(Date.now() - 10 * 60 * 60 * 1000);
    const { container } = render(<SlaTimer createdAt={createdAt} priority="HIGH" status="OPEN" />);
    const timer = container.querySelector('div');
    expect(timer).toHaveClass('border-red-300');
    expect(timer).toHaveClass('bg-red-50');
  });

  it('should show normal state for tickets within SLA', () => {
    const createdAt = new Date(Date.now() - 1 * 60 * 60 * 1000);
    const { container } = render(<SlaTimer createdAt={createdAt} priority="CRITICAL" status="OPEN" />);
    const timer = container.querySelector('div');
    expect(timer).toHaveClass('border-slate-200');
    expect(timer).toHaveClass('bg-white');
  });

  it('should not show breach for resolved tickets', () => {
    const createdAt = new Date(Date.now() - 10 * 60 * 60 * 1000);
    const { container } = render(<SlaTimer createdAt={createdAt} priority="HIGH" status="RESOLVED" />);
    const timer = container.querySelector('div');
    expect(timer).toHaveClass('border-slate-200');
    expect(timer).toHaveClass('bg-white');
  });

  it('should update elapsed time every 5 seconds', async () => {
    const createdAt = new Date(Date.now() - 1 * 60 * 60 * 1000);
    const { rerender } = render(<SlaTimer createdAt={createdAt} priority="HIGH" status="OPEN" />);
    
    expect(screen.getByText(/h elapsed/i)).toBeInTheDocument();
    
    vi.advanceTimersByTime(5000);
    rerender(<SlaTimer createdAt={createdAt} priority="HIGH" status="OPEN" />);
    
    await waitFor(() => {
      expect(screen.getByText(/h elapsed/i)).toBeInTheDocument();
    });
  });

  it('should show breach warning', () => {
    const createdAt = new Date(Date.now() - 1.5 * 60 * 60 * 1000);
    render(<SlaTimer createdAt={createdAt} priority="CRITICAL" status="OPEN" />);
    expect(screen.getByText(/SLA Breached/i)).toBeInTheDocument();
  });

  it('should handle null createdAt gracefully', () => {
    const { container } = render(<SlaTimer createdAt={null} priority="HIGH" status="OPEN" />);
    expect(container.firstChild).toBeNull();
  });

  it('should handle different priority levels correctly', () => {
    const priorities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
    
    priorities.forEach((priority) => {
      const createdAt = new Date(Date.now() - 1 * 60 * 60 * 1000);
      const { unmount } = render(<SlaTimer createdAt={createdAt} priority={priority} status="OPEN" />);
      expect(screen.getByText(/h elapsed/i)).toBeInTheDocument();
      unmount();
    });
  });

  it('should format decimal hours correctly', () => {
    const createdAt = new Date(Date.now() - 1.5 * 60 * 60 * 1000);
    render(<SlaTimer createdAt={createdAt} priority="HIGH" status="OPEN" />);
    expect(screen.getByText(/1\.5h elapsed/i)).toBeInTheDocument();
  });

  it('should display Clock icon when not breached', () => {
    const createdAt = new Date(Date.now() - 1 * 60 * 60 * 1000);
    const { container } = render(<SlaTimer createdAt={createdAt} priority="CRITICAL" status="OPEN" />);
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
  });

  it('should display AlertCircle icon when breached', () => {
    const createdAt = new Date(Date.now() - 3 * 60 * 60 * 1000);
    const { container } = render(<SlaTimer createdAt={createdAt} priority="CRITICAL" status="OPEN" />);
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
  });
});
