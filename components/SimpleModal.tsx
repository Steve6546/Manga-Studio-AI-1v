
import React from 'react';
import Button from './Button';

interface SimpleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const SimpleModal: React.FC<SimpleModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-gray-900 bg-opacity-80 flex items-center justify-center p-4 z-50 transition-opacity duration-300 ease-in-out"
      aria-modal="true"
      role="dialog"
      onClick={onClose} // Close on backdrop click
    >
      <div 
        className="bg-gray-800 p-6 rounded-lg shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        <h2 className="text-xl font-bold text-sky-400 mb-4">{title}</h2>
        <div className="text-gray-300 mb-6 overflow-y-auto scrollbar-thin scrollbar-thumb-sky-600 scrollbar-track-gray-700 flex-grow">
          {children}
        </div>
        <Button onClick={onClose} variant="primary" className="mt-auto self-center px-8">
          إغلاق
        </Button>
      </div>
    </div>
  );
};

export default SimpleModal;