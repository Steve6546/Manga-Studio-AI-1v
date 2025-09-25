import React from 'react';
import { Button, buttonVariants } from './ui/Button';
import { cn } from '../lib/utils';
import { X } from 'lucide-react';

interface SimpleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  onConfirm?: () => void;
  confirmText?: string;
  confirmVariant?: VariantProps<typeof buttonVariants>["variant"];
  cancelText?: string;
}

const SimpleModal: React.FC<SimpleModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  onConfirm,
  confirmText = "Confirm",
  confirmVariant = "default",
  cancelText = "Cancel",
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in-0"
      aria-modal="true"
      role="dialog"
      onClick={onClose}
    >
      <div 
        className="relative bg-card p-6 rounded-lg shadow-lg w-full max-w-md max-h-[80vh] flex flex-col border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
            <div className="space-y-1">
                <h2 className="text-xl font-bold text-foreground">{title}</h2>
                {description && <p className="text-sm text-muted-foreground">{description}</p>}
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="absolute top-3 right-3">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
            </Button>
        </div>

        <div className="text-muted-foreground mb-6 overflow-y-auto flex-grow">
          {children}
        </div>

        <div className="flex justify-end gap-2 mt-auto">
            <Button onClick={onClose} variant="outline">
                {cancelText}
            </Button>
            {onConfirm && (
                <Button onClick={onConfirm} variant={confirmVariant}>
                    {confirmText}
                </Button>
            )}
        </div>
      </div>
    </div>
  );
};

export default SimpleModal;