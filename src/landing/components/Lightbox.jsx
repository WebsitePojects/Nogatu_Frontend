import { useState, useEffect, useCallback } from 'react';

export function useLightbox() {
  const [src, setSrc] = useState(null);
  const [type, setType] = useState('image'); // 'image' or 'video'
  const [filename, setFilename] = useState(null);
  const open = useCallback((url, mediaType = 'image', name = null) => {
    setSrc(url);
    setType(mediaType);
    setFilename(name);
  }, []);
  const close = useCallback(() => setSrc(null), []);
  return { src, type, filename, open, close, isOpen: !!src };
}

function sanitizeAttachmentName(name) {
  if (!name) return '';
  const base = String(name).split('/').pop().split('\\').pop();
  const noExt = base.replace(/\.[^.]+$/, '');
  return noExt.replace(/[^A-Za-z0-9._-]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 100);
}

// Force-download Cloudinary assets via fl_attachment (keeping the original name when
// known); other URLs fall back to raw.
function toDownloadUrl(url, filename) {
  if (!url) return url;
  if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
    const safe = sanitizeAttachmentName(filename);
    return url.replace('/upload/', `/upload/${safe ? `fl_attachment:${safe}` : 'fl_attachment'}/`);
  }
  return url;
}

export default function Lightbox({ src, type = 'image', filename, onClose }) {
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

      {/* Top action bar: download + close */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        <a
          href={toDownloadUrl(src, filename)}
          download={filename || true}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-colors cursor-pointer"
          aria-label="Download media"
          title="Download"
        >
          <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 11l5 5 5-5M12 4v12" />
          </svg>
          Download
        </a>
        <button
          onClick={onClose}
          className="size-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Close"
          type="button"
        >
          <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-5xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
        {type === 'video' ? (
          <video
            src={src}
            className="w-full max-h-[85vh] object-contain rounded-xl bg-black"
            controls
            autoPlay
            playsInline
            controlsList="nodownload"
          />
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
