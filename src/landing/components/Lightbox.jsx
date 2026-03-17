import { useState, useEffect, useCallback } from 'react';

export function useLightbox() {
  const [src, setSrc] = useState(null);
  const [type, setType] = useState('image'); // 'image' or 'video'
  const open = useCallback((url, mediaType = 'image') => {
    setSrc(url);
    setType(mediaType);
  }, []);
  const close = useCallback(() => setSrc(null), []);
  return { src, type, open, close, isOpen: !!src };
}

export default function Lightbox({ src, type = 'image', onClose }) {
  useEffect(() => {
    if (!src) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [src, onClose]);

  if (!src) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" />

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
        aria-label="Close"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Content */}
      <div className="relative z-10 max-w-5xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
        {type === 'video' ? (
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <iframe
              src={src}
              className="absolute inset-0 w-full h-full rounded-xl"
              allow="autoplay; fullscreen"
              allowFullScreen
              title="Video"
            />
          </div>
        ) : (
          <img
            src={src}
            alt="Preview"
            className="w-full max-h-[85vh] object-contain rounded-xl"
          />
        )}
      </div>
    </div>
  );
}
