import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

const FeatureSelector = ({ selectedFeatures, onFeatureChange }) => {
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatures = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'additionalFeatures'));
        const featuresData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setFeatures(featuresData);
      } catch (error) {
        console.error("Error fetching features:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatures();
  }, []);

  const handleCheckboxChange = (featureId, price, name) => {
    const isChecked = selectedFeatures.some(f => f.id === featureId);
    if (isChecked) {
      onFeatureChange(selectedFeatures.filter(f => f.id !== featureId));
    } else {
      onFeatureChange([...selectedFeatures, { id: featureId, price, name }]);
    }
  };

  if (loading) return <div className="loading">Loading features...</div>;

  return (
    <div className="features-grid">
      {features.map(feature => (
        <label key={feature.id} className="feature-item">
          <input
            type="checkbox"
            checked={selectedFeatures.some(f => f.id === feature.id)}
            onChange={() => handleCheckboxChange(feature.id, feature.price, feature.name)}
          />
          {feature.name} (+LKR {feature.price.toFixed(2)})
        </label>
      ))}
    </div>
  );
};

export default FeatureSelector;