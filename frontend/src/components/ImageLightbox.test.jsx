import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ImageLightbox from './ImageLightbox';

// Mock TicketAttachmentImage component
vi.mock('./TicketAttachmentImage', () => ({
  default: ({ url, alt, className }) => <img src={url} alt={alt} className={className} />,
}));

describe('ImageLightbox Component', () => {
  const mockImages = [
    { id: '1', url: 'image1.jpg', alt: 'Image 1', originalName: 'test-1.jpg' },
    { id: '2', url: 'image2.jpg', alt: 'Image 2', originalName: 'test-2.jpg' },
    { id: '3', url: 'image3.jpg', alt: 'Image 3', originalName: 'test-3.jpg' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render lightbox with first image', () => {
    render(<ImageLightbox images={mockImages} initialIndex={0} onClose={vi.fn()} />);
    expect(screen.getByAltText('Image 1')).toBeInTheDocument();
  });

  it('should display image counter', () => {
    render(<ImageLightbox images={mockImages} initialIndex={0} onClose={vi.fn()} />);
    expect(screen.getByText(/1\s*\/\s*3/)).toBeInTheDocument();
  });

  it('should navigate to next image', async () => {
    const user = userEvent.setup();
    render(<ImageLightbox images={mockImages} initialIndex={0} onClose={vi.fn()} />);
    
    const nextButton = screen.getByRole('button', { name: /Next image/i });
    await user.click(nextButton);
    
    expect(screen.getByAltText('Image 2')).toBeInTheDocument();
    expect(screen.getByText(/2\s*\/\s*3/)).toBeInTheDocument();
  });

  it('should navigate to previous image', async () => {
    const user = userEvent.setup();
    render(<ImageLightbox images={mockImages} initialIndex={2} onClose={vi.fn()} />);
    
    const prevButton = screen.getByRole('button', { name: /Previous image/i });
    await user.click(prevButton);
    
    expect(screen.getByAltText('Image 2')).toBeInTheDocument();
    expect(screen.getByText(/2\s*\/\s*3/)).toBeInTheDocument();
  });

  it('should wrap to first image from last', async () => {
    const user = userEvent.setup();
    render(<ImageLightbox images={mockImages} initialIndex={2} onClose={vi.fn()} />);
    
    const nextButton = screen.getByRole('button', { name: /Next image/i });
    await user.click(nextButton);
    
    expect(screen.getByAltText('Image 1')).toBeInTheDocument();
    expect(screen.getByText(/1\s*\/\s*3/)).toBeInTheDocument();
  });

  it('should wrap to last image from first', async () => {
    const user = userEvent.setup();
    render(<ImageLightbox images={mockImages} initialIndex={0} onClose={vi.fn()} />);
    
    const prevButton = screen.getByRole('button', { name: /Previous image/i });
    await user.click(prevButton);
    
    expect(screen.getByAltText('Image 3')).toBeInTheDocument();
    expect(screen.getByText(/3\s*\/\s*3/)).toBeInTheDocument();
  });

  it('should navigate with arrow keys', async () => {
    render(<ImageLightbox images={mockImages} initialIndex={0} onClose={vi.fn()} />);
    
    fireEvent.keyDown(document, { key: 'ArrowRight' });
    expect(screen.getByAltText('Image 2')).toBeInTheDocument();
    
    fireEvent.keyDown(document, { key: 'ArrowLeft' });
    expect(screen.getByAltText('Image 1')).toBeInTheDocument();
  });

  it('should close on Escape key', () => {
    const mockOnClose = vi.fn();
    render(<ImageLightbox images={mockImages} initialIndex={0} onClose={mockOnClose} />);
    
    fireEvent.keyDown(document, { key: 'Escape' });
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should close when clicking close button', async () => {
    const user = userEvent.setup();
    const mockOnClose = vi.fn();
    render(<ImageLightbox images={mockImages} initialIndex={0} onClose={mockOnClose} />);
    
    const closeButton = screen.getByRole('button', { name: /Close lightbox/i });
    await user.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should not render for empty images', () => {
    const { container } = render(<ImageLightbox images={[]} initialIndex={0} onClose={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('should hide navigation buttons for single image', () => {
    const singleImage = [mockImages[0]];
    render(<ImageLightbox images={singleImage} initialIndex={0} onClose={vi.fn()} />);
    
    const prevButton = screen.queryByRole('button', { name: /Previous image/i });
    const nextButton = screen.queryByRole('button', { name: /Next image/i });
    
    expect(prevButton).not.toBeInTheDocument();
    expect(nextButton).not.toBeInTheDocument();
  });

  it('should display filename', () => {
    render(<ImageLightbox images={mockImages} initialIndex={0} onClose={vi.fn()} />);
    expect(screen.getByText('test-1.jpg')).toBeInTheDocument();
  });

  it('should show keyboard hints for multiple images', () => {
    render(<ImageLightbox images={mockImages} initialIndex={0} onClose={vi.fn()} />);
    expect(screen.getByText(/Previous.*Next/)).toBeInTheDocument();
  });

  it('should have correct ARIA labels', () => {
    render(<ImageLightbox images={mockImages} initialIndex={0} onClose={vi.fn()} />);
    
    expect(screen.getByRole('button', { name: /Previous image/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Next image/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Close lightbox/i })).toBeInTheDocument();
  });

  it('should handle invalid initialIndex', () => {
    render(<ImageLightbox images={mockImages} initialIndex={999} onClose={vi.fn()} />);
    expect(screen.getByAltText(/Image/)).toBeInTheDocument();
  });

  it('should handle rapid navigation', async () => {
    const user = userEvent.setup();
    render(<ImageLightbox images={mockImages} initialIndex={0} onClose={vi.fn()} />);
    
    const nextButton = screen.getByRole('button', { name: /Next image/i });
    await user.click(nextButton);
    await user.click(nextButton);
    await user.click(nextButton);
    
    expect(screen.getByText(/1\s*\/\s*3/)).toBeInTheDocument();
  });
});
