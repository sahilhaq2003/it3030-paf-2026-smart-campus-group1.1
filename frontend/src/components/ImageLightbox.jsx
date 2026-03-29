import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import TicketAttachmentImage from './TicketAttachmentImage';

export default function ImageLightbox({ images, initialIndex = 0, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  if (!images || images.length === 0) return null;

  const currentImage = images[currentIndex];
  const hasMultiple = images.length > 1;

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
      if (e.key === 'ArrowLeft') goToPrevious();
      if (e.key === 'ArrowRight') goToNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, images.length]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
      {/* Image Container */}
      <div className="relative max-h-[90vh] max-w-[90vw] flex items-center justify-center">
        <TicketAttachmentImage
          url={currentImage.url}
          alt={currentImage.originalName}
          className="max-h-[80vh] max-w-[80vw] rounded-xl object-contain shadow-xl"
        />

        {/* Counter Badge */}
        {hasMultiple && (
          <div className="absolute top-4 right-4 rounded-full bg-black/70 px-3 py-1 text-sm font-semibold text-white">
            {currentIndex + 1} / {images.length}
          </div>
        )}

        {/* Filename Badge */}
        <div className="absolute bottom-4 left-4 max-w-xs rounded-lg bg-black/70 px-3 py-2 text-sm text-white truncate">
          {currentImage.originalName}
        </div>

        {/* Navigation Buttons */}
        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-3 text-white transition-all hover:bg-white/40 focus:outline-none focus:ring-2 focus:ring-white"
              aria-label="Previous image"
            >
              <ChevronLeft size={32} strokeWidth={2} />
            </button>

            <button
              type="button"
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-3 text-white transition-all hover:bg-white/40 focus:outline-none focus:ring-2 focus:ring-white"
              aria-label="Next image"
            >
              <ChevronRight size={32} strokeWidth={2} />
            </button>
          </>
        )}
      </div>

      {/* Close Button */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 rounded-full bg-white/20 p-3 text-white transition-all hover:bg-white/40 focus:outline-none focus:ring-2 focus:ring-white"
        aria-label="Close lightbox"
      >
        <X size={28} strokeWidth={2} />
      </button>

      {/* Keyboard hints (visible on hover) */}
      {hasMultiple && (
        <div className="absolute bottom-4 right-4 rounded-lg bg-black/70 px-3 py-2 text-xs text-white opacity-0 transition-opacity hover:opacity-100">
          <p>← Previous • Next →</p>
          <p>ESC to close</p>
        </div>
      )}
    </div>
  );
}
