import React, { useState, useRef, useEffect } from 'react';

const TemplateCard = ({ template, isSelected, onSelect, onViewFull, onProceed, category }) => {
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef(null);
  const intervalRef = useRef(null);
  const userScrolling = useRef(false);

  const stopAuto = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    // ✅ startAuto function moved inside useEffect to satisfy ESLint exhaustive-deps
    const startAuto = (container) => {
      stopAuto();
      if (userScrolling.current) return;
      const maxScroll = container.scrollHeight - container.clientHeight;
      console.log('[Auto] maxScroll:', maxScroll);
      if (maxScroll <= 0) return;
      const startTime = Date.now();
      const duration = 6000;
      intervalRef.current = setInterval(() => {
        if (userScrolling.current) {
          stopAuto();
          return;
        }
        const elapsed = Math.min(1, (Date.now() - startTime) / duration);
        const ease = 1 - Math.pow(1 - elapsed, 3);
        container.scrollTop = maxScroll * ease;
        if (elapsed >= 1) stopAuto();
      }, 16);
    };

    const container = containerRef.current;
    if (!container) return;
    const img = container.querySelector('img');

    const onUserWheel = () => {
      if (!userScrolling.current) {
        userScrolling.current = true;
        stopAuto();
      }
    };

    if (isHovered && category === 'web' && template.fullImageUrl) {
      if (img && img.src !== template.fullImageUrl) {
        img.src = template.fullImageUrl;
        img.style.cssText = 'width: 100%; height: auto;';
      }
      container.classList.add('full-preview');
      userScrolling.current = false;
      container.scrollTop = 0;
      container.addEventListener('wheel', onUserWheel);

      const attemptAuto = () => {
        setTimeout(() => {
          if (isHovered && !userScrolling.current) {
            startAuto(container);
          }
        }, 500);
      };

      if (img?.complete && img.naturalHeight > 0) {
        attemptAuto();
      } else if (img) {
        img.onload = attemptAuto;
      } else {
        attemptAuto();
      }
    } else {
      if (!isSelected) {
        container.classList.remove('full-preview');
        if (img && img.src !== template.previewImageUrl) {
          img.src = template.previewImageUrl;
          img.style.cssText = 'width: 100%; height: 100%; object-fit: cover;';
        }
        container.scrollTop = 0;
      }
      stopAuto();
      container.removeEventListener('wheel', onUserWheel);
    }
  }, [isHovered, isSelected, category, template.fullImageUrl, template.previewImageUrl]);

  const handleMouseEnter = () => {
    if (category === 'web' && template.fullImageUrl) setIsHovered(true);
  };

  const handleMouseLeave = () => {
    if (!isSelected) setIsHovered(false);
  };

  // eslint-disable-next-line no-unused-vars
  const { name, price, previewImageUrl, fullImageUrl } = template;

  return (
    <div className={`ts-template-card ${isSelected ? 'selected' : ''}`} onClick={onSelect}>
      <div
        className="ts-preview-img"
        ref={containerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={(e) => {
          e.stopPropagation();
          if (category === 'web' && template.fullImageUrl) {
            setIsHovered(true);
          }
        }}
      >
        <img src={previewImageUrl} alt={name} />
      </div>
      <div className="ts-template-name">{name}</div>
      <div className="ts-template-price">LKR {price.toFixed(2)}</div>
      <button className="ts-view-template-btn" onClick={(e) => { e.stopPropagation(); onViewFull(); }}>
        View Template
      </button>
      <button className="ts-proceed-btn" onClick={(e) => { e.stopPropagation(); onProceed(); }} disabled={!isSelected}>
        Proceed
      </button>
    </div>
  );
};

export default TemplateCard;