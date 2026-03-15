// components/BoldRenderer.tsx

import React from 'react';

interface BoldRendererProps {
  text: string;
  className?: string;
}

const BoldRenderer: React.FC<BoldRendererProps> = ({ text, className }) => {
  if (!text) {
    return null;
  }
  const parts = text.split('**');

  return (
    <p className={className}>
      {parts.map((part, index) =>
        index % 2 === 1 ? <strong key={index}>{part}</strong> : <span key={index}>{part}</span>
      )}
    </p>
  );
};

export default BoldRenderer;
