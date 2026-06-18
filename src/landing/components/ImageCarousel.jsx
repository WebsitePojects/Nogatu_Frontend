import { useEffect, useState } from 'react';

export default function ImageCarousel({
  images,
  alt,
  className = '',
  stageClassName = '',
  imageClassName = '',
  onImageClick,
  autoPlay = true,
  interval = 3600,
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const safeImages = Array.isArray(images) ? images.filter(Boolean) : [];

  useEffect(() => {
    setActiveIndex(0);
  }, [safeImages.length]);

  useEffect(() => {
    if (!autoPlay || safeImages.length <= 1) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % safeImages.length);
    }, interval);

    return () => window.clearInterval(timer);
  }, [autoPlay, interval, safeImages.length]);

  if (safeImages.length === 0) {
    return null;
  }

  const goTo = (nextIndex) => {
    setActiveIndex((nextIndex + safeImages.length) % safeImages.length);
  };

  const currentImage = safeImages[activeIndex];

  return (
    <div className={`image-carousel ${className}`.trim()}>
      <div className={`image-carousel-stage ${stageClassName}`.trim()}>
        <img
          src={currentImage}
          alt={safeImages.length > 1 ? `${alt} ${activeIndex + 1}` : alt}
          className={`image-carousel-image ${imageClassName}`.trim()}
          loading="lazy"
          onClick={() => onImageClick?.(currentImage)}
        />

        {safeImages.length > 1 && (
          <>
            <button
              type="button"
              className="image-carousel-control image-carousel-control-prev"
              aria-label={`Previous ${alt} image`}
              onClick={() => goTo(activeIndex - 1)}
            >
              <span aria-hidden="true">‹</span>
            </button>
            <button
              type="button"
              className="image-carousel-control image-carousel-control-next"
              aria-label={`Next ${alt} image`}
              onClick={() => goTo(activeIndex + 1)}
            >
              <span aria-hidden="true">›</span>
            </button>
            <div className="image-carousel-dots" aria-hidden="true">
              {safeImages.map((image, index) => (
                <button
                  key={image}
                  type="button"
                  className={`image-carousel-dot ${index === activeIndex ? 'is-active' : ''}`}
                  onClick={() => goTo(index)}
                  aria-label={`Show ${alt} image ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
