import React, { useState, useRef, useEffect } from 'react';

const TemplateCard = ({ template, isSelected, onSelect, onViewFull, onProceed, category }) => {
  const [showModal, setShowModal] = useState(false);
  const modalContentRef = useRef(null);
  const intervalRef = useRef(null);
  const userScrolling = useRef(false);

  const stopAuto = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    // startAuto function moved inside useEffect to satisfy ESLint exhaustive-deps
    const startAuto = (container) => {
      stopAuto();
      if (userScrolling.current) return;
      const maxScroll = container.scrollHeight - container.clientHeight;
      if (maxScroll <= 0) return;
      const startTime = Date.now();
      const duration = 4000;
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

    const container = modalContentRef.current;
    if (!container || !showModal) return;

    const onUserWheel = () => {
      if (!userScrolling.current) {
        userScrolling.current = true;
        stopAuto();
      }
    };
    userScrolling.current = false;
    container.scrollTop = 0;
    container.addEventListener('wheel', onUserWheel);

    const img = container.querySelector('img');
    const attemptAuto = () => {
      setTimeout(() => {
        if (showModal && !userScrolling.current) {
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

    return () => {
      stopAuto();
      container.removeEventListener('wheel', onUserWheel);
    };
  }, [showModal, category, template.fullImageUrl]);

  const handleMouseEnter = () => {
    if (category === 'web' && template.fullImageUrl) {
      setShowModal(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isSelected) {
      setShowModal(false);
      stopAuto();
      userScrolling.current = false;
    }
  };

  // eslint-disable-next-line no-unused-vars
  const { name, price, previewImageUrl, fullImageUrl } = template;

  return (
    <>
      <div className={`ts-template-card ${isSelected ? 'selected' : ''}`} onClick={onSelect}>
        <div className="ts-preview-img" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
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

      {showModal && template.fullImageUrl && (
        <div
          className="ts-full-modal"
          onMouseEnter={() => setShowModal(true)}
          onMouseLeave={() => {
            if (!isSelected) {
              setShowModal(false);
              stopAuto();
              userScrolling.current = false;
            }
          }}
        >
          <div
            ref={modalContentRef}
            style={{
              height: '500px',
              overflowY: 'auto',
              padding: '16px',
              textAlign: 'center',
              background: 'white',
              borderRadius: '12px',
            }}
          >
            <img src={template.fullImageUrl} alt={name} style={{ width: '100%', height: 'auto', display: 'block' }} />
          </div>
        </div>
      )}
    </>
  );
};

export default TemplateCard;