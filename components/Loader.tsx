import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface LoaderProps {
    className?: string;
    text?: string;
}

const Loader: React.FC<LoaderProps> = ({ className, text }) => {
    return (
        <div className={cn("flex flex-col items-center justify-center gap-4 text-slate-400", className)}>
            <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
            {text && <p className="text-sm">{text}</p>}
        </div>
    );
};

export default Loader;
