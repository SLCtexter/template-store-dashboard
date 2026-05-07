import React from 'react';

const OrderSummary = ({ selectedTemplate, selectedFeatures }) => {
  const templatePrice = selectedTemplate?.price || 0;
  const featuresTotal = selectedFeatures.reduce((sum, f) => sum + f.price, 0);
  const total = templatePrice + featuresTotal;

  return (
    <div className="order-summary">
      <div className="order-row">
        <span>Selected Template</span>
        <span>LKR {templatePrice.toFixed(2)}</span>
      </div>
      {selectedFeatures.map(f => (
        <div key={f.id} className="order-row">
          <span>{f.name}</span>
          <span>LKR {f.price.toFixed(2)}</span>
        </div>
      ))}
      <div className="order-row" style={{ fontWeight: 'bold', borderTop: '1px solid #ca8a04', marginTop: '8px', paddingTop: '8px' }}>
        <span>Total</span>
        <span>LKR {total.toFixed(2)}</span>
      </div>
    </div>
  );
};

export default OrderSummary;