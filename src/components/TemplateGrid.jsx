import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import TemplateCard from './TemplateCard';

const TemplateGrid = ({ category, onTemplateSelect, selectedTemplateId, onProceed }) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categoryId, setCategoryId] = useState(null);

  useEffect(() => {
    const fetchCategoryId = async () => {
      if (!category) return;
      try {
        const q = query(collection(db, 'categories'), where('name', '==', category));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          setCategoryId(snapshot.docs[0].id);
        } else {
          setError('Category not found');
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load category');
      }
    };
    fetchCategoryId();
  }, [category]);

  useEffect(() => {
    if (!categoryId) return;
    const fetchTemplates = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'templates'), where('categoryId', '==', categoryId), orderBy('name'));
        const querySnapshot = await getDocs(q);
        const templatesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setTemplates(templatesData);
        setError(null);
      } catch (err) {
        console.error("Error fetching templates:", err);
        setError("Failed to load templates");
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, [categoryId]);

  const handleViewFull = (fullImageUrl) => {
    if (fullImageUrl) {
      window.open(fullImageUrl, '_blank');
    } else {
      alert('Full preview not available for this template.');
    }
  };

  if (loading) return <div className="loading">Loading templates...</div>;
  if (error) return <div className="loading">⚠️ {error}</div>;
  if (templates.length === 0) return <div className="loading">No templates found</div>;

  return (
    <div className="ts-template-grid">
      {templates.map(template => (
        <TemplateCard
          key={template.id}
          template={template}
          isSelected={selectedTemplateId === template.id}
          onSelect={() => onTemplateSelect(template)}
          onViewFull={() => handleViewFull(template.fullImageUrl)}
          onProceed={() => onProceed(template)}
          category={category}
        />
      ))}
    </div>
  );
};

export default TemplateGrid;