import React, { useEffect } from 'react';
import { IoCheckmarkCircle, IoInformationCircle, IoWarning, IoClose } from 'react-icons/io5';

interface ToastProps {
  message: string;
  show: boolean;
  onHide: () => void;
  type?: 'success' | 'info' | 'warning' | 'error';
}

export const Toast: React.FC<ToastProps> = ({ 
  message, 
  show, 
  onHide, 
  type = 'success' 
}) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onHide, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onHide]);

  if (!show) return null;

  const getStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-gradient-to-r from-emerald-500 to-green-500',
          icon: <IoCheckmarkCircle size={24} />,
        };
      case 'info':
        return {
          bg: 'bg-gradient-to-r from-blue-500 to-cyan-500',
          icon: <IoInformationCircle size={24} />,
        };
      case 'warning':
        return {
          bg: 'bg-gradient-to-r from-orange-500 to-amber-500',
          icon: <IoWarning size={24} />,
        };
      case 'error':
        return {
          bg: 'bg-gradient-to-r from-red-500 to-pink-500',
          icon: <IoClose size={24} />,
        };
      default:
        return {
          bg: 'bg-gradient-to-r from-emerald-500 to-green-500',
          icon: <IoCheckmarkCircle size={24} />,
        };
    }
  };

  const styles = getStyles();

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-slide-up max-w-[90vw]">
      <div className={`${styles.bg} text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-sm`}>
        <div className="animate-bounce-slow">
          {styles.icon}
        </div>
        <span className="font-semibold text-sm sm:text-base">{message}</span>
        <button 
          onClick={onHide}
          className="ml-2 p-1 hover:bg-white/20 rounded-full transition-colors touch-feedback"
          aria-label="Close"
        >
          <IoClose size={18} />
        </button>
      </div>
    </div>
  );
};