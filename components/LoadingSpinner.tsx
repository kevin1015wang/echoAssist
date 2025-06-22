
import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'medium', color = 'currentColor', className = '' }) => {
  const sizeClasses = {
    small: 'w-4 h-4 border-2',
    medium: 'w-8 h-8 border-4',
    large: 'w-12 h-12 border-[6px]',
  };

  return (
    <div
      className={`animate-spin rounded-full ${sizeClasses[size]} border-solid border-t-transparent ${className}`}
      style={{ borderColor: color, borderTopColor: 'transparent' }}
      role="status"
      aria-label="Loading"
    ></div>
  );
};
