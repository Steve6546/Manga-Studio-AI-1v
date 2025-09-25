import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { ChevronDown } from 'lucide-react';

// --- Context ---
interface SelectContextType {
    isOpen: boolean;
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
    value: string;
    onValueChange: (value: string) => void;
    selectedLabel: string;
    setSelectedLabel: React.Dispatch<React.SetStateAction<string>>;
    disabled?: boolean;
}
const SelectContext = createContext<SelectContextType | null>(null);
const useSelectContext = () => {
    const context = useContext(SelectContext);
    if (!context) throw new Error('Select components must be used within a Select provider');
    return context;
};

// --- Main Component ---
interface SelectProps {
    children: React.ReactNode;
    value: string;
    onValueChange: (value: string) => void;
    disabled?: boolean;
}
const Select: React.FC<SelectProps> = ({ children, value, onValueChange, disabled }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedLabel, setSelectedLabel] = useState('');
    return (
        <SelectContext.Provider value={{ isOpen, setIsOpen, value, onValueChange, selectedLabel, setSelectedLabel, disabled }}>
            <div className="relative">{children}</div>
        </SelectContext.Provider>
    );
};

// --- Trigger ---
const SelectTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
    ({ className, children, ...props }, ref) => {
        const { setIsOpen, disabled } = useSelectContext();
        return (
            <button
                ref={ref}
                type="button"
                className={cn("flex h-10 w-full items-center justify-between rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm ring-offset-background placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-600 disabled:cursor-not-allowed disabled:opacity-50", className)}
                onClick={() => !disabled && setIsOpen(prev => !prev)}
                disabled={disabled}
                {...props}
            >
                {children}
                <ChevronDown className="h-4 w-4 opacity-50" />
            </button>
        );
    }
);
SelectTrigger.displayName = "SelectTrigger";


// --- Value ---
const SelectValue = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement> & {placeholder?: string}>(
  ({ className, placeholder, ...props }, ref) => {
    const { value, selectedLabel } = useSelectContext();
    return <span ref={ref} className={cn(!value && "text-slate-400", className)} {...props}>{selectedLabel || placeholder}</span>
  }
);
SelectValue.displayName = "SelectValue";


// --- Content ---
const SelectContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, children, ...props }, ref) => {
        const { isOpen, setIsOpen, value, setSelectedLabel } = useSelectContext();
        const contentRef = useRef<HTMLDivElement>(null);

        useEffect(() => {
            const handleClickOutside = (event: MouseEvent) => {
                if (contentRef.current && !contentRef.current.contains(event.target as Node)) {
                    setIsOpen(false);
                }
            };
            if (isOpen) {
                document.addEventListener("mousedown", handleClickOutside);
            }
            return () => document.removeEventListener("mousedown", handleClickOutside);
        }, [isOpen, setIsOpen]);
        
        useEffect(() => {
            let foundLabel = '';
            // FIX: Use a generic type guard with React.isValidElement to safely access child props.
            React.Children.forEach(children, child => {
                if (React.isValidElement<{ value: string; children: React.ReactNode }>(child)) {
                    if (child.props.value === value) {
                        foundLabel = child.props.children as string;
                    }
                }
            });
            setSelectedLabel(foundLabel);
        }, [value, children, setSelectedLabel]);

        if (!isOpen) return null;

        return (
            <div
                ref={contentRef}
                className={cn("absolute top-full z-50 mt-2 w-full min-w-[8rem] overflow-hidden rounded-md border border-slate-800 bg-slate-900 text-slate-50 shadow-md animate-in fade-in-80", className)}
                {...props}
            >
                {children}
            </div>
        );
    }
);
SelectContent.displayName = "SelectContent";

// --- Item ---
const SelectItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { value: string }>(
    ({ className, children, value, ...props }, ref) => {
        const { onValueChange, setIsOpen } = useSelectContext();
        return (
            <div
                ref={ref}
                className={cn("relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-2 pr-2 text-sm outline-none hover:bg-slate-800 focus:bg-slate-800 data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className)}
                onClick={() => {
                    onValueChange(value);
                    setIsOpen(false);
                }}
                {...props}
            >
                {children}
            </div>
        );
    }
);
SelectItem.displayName = "SelectItem";


export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };