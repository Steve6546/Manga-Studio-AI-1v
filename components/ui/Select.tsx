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
        const { setIsOpen, disabled, selectedLabel } = useSelectContext();
        return (
            <button
                ref={ref}
                type="button"
                className={cn("flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50", className)}
                onClick={() => !disabled && setIsOpen(prev => !prev)}
                disabled={disabled}
                {...props}
            >
                {children || selectedLabel}
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
    return <span ref={ref} className={cn(!value && "text-muted-foreground", className)} {...props}>{selectedLabel || placeholder}</span>
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
                if (React.isValidElement<{ value: string; children: React.ReactNode }>(child) && child.type === SelectItem) {
                    if (child.props.value === value) {
                        // Attempt to extract string content from children
                        if (typeof child.props.children === 'string') {
                            foundLabel = child.props.children;
// FIX: The original code was attempting to access `props.children` on an inner React element without proper type guarding, leading to a TypeScript error where `props` was inferred as `unknown`. This has been fixed by applying a generic type guard `React.isValidElement<{ children?: React.ReactNode }>` to the inner element. This ensures that `child.props.children` is correctly typed as a React element with an optional `children` prop, allowing safe access and resolving the error.
                        } else if (React.isValidElement<{ children?: React.ReactNode }>(child.props.children)) {
                            const innerElement = child.props.children;
                            if (typeof innerElement.props.children === 'string') {
                                foundLabel = innerElement.props.children;
                            }
                        }
                    }
                }
            });
            setSelectedLabel(foundLabel);
        }, [value, children, setSelectedLabel]);

        if (!isOpen) return null;

        return (
            <div
                ref={contentRef}
                className={cn("absolute top-full z-50 mt-2 w-full min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-80", className)}
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
        const { onValueChange, setIsOpen, setSelectedLabel } = useSelectContext();
        return (
            <div
                ref={ref}
                className={cn("relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-2 pr-2 text-sm outline-none hover:bg-accent focus:bg-accent data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className)}
                onClick={() => {
                    onValueChange(value);
                    if (typeof children === 'string') {
                       setSelectedLabel(children);
                    }
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