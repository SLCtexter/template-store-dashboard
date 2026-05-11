import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import './TemplateStore.css';

const CheckoutPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedTemplate, selectedFeatures: initialFeatures } = location.state || {};
  const [selectedFeatures, setSelectedFeatures] = useState(initialFeatures || []);
  const [features, setFeatures] = useState([]);
  const [processingMethod, setProcessingMethod] = useState(null); // 'payhere' or 'paypal'

  useEffect(() => {
    const fetchFeatures = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'additionalFeatures'));
        const featuresData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setFeatures(featuresData);
      } catch (error) {
        console.error("Error fetching features:", error);
      }
    };
    fetchFeatures();
  }, []);

  if (!selectedTemplate) {
    return (
      <div className="ts-loading">
        No template selected. <button onClick={() => navigate('/templates')}>Go back</button>
      </div>
    );
  }

  const toggleFeature = (feature) => {
    const exists = selectedFeatures.some(f => f.id === feature.id);
    if (exists) {
      setSelectedFeatures(selectedFeatures.filter(f => f.id !== feature.id));
    } else {
      setSelectedFeatures([...selectedFeatures, feature]);
    }
  };

  const total = selectedTemplate.price + selectedFeatures.reduce((sum, f) => sum + f.price, 0);

  // ---------- PayHere Payment ----------
  const handlePayHerePayment = async () => {
    setProcessingMethod('payhere');
    const orderData = {
      templateId: selectedTemplate.id,
      templateName: selectedTemplate.name,
      templatePrice: selectedTemplate.price,
      selectedFeatures: selectedFeatures.map(f => ({ id: f.id, name: f.name, price: f.price })),
      totalAmount: total,
      currency: "LKR",
      status: "pending",
      paymentMethod: "payhere",
      createdAt: new Date().toISOString()
    };
    try {
      const docRef = await addDoc(collection(db, "orders"), orderData);
      const orderId = docRef.id;
      const apiUrl = '/.netlify/functions/payhere-hash';
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, amount: total })
      });
      const data = await response.json();
      if (!data.hash) throw new Error("Invalid hash response");
      const payhereHash = data.hash;

      const form = document.createElement('form');
      form.method = 'POST';
      form.action = 'https://sandbox.payhere.lk/pay/checkout';
      const fields = {
        merchant_id: '1234923',
        return_url: 'https://testdashboard.infinityfree.me/thankyou.html',
        cancel_url: 'https://testdashboard.infinityfree.me/',
        notify_url: 'https://testdashboard.infinityfree.me/api/payhere-hash.php',
        order_id: orderId,
        items: selectedTemplate.name,
        currency: 'LKR',
        amount: total.toFixed(2),
        first_name: 'Customer',
        last_name: 'User',
        email: 'customer@example.com',
        phone: '0771234567',
        address: 'Colombo',
        city: 'Colombo',
        country: 'Sri Lanka',
        hash: payhereHash,
      };
      for (const [key, value] of Object.entries(fields)) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value;
        form.appendChild(input);
      }
      document.body.appendChild(form);
      form.submit();
    } catch (error) {
      console.error("Payment error:", error);
      alert("Payment initialization failed. Please try again.");
      setProcessingMethod(null);
    }
  };

  // ---------- PayPal Redirect Payment ----------
  const handlePayPalPayment = async () => {
    setProcessingMethod('paypal');
    const orderData = {
      templateId: selectedTemplate.id,
      templateName: selectedTemplate.name,
      templatePrice: selectedTemplate.price,
      selectedFeatures: selectedFeatures.map(f => ({ id: f.id, name: f.name, price: f.price })),
      totalAmount: total,
      currency: "USD", // use USD for sandbox
      status: "pending",
      paymentMethod: "paypal",
      createdAt: new Date().toISOString()
    };
    try {
      const docRef = await addDoc(collection(db, "orders"), orderData);
      const orderId = docRef.id;
      // Call Netlify function to create PayPal order
      const res = await fetch('/.netlify/functions/create-paypal-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: total, currency: 'USD', orderId })
      });
      const data = await res.json();
      if (data.approval_url) {
        sessionStorage.setItem('pendingPayPalOrderId', orderId);
        window.location.href = data.approval_url;
      } else {
        throw new Error('No approval URL');
      }
    } catch (error) {
      console.error("PayPal create error:", error);
      alert("Could not initiate PayPal payment. Please try again.");
      setProcessingMethod(null);
    }
  };

  const fullImageUrl = selectedTemplate.fullImageUrl || selectedTemplate.previewImageUrl;

  return (
    <div className="ts-checkout-container">
      <div className="ts-checkout-header">
        <h1>Checkout</h1>
        <button className="ts-back-btn" onClick={() => navigate('/templates')}>Back to Templates</button>
      </div>

      <div className="ts-checkout-content">
        {/* Live Preview Section */}
        <div className="ts-checkout-preview">
          <h3>Live Preview (Full Image)</h3>
          <div className="ts-preview-box">
            <div style={{ height: '400px', overflowY: 'auto', background: '#e2e8f0', borderRadius: '8px' }}>
              <img src={fullImageUrl} alt={selectedTemplate.name} style={{ width: '100%', height: 'auto' }} />
            </div>
            <p><strong>{selectedTemplate.name}</strong></p>
          </div>
        </div>

        {/* Additional Features Section */}
        <div className="ts-checkout-features">
          <h3>Additional Features</h3>
          <div className="ts-features-grid">
            {features.map(feature => (
              <label key={feature.id} className="ts-feature-item">
                <input
                  type="checkbox"
                  checked={selectedFeatures.some(f => f.id === feature.id)}
                  onChange={() => toggleFeature(feature)}
                />
                {feature.name} (+LKR {feature.price.toFixed(2)})
              </label>
            ))}
          </div>
        </div>

        {/* Payment Section */}
        <div className="ts-checkout-summary">
          <div className="ts-order-summary">
            <div className="ts-order-row">
              <span>Selected Template</span>
              <span>LKR {selectedTemplate.price.toFixed(2)}</span>
            </div>
            {selectedFeatures.map(feature => (
              <div key={feature.id} className="ts-order-row">
                <span>{feature.name}</span>
                <span>+ LKR {feature.price.toFixed(2)}</span>
              </div>
            ))}
            <div className="ts-order-row" style={{ fontWeight: 'bold', borderTop: '1px solid #ca8a04', marginTop: '8px', paddingTop: '8px' }}>
              <span>Total</span>
              <span>LKR {total.toFixed(2)}</span>
            </div>
          </div>

          <div style={{ marginTop: '20px' }}>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '12px', fontSize: '16px' }}>
              Pay with
            </label>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <button
                disabled={processingMethod !== null}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: processingMethod === 'payhere' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'white',
                  color: processingMethod === 'payhere' ? 'white' : '#333',
                  border: processingMethod === 'payhere' ? 'none' : '2px solid #e2e8f0',
                  borderRadius: '12px',
                  fontWeight: '600',
                  cursor: processingMethod ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!processingMethod) e.currentTarget.style.borderColor = '#667eea';
                }}
                onMouseLeave={(e) => {
                  if (!processingMethod) e.currentTarget.style.borderColor = '#e2e8f0';
                }}
                onClick={handlePayHerePayment}
              >
                {processingMethod === 'payhere' ? 'Processing...' : 'PayHere'}
              </button>

              {/* PayPal Button */}
              <button
                disabled={processingMethod !== null}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: processingMethod === 'paypal' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'white',
                  color: processingMethod === 'paypal' ? 'white' : '#333',
                  border: processingMethod === 'paypal' ? 'none' : '2px solid #e2e8f0',
                  borderRadius: '12px',
                  fontWeight: '600',
                  cursor: processingMethod ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!processingMethod) e.currentTarget.style.borderColor = '#667eea';
                }}
                onMouseLeave={(e) => {
                  if (!processingMethod) e.currentTarget.style.borderColor = '#e2e8f0';
                }}
                onClick={handlePayPalPayment}
              >
                {processingMethod === 'paypal' ? 'Processing...' : 'PayPal'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;