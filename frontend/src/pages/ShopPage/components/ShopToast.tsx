import React from 'react';
import type { Toast } from '../../../types/shop';

interface ShopToastProps {
  toast: Toast;
}

const ShopToast: React.FC<ShopToastProps> = ({ toast }): React.JSX.Element | null => {
  if (!toast) return null;

  return (
    <div className={`shop-toast shop-toast--${toast.type}`}>
      <span>{toast.type === 'success' ? '🏆' : '⚠️'}</span>
      <span>{toast.message}</span>
    </div>
  );
};

export default ShopToast;