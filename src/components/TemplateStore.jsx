import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TemplateGrid from './TemplateGrid';
import './TemplateStore.css';

const TemplateStore = () => {
  const [category, setCategory] = useState('web');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const navigate = useNavigate();

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setSelectedFeatures([]);
  };

  const handleProceed = (template) => {
    navigate('/checkout', { state: { selectedTemplate: template, selectedFeatures: selectedFeatures } });
  };

  return (
    <div className="ts-dashboard">
      <div className="ts-header">
        <h1>Test InviteYou.lk</h1>
        <p>Select a template and proceed to checkout</p>
      </div>

      <div className="ts-categories">
        {['web', 'pdf', 'image'].map(cat => (
          <button
            key={cat}
            className={`ts-cat-btn ${category === cat ? 'active' : ''}`}
            onClick={() => {
              setCategory(cat);
              setSelectedTemplate(null);
              setSelectedFeatures([]);
            }}
          >
            {cat === 'web' ? 'Web Templates' : cat === 'pdf' ? 'PDF Templates' : 'Image Templates'}
          </button>
        ))}
      </div>

      <div className="ts-content">
        <div className="ts-templates-area">
          <h3>Available Templates</h3>
          <TemplateGrid
            category={category}
            onTemplateSelect={handleTemplateSelect}
            selectedTemplateId={selectedTemplate?.id}
            onProceed={handleProceed}
          />
        </div>
      </div>

      <footer className="ts-footer">Payment Dashboard - perpova</footer>
    </div>
  );
};

export default TemplateStore;