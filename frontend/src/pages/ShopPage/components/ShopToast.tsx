import React from 'react';
import type { Toast } from '../../../types/shop';

interface ShopToastProps {
  toast: Toast;
}

const ShopToast: React.FC<ShopToastProps> = ({ toast }): React.JSX.Element | null => {
    if (!toast) return null;

    return (
        <div
        className={`shop-toast shop-toast--${toast.type}`}
        style={{
            position: 'fixed',
            top: '30px',
            right: '30px',
            zIndex: 99999,
            padding: '14px 24px',
            borderRadius: '12px',
            background: toast.type === 'success' ? 'rgba(21, 67, 39, 0.95)' : 'rgba(102, 26, 30, 0.95)',
            border: toast.type === 'success' ? '1px solid #2e7d32' : '1px solid #e63946',
            color: '#fff',
            fontWeight: 800,
            fontSize: '15px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            animation: 'slideIn 0.3s ease-out forwards',
        }}
        >
        <span>{toast.type === 'success' ? '🏆' : '⚠️'}</span>
        <span>{toast.message}</span>
        <style>{`
            @keyframes slideIn {
            from { transform: translateX(120%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
            }
        `}</style>
        </div>
    );
};

export default ShopToast;